// app/api/ads/intelligence/hub/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { resolveDateRange, DatePreset } from '@/lib/dateRange'
import { buildAttributionDataset, CampaignAttributionResult, isFuzzyCampaignMatch } from '@/lib/attribution'
import { fetchGA4LandingPages } from '@/lib/ga4-api'
import { generateInsights } from '@/lib/insights-engine'
import { calculateAccountHealthScore } from '@/lib/health-score'
import { fetchMetaAccountOverview, fetchMetaCampaigns } from '@/lib/meta-api'
import { fetchGoogleAccountOverview, fetchGoogleCampaigns } from '@/lib/google-ads-api'
import { getActiveConfiguration } from '@/lib/configurations-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let activeLabel = null
    if (user.role === 'viewer') {
      const grants = await getValidAccessGrantsForRecipient(user.email)
      const activeGrant = grants[0]
      if (!activeGrant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('ads', user.role, activeLabel)
    if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')
    const preset = (searchParams.get('preset') as any) || 'last_7_days'
    const bypassCache = searchParams.get('refresh') === 'true'
    const dateRange = resolveDateRange(preset, fromStr || undefined, toStr || undefined)

    // Load active configuration for real credentials
    const activeConfig = await getActiveConfiguration()
    const metaAccountId = activeConfig?.metaAdAccountId || undefined
    const metaAccessToken = activeConfig?.metaAccessToken || undefined
    const googleDevToken = activeConfig?.googleDeveloperToken || undefined
    const googleClientId = activeConfig?.googleClientId || undefined
    const googleClientSecret = activeConfig?.googleClientSecret || undefined
    const googleRefreshToken = activeConfig?.googleRefreshToken || undefined
    const googleCustomerId = activeConfig?.googleCustomerId || undefined
    const googleManagerId = activeConfig?.googleManagerId || undefined
    const telecrmToken = activeConfig?.telecrmApiToken || undefined
    const telecrmEnterpriseId = activeConfig?.telecrmEnterpriseId || undefined

    // Parallel fetch from all channels using real credentials
    const [
      metaOverview,
      metaCampaigns,
      googleOverview,
      googleCampaigns,
      landingPages,
      attributedLeads
    ] = await Promise.all([
      fetchMetaAccountOverview(dateRange, metaAccountId, metaAccessToken),
      fetchMetaCampaigns(dateRange, metaAccountId, metaAccessToken),
      fetchGoogleAccountOverview(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
      fetchGoogleCampaigns(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
      fetchGA4LandingPages(dateRange, bypassCache),
      buildAttributionDataset({ from: new Date(dateRange.from), to: new Date(dateRange.to) }, telecrmToken, telecrmEnterpriseId, bypassCache)
    ])

    // Total metrics
    const totalSpend = metaOverview.spend + googleOverview.spend
    const totalImpressions = metaOverview.impressions + googleOverview.impressions
    const totalClicks = metaOverview.clicks + googleOverview.clicks
    
    const metaLeadsCount = metaOverview.leadFormFills + metaOverview.websiteLeads
    const googleLeadsCount = googleOverview.formSubmissions
    const totalLeadsCRM = attributedLeads.length
    
    // Group campaigns and calculate metrics
    const adCampaignNames = new Set<string>()
    metaCampaigns.forEach(c => adCampaignNames.add(c.name))
    googleCampaigns.forEach(c => adCampaignNames.add(c.name))

    const leadCampaignNames = new Set(
      attributedLeads
        .map(l => l.campaignName)
        .filter(Boolean) as string[]
    )

    const campaignNames = Array.from(new Set([
      ...adCampaignNames,
      ...leadCampaignNames,
      'Organic Traffic'
    ]))

    const campaignsAttribution: CampaignAttributionResult[] = campaignNames.map(name => {
      // Find matching campaign spend
      let campaignSpend = 0
      let platform: CampaignAttributionResult['platform'] = 'other'
      let status: CampaignAttributionResult['status'] = 'PAUSED'
      let adLeads = 0
      const metaC = metaCampaigns.find(c => c.id === name || isFuzzyCampaignMatch(c.name, name))
      const googleC = googleCampaigns.find(c => c.id === name || isFuzzyCampaignMatch(c.name, name))
      if (metaC) {
        campaignSpend = metaC.spend
        platform = 'meta'
        status = metaC.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'
        adLeads = metaC.totalConversions || 0
      } else if (googleC) {
        campaignSpend = googleC.spend
        platform = 'google'
        status = googleC.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED'
        adLeads = googleC.conversions || 0
      } else {
        const nameLower = name.toLowerCase()
        if (nameLower.includes('organic')) {
          platform = 'organic'
          status = 'ACTIVE'
        } else if (nameLower.includes('direct') || nameLower.includes('website')) {
          platform = 'direct'
          status = 'ACTIVE'
        } else if (nameLower.includes('referral')) {
          platform = 'referral'
          status = 'ACTIVE'
        } else {
          const sampleLead = attributedLeads.find(l => isFuzzyCampaignMatch(l.campaignName || '', name))
          if (sampleLead) {
            platform = sampleLead.channel === 'meta' ? 'meta' : sampleLead.channel === 'google' ? 'google' : 'other'
          }
        }
      }
      
      const leadsForCampaign = attributedLeads.filter(l => isFuzzyCampaignMatch(l.campaignName || '', name))
      const enrolled = leadsForCampaign.filter(l => l.isEnrolled)
      const hp = leadsForCampaign.filter(l => l.category === 'High Potential')
      
      const total = leadsForCampaign.length
      const costPerLead = total > 0 ? campaignSpend / total : 0
      const costPerEnrolled = enrolled.length > 0 ? campaignSpend / enrolled.length : 0
      const costPerHighPotential = hp.length > 0 ? campaignSpend / hp.length : 0
      const rev = enrolled.reduce((sum, l) => sum + l.feeValue, 0)
      const trueROAS = campaignSpend > 0 ? rev / campaignSpend : 0

      return {
        campaignName: name,
        platform,
        status,
        totalLeads: total,
        adLeads,
        enrolledLeads: enrolled.length,
        highPotentialLeads: hp.length,
        conversionRate: total > 0 ? parseFloat(((enrolled.length / total) * 100).toFixed(2)) : 0,
        attributedRevenue: rev,
        spend: campaignSpend,
        costPerLead: parseFloat(costPerLead.toFixed(1)),
        costPerEnrolled: parseFloat(costPerEnrolled.toFixed(1)),
        costPerHighPotential: parseFloat(costPerHighPotential.toFixed(1)),
        trueROAS: parseFloat(trueROAS.toFixed(2))
      }
    })

    const enrolledTotal = attributedLeads.filter(l => l.isEnrolled).length
    const totalRevenue = attributedLeads.filter(l => l.isEnrolled).reduce((sum, l) => sum + l.feeValue, 0)
    
    // Mock keywords to evaluate keyword quality insights
    const keywordsData = [
      { text: 'oracle fusion scm training', spend: totalSpend * 0.15, conversions: Math.round(enrolledTotal * 0.2) },
      { text: 'oracle fusion financials certification', spend: totalSpend * 0.12, conversions: Math.round(enrolledTotal * 0.15) },
      { text: 'free oracle courses online', spend: 6500, conversions: 0 } // waste keyword trigger
    ]

    // Frequency and QS averages
    const metaFrequencyAvg = metaOverview.frequency || 2.1
    const googleQSAvg = googleCampaigns.length > 0
      ? googleCampaigns.reduce((sum, c) => sum + ((c as any).qualityScore || 7), 0) / googleCampaigns.length
      : 7.2
    
    const qualityLeadsCount = attributedLeads.filter(l => ['Enrolled', 'High Potential'].includes(l.category)).length
    const qualityLeadRate = totalLeadsCRM > 0 ? (qualityLeadsCount / totalLeadsCRM) * 100 : 0
    const avgCPL = totalLeadsCRM > 0 ? totalSpend / totalLeadsCRM : 0

    // Health Score calculation
    const health = calculateAccountHealthScore({
      avgCPL,
      targetCPL: 600, // target benchmark CPL
      enrollmentROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      qualityLeadRate,
      budgetPacing: 102, // optimal pace placeholder
      frequencyAvg: metaFrequencyAvg,
      qualityScoreAvg: googleQSAvg,
      responseRate: 78 // team speed response
    })

    // Insights generation
    const insights = generateInsights(
      campaignsAttribution,
      landingPages,
      metaFrequencyAvg,
      keywordsData,
      totalSpend
    )

    return NextResponse.json({
      health,
      insights,
      campaignsAttribution,
      summary: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalLeadsCRM,
        enrolledTotal,
        totalRevenue,
        trueROAS: totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0,
        cpe: enrolledTotal > 0 ? parseFloat((totalSpend / enrolledTotal).toFixed(1)) : 0
      }
    })
  } catch (error: any) {
    console.error('Ads Intel Hub API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
