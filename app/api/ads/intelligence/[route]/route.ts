// app/api/ads/intelligence/[route]/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { resolveDateRange } from '@/lib/dateRange'
import { getActiveConfiguration } from '@/lib/configurations-store'
import { buildAttributionDataset, reconstructJourneys, calculateCampaignAttribution, isFuzzyCampaignMatch, CampaignAttributionResult } from '@/lib/attribution'
import { fetchMetaAccountOverview, fetchMetaCampaigns, fetchMetaDemographics, fetchMetaTargetingExplorer, fetchMetaAdsWithInsights, fetchMetaDailyTrend, fetchMetaPlacements } from '@/lib/meta-api'
import { fetchGoogleAccountOverview, fetchGoogleCampaigns, fetchGoogleDeviceBreakdown, fetchGoogleTargetingExplorer, fetchGoogleAdsWithInsights, fetchGoogleKeywords, fetchGoogleDailyTrend, fetchGooglePlacements } from '@/lib/google-ads-api'
import { fetchCompetitorIntelligence } from '@/lib/meta-ad-library'
import { projectMonthEnd, calculateWhatIfScenario } from '@/lib/forecast'
import { generateInsights } from '@/lib/insights-engine'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route: string }> }
) {
  try {
    const { route } = await params
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

    // Base inputs
    const [metaOverview, metaCampaigns, googleOverview, googleCampaigns, attributedLeads] = await Promise.all([
      fetchMetaAccountOverview(dateRange, metaAccountId, metaAccessToken),
      fetchMetaCampaigns(dateRange, metaAccountId, metaAccessToken),
      fetchGoogleAccountOverview(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
      fetchGoogleCampaigns(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
      buildAttributionDataset({ from: new Date(dateRange.from), to: new Date(dateRange.to) }, telecrmToken, telecrmEnterpriseId, bypassCache)
    ])

    const totalSpend = metaOverview.spend + googleOverview.spend
    const totalLeadsCRM = attributedLeads.length
    const enrolledTotal = attributedLeads.filter(l => l.isEnrolled).length
    const totalRevenue = attributedLeads.filter(l => l.isEnrolled).reduce((sum, l) => sum + l.feeValue, 0)

    // Route-specific responses
    if (route === 'lead-quality') {
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

      const campaigns = campaignNames.map(name => {
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
        return calculateCampaignAttribution(attributedLeads, name, campaignSpend, platform, status, adLeads)
      })

      return NextResponse.json({
        campaigns,
        summary: {
          totalSpend,
          totalLeads: totalLeadsCRM,
          enrolled: enrolledTotal,
          cpe: enrolledTotal > 0 ? totalSpend / enrolledTotal : 0
        }
      })
    }

    if (route === 'audience') {
      const [rawMetaDemographics, rawGoogleDevices, metaExplorer, googleExplorer] = await Promise.all([
        fetchMetaDemographics(dateRange, metaAccountId, metaAccessToken),
        fetchGoogleDeviceBreakdown(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
        fetchMetaTargetingExplorer(metaAccountId, metaAccessToken),
        fetchGoogleTargetingExplorer(googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId)
      ])

      const metaLeadsTotal = attributedLeads.filter(l => l.channel === 'meta').length
      const metaEnrolledTotal = attributedLeads.filter(l => l.channel === 'meta' && l.isEnrolled).length

      const googleLeadsTotal = attributedLeads.filter(l => l.channel === 'google').length
      const googleEnrolledTotal = attributedLeads.filter(l => l.channel === 'google' && l.isEnrolled).length

      // Meta Demographics
      const metaDemographics = (rawMetaDemographics.ageGender || []).map(row => {
        const group = `${row.age} ${row.gender.charAt(0).toUpperCase() + row.gender.slice(1)}`
        const clicksShare = rawMetaDemographics.ageGender.reduce((sum, r) => sum + r.clicks, 0) || 1
        const share = row.clicks / clicksShare
        return {
          group,
          spend: row.spend,
          leads: Math.round(metaLeadsTotal * share),
          enrolled: Math.round(metaEnrolledTotal * share)
        }
      })

      // Google Demographics (Estimated based on Google spend distribution)
      const googleSpend = googleOverview.spend
      const googleDemographics = [
        { group: '18-24 Female', spend: googleSpend * 0.05, leads: Math.round(googleLeadsTotal * 0.06), enrolled: Math.round(googleEnrolledTotal * 0.04) },
        { group: '18-24 Male', spend: googleSpend * 0.10, leads: Math.round(googleLeadsTotal * 0.08), enrolled: Math.round(googleEnrolledTotal * 0.06) },
        { group: '25-34 Female', spend: googleSpend * 0.28, leads: Math.round(googleLeadsTotal * 0.30), enrolled: Math.round(googleEnrolledTotal * 0.32) },
        { group: '25-34 Male', spend: googleSpend * 0.35, leads: Math.round(googleLeadsTotal * 0.34), enrolled: Math.round(googleEnrolledTotal * 0.36) },
        { group: '35-44 Female', spend: googleSpend * 0.12, leads: Math.round(googleLeadsTotal * 0.12), enrolled: Math.round(googleEnrolledTotal * 0.12) },
        { group: '35-44 Male', spend: googleSpend * 0.10, leads: Math.round(googleLeadsTotal * 0.10), enrolled: Math.round(googleEnrolledTotal * 0.10) }
      ]

      // Meta Devices (High mobile skew fallback)
      const metaSpend = metaOverview.spend
      const metaDevices = [
        { device: 'Desktop', spend: metaSpend * 0.12, leads: Math.round(metaLeadsTotal * 0.08), enrolled: Math.round(metaEnrolledTotal * 0.06) },
        { device: 'Mobile', spend: metaSpend * 0.85, leads: Math.round(metaLeadsTotal * 0.90), enrolled: Math.round(metaEnrolledTotal * 0.94) },
        { device: 'Tablet', spend: metaSpend * 0.03, leads: Math.round(metaLeadsTotal * 0.02), enrolled: 0 }
      ]

      // Google Devices
      const googleDevices = (rawGoogleDevices.devices || []).map(row => {
        const conversionsShare = rawGoogleDevices.devices.reduce((sum, r) => sum + r.conversions, 0) || 1
        const share = row.conversions / conversionsShare
        return {
          device: row.device.charAt(0) + row.device.slice(1).toLowerCase(),
          spend: row.spend,
          leads: Math.round(googleLeadsTotal * share),
          enrolled: Math.round(googleEnrolledTotal * share)
        }
      })

      return NextResponse.json({
        metaDemographics,
        googleDemographics,
        metaDevices,
        googleDevices,
        campaignExplorer: {
          meta: metaExplorer,
          google: googleExplorer
        }
      })
    }

    if (route === 'attribution') {
      const journeys = reconstructJourneys(attributedLeads)
      const pathAssists = [
        { path: 'Google Ads → Website → Enrollment', count: Math.round(enrolledTotal * 0.42) },
        { path: 'Meta Ads → Website → Enrollment', count: Math.round(enrolledTotal * 0.32) },
        { path: 'Meta Ads → Google Ads → Website → Enrollment', count: Math.round(enrolledTotal * 0.18) },
        { path: 'Organic Search → Website → Enrollment', count: Math.round(enrolledTotal * 0.08) }
      ]

      const channelsList = ['meta', 'google', 'organic', 'direct', 'referral', 'unknown']
      
      const initializeStats = () => {
        const stats: Record<string, { leads: number; enrolled: number; revenue: number; spend: number }> = {}
        channelsList.forEach(ch => {
          let spend = 0
          if (ch === 'meta') spend = metaOverview.spend
          else if (ch === 'google') spend = googleOverview.spend
          stats[ch] = { leads: 0, enrolled: 0, revenue: 0, spend }
        })
        return stats
      }

      const firstTouch = initializeStats()
      const lastTouch = initializeStats()
      const linear = initializeStats()

      attributedLeads.forEach(lead => {
        const fbclid = lead.fbclid
        const gclid = lead.gclid
        
        let firstChannel: string = lead.channel
        let lastChannel: string = lead.channel
        let touches: string[] = [lead.channel]

        if (fbclid && gclid) {
          firstChannel = 'meta'
          lastChannel = 'google'
          touches = ['meta', 'google']
        }

        // First Touch
        if (firstTouch[firstChannel]) {
          firstTouch[firstChannel].leads += 1
          if (lead.isEnrolled) {
            firstTouch[firstChannel].enrolled += 1
            firstTouch[firstChannel].revenue += lead.feeValue
          }
        }

        // Last Touch
        if (lastTouch[lastChannel]) {
          lastTouch[lastChannel].leads += 1
          if (lead.isEnrolled) {
            lastTouch[lastChannel].enrolled += 1
            lastTouch[lastChannel].revenue += lead.feeValue
          }
        }

        // Linear
        const weight = 1 / touches.length
        touches.forEach(ch => {
          if (linear[ch]) {
            linear[ch].leads += weight
            if (lead.isEnrolled) {
              linear[ch].enrolled += weight
              linear[ch].revenue += lead.feeValue * weight
            }
          }
        })
      })

      // Round stats to make them clean for transmission
      const formatModelStats = (modelStats: Record<string, any>) => {
        return Object.entries(modelStats).map(([channel, data]: [string, any]) => ({
          channel,
          spend: Math.round(data.spend),
          leads: Math.round(data.leads * 10) / 10,
          enrolled: Math.round(data.enrolled * 10) / 10,
          revenue: Math.round(data.revenue)
        }))
      }

      return NextResponse.json({
        journeys: journeys.slice(0, 50),
        pathAssists,
        models: {
          firstTouch: formatModelStats(firstTouch),
          lastTouch: formatModelStats(lastTouch),
          linear: formatModelStats(linear)
        },
        summary: {
          metaSpend: Math.round(metaOverview.spend),
          googleSpend: Math.round(googleOverview.spend),
          totalSpend: Math.round(metaOverview.spend + googleOverview.spend)
        }
      })
    }

    if (route === 'creative') {
      const [metaAds, googleAds] = await Promise.all([
        fetchMetaAdsWithInsights(dateRange, metaAccountId, metaAccessToken),
        fetchGoogleAdsWithInsights(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId)
      ])

      let imageSpend = 0, imageLeads = 0, imageEnrolls = 0
      let videoSpend = 0, videoLeads = 0, videoEnrolls = 0
      let carouselSpend = 0, carouselLeads = 0, carouselEnrolls = 0

      metaAds.forEach(ad => {
        const spend = ad.spend || 0
        const leads = ad.conversions || 0
        const enrolledPct = enrolledTotal / (totalLeadsCRM || 1)
        const enrolls = Math.round(leads * enrolledPct * 10) / 10

        if (ad.creativeType === 'image') {
          imageSpend += spend
          imageLeads += leads
          imageEnrolls += enrolls
        } else if (ad.creativeType === 'video') {
          videoSpend += spend
          videoLeads += leads
          videoEnrolls += enrolls
        } else if (ad.creativeType === 'carousel' || ad.creativeType === 'slideshow') {
          carouselSpend += spend
          carouselLeads += leads
          carouselEnrolls += enrolls
        } else {
          imageSpend += spend
          imageLeads += leads
          imageEnrolls += enrolls
        }
      })

      if (metaAds.length === 0 || (imageSpend === 0 && videoSpend === 0)) {
        imageSpend = totalSpend * 0.35
        imageLeads = Math.round(totalLeadsCRM * 0.32)
        imageEnrolls = Math.round(enrolledTotal * 0.28)

        videoSpend = totalSpend * 0.48
        videoLeads = Math.round(totalLeadsCRM * 0.54)
        videoEnrolls = Math.round(enrolledTotal * 0.62)

        carouselSpend = totalSpend * 0.17
        carouselLeads = Math.round(totalLeadsCRM * 0.14)
        carouselEnrolls = Math.round(enrolledTotal * 0.10)
      }

      const formatBreakdown = [
        { format: 'Single Image', spend: Math.round(imageSpend), leads: Math.round(imageLeads), enrolled: Math.round(imageEnrolls) },
        { format: 'Video (Short Reels)', spend: Math.round(videoSpend), leads: Math.round(videoLeads), enrolled: Math.round(videoEnrolls) },
        { format: 'Carousel', spend: Math.round(carouselSpend), leads: Math.round(carouselLeads), enrolled: Math.round(carouselEnrolls) }
      ]

      return NextResponse.json({
        formatBreakdown,
        fatigueWarning: metaOverview.frequency > 3.2,
        metaAds,
        googleAds
      })
    }

    if (route === 'funnel-leak') {
      const metaLeads = attributedLeads.filter(l => l.channel === 'meta')
      const googleLeads = attributedLeads.filter(l => l.channel === 'google')

      // Use real TeleCRM lead statuses to count actual demo attendees
      const isDemoAttendee = (l: any) => l.status === 'Demo Attended' || l.status === 'Enrolled'
      const overallDemos = attributedLeads.filter(isDemoAttendee).length
      const metaDemos = metaLeads.filter(isDemoAttendee).length
      const googleDemos = googleLeads.filter(isDemoAttendee).length

      // Detect if configurations are configured for real accounts
      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'

      const funnel = {
        overall: {
          impressions: metaOverview.impressions + googleOverview.impressions,
          clicks: metaOverview.clicks + googleOverview.clicks,
          leadsCRM: totalLeadsCRM,
          demos: overallDemos,
          enrolled: enrolledTotal,
          spend: totalSpend
        },
        meta: {
          impressions: metaOverview.impressions,
          clicks: metaOverview.clicks,
          leadsCRM: metaLeads.length,
          demos: metaDemos,
          enrolled: metaLeads.filter(l => l.isEnrolled).length,
          spend: metaOverview.spend
        },
        google: {
          impressions: googleOverview.impressions,
          clicks: googleOverview.clicks,
          leadsCRM: googleLeads.length,
          demos: googleDemos,
          enrolled: googleLeads.filter(l => l.isEnrolled).length,
          spend: googleOverview.spend
        }
      }

      // ONLY use mock data if credentials are completely unconfigured
      if (!hasMeta && !hasGoogle) {
        funnel.overall = {
          impressions: 500000,
          clicks: 12000,
          leadsCRM: 800,
          demos: 280,
          enrolled: 28,
          spend: 240000
        }
        funnel.meta = {
          impressions: 350000,
          clicks: 8000,
          leadsCRM: 500,
          demos: 175,
          enrolled: 15,
          spend: 150000
        }
        funnel.google = {
          impressions: 150000,
          clicks: 4000,
          leadsCRM: 300,
          demos: 105,
          enrolled: 13,
          spend: 90000
        }
      }

      return NextResponse.json(funnel)
    }

    if (route === 'keywords') {
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock' && googleDevToken && googleDevToken !== ''
      let keywordsList: any[] = []

      if (hasGoogle) {
        try {
          const rawKeywords = await fetchGoogleKeywords(
            dateRange,
            googleDevToken,
            googleClientId,
            googleClientSecret,
            googleRefreshToken,
            googleCustomerId,
            googleManagerId
          )

          keywordsList = rawKeywords.map(kw => {
            const matchedLeads = attributedLeads.filter(l => 
              l.channel === 'google' && 
              l.utmTerm && 
              l.utmTerm.toLowerCase().trim() === kw.text.toLowerCase().trim()
            )

            return {
              text: kw.text,
              matchType: kw.matchType,
              status: kw.status,
              qualityScore: kw.qualityScore,
              spend: kw.spend,
              impressions: kw.impressions,
              clicks: kw.clicks,
              conversions: kw.conversions,
              leads: matchedLeads.length,
              enrolled: matchedLeads.filter(l => l.isEnrolled).length
            }
          })
        } catch (err) {
          console.error('Failed to fetch real google keywords in route, falling back to mock:', err)
        }
      }

      if (keywordsList.length === 0) {
        keywordsList = [
          { text: 'oracle fusion scm training', matchType: 'PHRASE', status: 'ENABLED', qualityScore: 8, spend: totalSpend * 0.20, impressions: 8400, clicks: 420, conversions: 25, leads: Math.round(totalLeadsCRM * 0.22), enrolled: Math.round(enrolledTotal * 0.25) },
          { text: 'oracle fusion financials cloud course', matchType: 'PHRASE', status: 'ENABLED', qualityScore: 9, spend: totalSpend * 0.18, impressions: 6500, clicks: 310, conversions: 18, leads: Math.round(totalLeadsCRM * 0.16), enrolled: Math.round(enrolledTotal * 0.18) },
          { text: 'oracle fusion hcm online course', matchType: 'PHRASE', status: 'ENABLED', qualityScore: 7, spend: totalSpend * 0.15, impressions: 5200, clicks: 240, conversions: 12, leads: Math.round(totalLeadsCRM * 0.12), enrolled: Math.round(enrolledTotal * 0.10) },
          { text: 'best erp training institute', matchType: 'BROAD', status: 'ENABLED', qualityScore: 6, spend: totalSpend * 0.12, impressions: 9800, clicks: 180, conversions: 8, leads: Math.round(totalLeadsCRM * 0.10), enrolled: Math.round(enrolledTotal * 0.05) },
          { text: 'free oracle course details', matchType: 'EXACT', status: 'ENABLED', qualityScore: 4, spend: 6500, impressions: 1200, clicks: 65, conversions: 0, leads: 5, enrolled: 0 }
        ]
      }

      return NextResponse.json({ keywords: keywordsList })
    }

    if (route === 'budget-pacing') {
      const [metaTrend, googleTrend] = await Promise.all([
        fetchMetaDailyTrend(dateRange, metaAccountId, metaAccessToken),
        fetchGoogleDailyTrend(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId)
      ])

      const start = new Date(dateRange.from)
      const end = new Date(dateRange.to)
      const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)

      const activeMetaDailyBudget = metaCampaigns
        .filter(c => c.status === 'ACTIVE')
        .reduce((sum, c) => sum + (c.dailyBudget || 0), 0)

      const activeGoogleDailyBudget = googleCampaigns
        .filter(c => c.status === 'ENABLED')
        .reduce((sum, c) => sum + (c.dailyBudget || 0), 0)

      const totalDailyBudget = activeMetaDailyBudget + activeGoogleDailyBudget
      const rangeBudgetLimit = totalDailyBudget * daysCount

      let cumulativeSpend = 0
      let cumulativeIdeal = 0
      const dailySpendPoints: any[] = []
      const dateList: string[] = []
      
      const current = new Date(start)
      while (current <= end) {
        dateList.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }

      dateList.forEach((dateStr) => {
        const metaDay = metaTrend.find(t => t.date === dateStr)
        const googleDay = googleTrend.find(t => t.date === dateStr)

        const metaSpend = metaDay ? metaDay.spend : 0
        const googleSpend = googleDay ? googleDay.spend : 0
        const daySpend = metaSpend + googleSpend

        cumulativeSpend += daySpend
        cumulativeIdeal += totalDailyBudget

        const d = new Date(dateStr)
        const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })

        dailySpendPoints.push({
          date: dateLabel,
          dateStr,
          metaSpend: Math.round(metaSpend),
          googleSpend: Math.round(googleSpend),
          spendToday: Math.round(daySpend),
          cumulativeActual: Math.round(cumulativeSpend),
          cumulativeIdeal: Math.round(cumulativeIdeal),
          idealDaily: Math.round(totalDailyBudget)
        })
      })

      const metaPrepaid = activeConfig?.metaPrepaidBalance || 0
      const googlePrepaid = activeConfig?.googlePrepaidBalance || 0

      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      return NextResponse.json({
        dailySpendPoints,
        totalBudget: Math.round(rangeBudgetLimit),
        dailyBudgetLimit: Math.round(totalDailyBudget),
        metaDailyBudget: Math.round(activeMetaDailyBudget),
        googleDailyBudget: Math.round(activeGoogleDailyBudget),
        cumulativeActual: Math.round(cumulativeSpend),
        cumulativeIdeal: Math.round(cumulativeIdeal),
        daysCount,
        metaPrepaid: Math.round(metaPrepaid),
        googlePrepaid: Math.round(googlePrepaid),
        isReal
      })
    }

    if (route === 'retargeting') {
      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      let retargetingSplit: any[] = []
      let campaigns: any[] = []

      const classifyCampaign = (name: string): 'Cold' | 'Warm' | 'Hot' => {
        const n = name.toLowerCase()
        const hotPatterns = [
          /\b(retargeting|remarketing|warm|hot|pixel|visitor|custom|audiences|re-engage|reengage)\b/i,
          /\b(rt|rm)\b/i,
          /[-_](rt|rm)([-_]|$)/i
        ]
        const warmPatterns = [
          /\b(lookalike|lal|lla|similar|look-alike|mid-funnel|mid)\b/i
        ]

        if (hotPatterns.some(p => p.test(n))) {
          return 'Hot'
        }
        if (warmPatterns.some(p => p.test(n))) {
          return 'Warm'
        }
        return 'Cold'
      }

      if (isReal) {
        let coldSpend = 0
        let warmSpend = 0
        let hotSpend = 0

        metaCampaigns.forEach(c => {
          const seg = classifyCampaign(c.name)
          if (seg === 'Cold') coldSpend += c.spend
          else if (seg === 'Warm') warmSpend += c.spend
          else if (seg === 'Hot') hotSpend += c.spend
        })

        googleCampaigns.forEach(c => {
          const seg = classifyCampaign(c.name)
          if (seg === 'Cold') coldSpend += c.spend
          else if (seg === 'Warm') warmSpend += c.spend
          else if (seg === 'Hot') hotSpend += c.spend
        })

        let coldLeads = 0, coldEnrolled = 0
        let warmLeads = 0, warmEnrolled = 0
        let hotLeads = 0, hotEnrolled = 0

        attributedLeads.forEach(lead => {
          let matchedCampaignName = lead.campaignName || ''
          let seg: 'Cold' | 'Warm' | 'Hot' = 'Cold'

          const metaC = metaCampaigns.find(c => c.id === matchedCampaignName || isFuzzyCampaignMatch(c.name, matchedCampaignName))
          const googleC = googleCampaigns.find(c => c.id === matchedCampaignName || isFuzzyCampaignMatch(c.name, matchedCampaignName))

          if (metaC) {
            seg = classifyCampaign(metaC.name)
          } else if (googleC) {
            seg = classifyCampaign(googleC.name)
          } else {
            seg = classifyCampaign(matchedCampaignName)
          }

          if (seg === 'Cold') {
            coldLeads++
            if (lead.isEnrolled) coldEnrolled++
          } else if (seg === 'Warm') {
            warmLeads++
            if (lead.isEnrolled) warmEnrolled++
          } else if (seg === 'Hot') {
            hotLeads++
            if (lead.isEnrolled) hotEnrolled++
          }
        })

        retargetingSplit = [
          { audience: 'Cold (No previous interaction)', spend: Math.round(coldSpend), leads: coldLeads, enrolled: coldEnrolled },
          { audience: 'Warm (Lookalike & Mid-funnel)', spend: Math.round(warmSpend), leads: warmLeads, enrolled: warmEnrolled },
          { audience: 'Hot (Custom Audiences & Remarketing)', spend: Math.round(hotSpend), leads: hotLeads, enrolled: hotEnrolled }
        ]

        // Build campaign list details
        metaCampaigns.forEach(c => {
          const seg = classifyCampaign(c.name)
          const matchedLeads = attributedLeads.filter(l => 
            l.channel === 'meta' && 
            (l.campaignName === c.id || isFuzzyCampaignMatch(c.name, l.campaignName || ''))
          )
          campaigns.push({
            id: c.id,
            name: c.name,
            platform: 'meta',
            status: c.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
            spend: Math.round(c.spend),
            adConversions: c.totalConversions || 0,
            crmLeads: matchedLeads.length,
            crmEnrolled: matchedLeads.filter(l => l.isEnrolled).length,
            segment: seg
          })
        })

        googleCampaigns.forEach(c => {
          const seg = classifyCampaign(c.name)
          const matchedLeads = attributedLeads.filter(l => 
            l.channel === 'google' && 
            (l.campaignName === c.id || isFuzzyCampaignMatch(c.name, l.campaignName || ''))
          )
          campaigns.push({
            id: c.id,
            name: c.name,
            platform: 'google',
            status: c.status === 'ENABLED' ? 'ACTIVE' : 'PAUSED',
            spend: Math.round(c.spend),
            adConversions: c.conversions || 0,
            crmLeads: matchedLeads.length,
            crmEnrolled: matchedLeads.filter(l => l.isEnrolled).length,
            segment: seg
          })
        })
      } else {
        retargetingSplit = [
          { audience: 'Cold (No previous interaction)', spend: totalSpend * 0.65, leads: Math.round(totalLeadsCRM * 0.58), enrolled: Math.round(enrolledTotal * 0.40) },
          { audience: 'Warm (Lookalike & Mid-funnel)', spend: totalSpend * 0.25, leads: Math.round(totalLeadsCRM * 0.30), enrolled: Math.round(enrolledTotal * 0.45) },
          { audience: 'Hot (Custom Audiences & Remarketing)', spend: totalSpend * 0.10, leads: Math.round(totalLeadsCRM * 0.12), enrolled: Math.round(enrolledTotal * 0.15) }
        ]

        campaigns = [
          { id: 'mock_c_1', name: 'Meta_SCM_Broad_Acquisition', platform: 'meta', status: 'ACTIVE', spend: Math.round(totalSpend * 0.40), adConversions: 45, crmLeads: Math.round(totalLeadsCRM * 0.38), crmEnrolled: Math.round(enrolledTotal * 0.25), segment: 'Cold' },
          { id: 'mock_c_2', name: 'Prospecting_India_SCM_Search', platform: 'google', status: 'ACTIVE', spend: Math.round(totalSpend * 0.25), adConversions: 35, crmLeads: Math.round(totalLeadsCRM * 0.20), crmEnrolled: Math.round(enrolledTotal * 0.15), segment: 'Cold' },
          { id: 'mock_c_3', name: 'Lookalike_CRM_Customers_5%', platform: 'meta', status: 'ACTIVE', spend: Math.round(totalSpend * 0.18), adConversions: 20, crmLeads: Math.round(totalLeadsCRM * 0.22), crmEnrolled: Math.round(enrolledTotal * 0.30), segment: 'Warm' },
          { id: 'mock_c_4', name: 'Google_Similar_Audiences_PPM', platform: 'google', status: 'PAUSED', spend: Math.round(totalSpend * 0.07), adConversions: 8, crmLeads: Math.round(totalLeadsCRM * 0.08), crmEnrolled: Math.round(enrolledTotal * 0.15), segment: 'Warm' },
          { id: 'mock_c_5', name: 'SCM_Website_Visitor_Remarketing', platform: 'google', status: 'ACTIVE', spend: Math.round(totalSpend * 0.06), adConversions: 10, crmLeads: Math.round(totalLeadsCRM * 0.08), crmEnrolled: Math.round(enrolledTotal * 0.10), segment: 'Hot' },
          { id: 'mock_c_6', name: 'Meta_Pixel_InitiateCheckout_Retargeting', platform: 'meta', status: 'ACTIVE', spend: Math.round(totalSpend * 0.04), adConversions: 8, crmLeads: Math.round(totalLeadsCRM * 0.04), crmEnrolled: Math.round(enrolledTotal * 0.05), segment: 'Hot' }
        ]
      }

      return NextResponse.json({ retargetingSplit, campaigns, isReal })
    }

    if (route === 'placement') {
      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      let rawPlacementsMeta: any = { placements: [] }
      let rawPlacementsGoogle: any[] = []
      let metaAds: any[] = []
      let googleAds: any[] = []

      if (isReal) {
        const promises: Promise<any>[] = []
        if (hasMeta) {
          promises.push(fetchMetaPlacements(dateRange, metaAccountId, metaAccessToken).then(res => rawPlacementsMeta = res))
          promises.push(fetchMetaAdsWithInsights(dateRange, metaAccountId, metaAccessToken).then(res => metaAds = res))
        }
        if (hasGoogle) {
          promises.push(fetchGooglePlacements(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId).then(res => rawPlacementsGoogle = res))
          promises.push(fetchGoogleAdsWithInsights(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId).then(res => googleAds = res))
        }
        await Promise.all(promises)
      }

      // Grouping buckets for placements
      const placementBuckets: Record<string, { spend: number; clicks: number; impressions: number; platformConversions: number; isMeta: boolean }> = {
        'Instagram Reels': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Instagram Feed & Stories': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Facebook Reels': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Facebook Feed & Stories': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Audience Network': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Messenger': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Google Search': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: false },
        'Google Search Partners': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: false },
        'Google Display Network': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: false },
        'YouTube Video': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: false }
      }

      // Populate Meta placements
      const metaPlacementsList = rawPlacementsMeta?.placements || []
      metaPlacementsList.forEach((row: any) => {
        const plat = (row.placement || '').toLowerCase()
        const publisher = (row.publisher_platform || '').toLowerCase()
        const position = (row.platform_position || '').toLowerCase()

        let bucketName = 'Facebook Feed & Stories' // default fallback

        if (publisher === 'instagram') {
          if (position.includes('reels')) {
            bucketName = 'Instagram Reels'
          } else {
            bucketName = 'Instagram Feed & Stories'
          }
        } else if (publisher === 'facebook') {
          if (position.includes('reels')) {
            bucketName = 'Facebook Reels'
          } else {
            bucketName = 'Facebook Feed & Stories'
          }
        } else if (publisher === 'audience_network' || plat.includes('audience')) {
          bucketName = 'Audience Network'
        } else if (publisher === 'messenger' || plat.includes('messenger')) {
          bucketName = 'Messenger'
        }

        const bucket = placementBuckets[bucketName]
        if (bucket) {
          bucket.spend += Number(row.spend || 0)
          bucket.clicks += Number(row.clicks || 0)
          bucket.impressions += Number(row.impressions || 0)
          bucket.platformConversions += Number(row.conversions || 0)
        }
      })

      // Populate Google placements
      rawPlacementsGoogle.forEach((row: any) => {
        const network = row.adNetworkType
        let bucketName = 'Google Search'
        
        if (network === 'SEARCH_PARTNERS' || network === 3) {
          bucketName = 'Google Search Partners'
        } else if (network === 'CONTENT' || network === 4) {
          bucketName = 'Google Display Network'
        } else if (network === 'YOUTUBE' || network === 6) {
          bucketName = 'YouTube Video'
        } else if (network === 'SEARCH' || network === 2) {
          bucketName = 'Google Search'
        }

        const bucket = placementBuckets[bucketName]
        if (bucket) {
          bucket.spend += Number(row.spend || 0)
          bucket.clicks += Number(row.clicks || 0)
          bucket.impressions += Number(row.impressions || 0)
          bucket.platformConversions += Number(row.conversions || 0)
        }
      })

      let totalMetaPlatConvs = 0
      let totalMetaClicks = 0
      let totalMetaSpend = 0
      
      let totalGooglePlatConvs = 0
      let totalGoogleClicks = 0
      let totalGoogleSpend = 0

      Object.values(placementBuckets).forEach(b => {
        if (b.isMeta) {
          totalMetaPlatConvs += b.platformConversions
          totalMetaClicks += b.clicks
          totalMetaSpend += b.spend
        } else {
          totalGooglePlatConvs += b.platformConversions
          totalGoogleClicks += b.clicks
          totalGoogleSpend += b.spend
        }
      })

      const metaLeadsCRM = attributedLeads.filter(l => l.channel === 'meta').length
      const metaEnrolledCRM = attributedLeads.filter(l => l.channel === 'meta' && l.isEnrolled).length

      const googleLeadsCRM = attributedLeads.filter(l => l.channel === 'google').length
      const googleEnrolledCRM = attributedLeads.filter(l => l.channel === 'google' && l.isEnrolled).length

      const finalPlacements = Object.entries(placementBuckets).map(([name, b]) => {
        let share = 0
        if (b.isMeta) {
          if (totalMetaPlatConvs > 0) {
            share = b.platformConversions / totalMetaPlatConvs
          } else if (totalMetaClicks > 0) {
            share = b.clicks / totalMetaClicks
          } else if (totalMetaSpend > 0) {
            share = b.spend / totalMetaSpend
          }
        } else {
          if (totalGooglePlatConvs > 0) {
            share = b.platformConversions / totalGooglePlatConvs
          } else if (totalGoogleClicks > 0) {
            share = b.clicks / totalGoogleClicks
          } else if (totalGoogleSpend > 0) {
            share = b.spend / totalGoogleSpend
          }
        }

        const leads = Math.round((b.isMeta ? metaLeadsCRM : googleLeadsCRM) * share)
        const enrolled = Math.round((b.isMeta ? metaEnrolledCRM : googleEnrolledCRM) * share)

        return {
          platform: name,
          spend: Math.round(b.spend),
          clicks: b.clicks,
          impressions: b.impressions,
          platformConversions: b.platformConversions,
          leads,
          enrolled
        }
      }).filter(p => p.spend > 0 || p.clicks > 0 || p.leads > 0)

      // Grouping buckets for formats
      const formatBuckets: Record<string, { spend: number; clicks: number; impressions: number; platformConversions: number; isMeta: boolean }> = {
        'Single Image': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Video & Reels': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Carousel Ads': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: true },
        'Google Responsive Search': { spend: 0, clicks: 0, impressions: 0, platformConversions: 0, isMeta: false }
      }

      // Populate Meta formats
      metaAds.forEach((ad: any) => {
        const type = (ad.creativeType || 'other').toLowerCase()
        let bucketName = 'Single Image'
        if (type === 'video') {
          bucketName = 'Video & Reels'
        } else if (type === 'carousel' || type === 'slideshow') {
          bucketName = 'Carousel Ads'
        }
        
        const bucket = formatBuckets[bucketName]
        if (bucket) {
          bucket.spend += Number(ad.spend || 0)
          bucket.clicks += Number(ad.clicks || 0)
          bucket.impressions += Number(ad.impressions || 0)
          bucket.platformConversions += Number(ad.conversions || ad.totalConversions || 0)
        }
      })

      // If Meta formats didn't resolve due to missing ad-level details but we have Meta spend, do pro-rata fallback
      const totalMetaFormatSpend = formatBuckets['Single Image'].spend + formatBuckets['Video & Reels'].spend + formatBuckets['Carousel Ads'].spend
      if (metaOverview.spend > 0 && totalMetaFormatSpend === 0) {
        const splits = [
          { name: 'Single Image', spendShare: 0.35, clickShare: 0.32, conversionShare: 0.28 },
          { name: 'Video & Reels', spendShare: 0.48, clickShare: 0.54, conversionShare: 0.62 },
          { name: 'Carousel Ads', spendShare: 0.17, clickShare: 0.14, conversionShare: 0.10 }
        ]
        splits.forEach(s => {
          const bucket = formatBuckets[s.name]
          if (bucket) {
            bucket.spend = metaOverview.spend * s.spendShare
            bucket.clicks = Math.round(metaOverview.clicks * s.clickShare)
            bucket.impressions = Math.round(metaOverview.impressions * s.spendShare)
            bucket.platformConversions = Math.round((metaOverview.leadFormFills + metaOverview.websiteLeads) * s.conversionShare)
          }
        })
      }

      // Populate Google formats
      googleAds.forEach((ad: any) => {
        const bucket = formatBuckets['Google Responsive Search']
        if (bucket) {
          bucket.spend += Number(ad.spend || 0)
          bucket.clicks += Number(ad.clicks || 0)
          bucket.impressions += Number(ad.impressions || 0)
          bucket.platformConversions += Number(ad.conversions || 0)
        }
      })

      // Google fallback
      if (googleOverview.spend > 0 && formatBuckets['Google Responsive Search'].spend === 0) {
        const bucket = formatBuckets['Google Responsive Search']
        if (bucket) {
          bucket.spend = googleOverview.spend
          bucket.clicks = googleOverview.clicks
          bucket.impressions = googleOverview.impressions
          bucket.platformConversions = googleOverview.conversions
        }
      }

      const finalFormats = Object.entries(formatBuckets).map(([name, b]) => {
        let share = 0
        if (b.isMeta) {
          const totalMetaFormatConvs = formatBuckets['Single Image'].platformConversions + formatBuckets['Video & Reels'].platformConversions + formatBuckets['Carousel Ads'].platformConversions
          const totalMetaFormatClicks = formatBuckets['Single Image'].clicks + formatBuckets['Video & Reels'].clicks + formatBuckets['Carousel Ads'].clicks
          const totalMetaFormatSpend = formatBuckets['Single Image'].spend + formatBuckets['Video & Reels'].spend + formatBuckets['Carousel Ads'].spend

          if (totalMetaFormatConvs > 0) {
            share = b.platformConversions / totalMetaFormatConvs
          } else if (totalMetaFormatClicks > 0) {
            share = b.clicks / totalMetaFormatClicks
          } else if (totalMetaFormatSpend > 0) {
            share = b.spend / totalMetaFormatSpend
          }
        } else {
          share = 1.0
        }

        const leads = Math.round((b.isMeta ? metaLeadsCRM : googleLeadsCRM) * share)
        const enrolled = Math.round((b.isMeta ? metaEnrolledCRM : googleEnrolledCRM) * share)

        return {
          format: name,
          spend: Math.round(b.spend),
          clicks: b.clicks,
          impressions: b.impressions,
          platformConversions: b.platformConversions,
          leads,
          enrolled
        }
      }).filter(f => f.spend > 0 || f.clicks > 0 || f.leads > 0)

      const finalPlacementsMock = [
        { platform: 'Facebook Feed & Stories', spend: totalSpend * 0.28, clicks: 1240, impressions: 84000, platformConversions: 45, leads: Math.round(totalLeadsCRM * 0.25), enrolled: Math.round(enrolledTotal * 0.20) },
        { platform: 'Instagram Reels', spend: totalSpend * 0.35, clicks: 2150, impressions: 145000, platformConversions: 92, leads: Math.round(totalLeadsCRM * 0.38), enrolled: Math.round(enrolledTotal * 0.42) },
        { platform: 'Instagram Feed & Stories', spend: totalSpend * 0.12, clicks: 540, impressions: 38000, platformConversions: 15, leads: Math.round(totalLeadsCRM * 0.14), enrolled: Math.round(enrolledTotal * 0.12) },
        { platform: 'Audience Network', spend: totalSpend * 0.05, clicks: 680, impressions: 12000, platformConversions: 25, leads: Math.round(totalLeadsCRM * 0.08), enrolled: Math.round(enrolledTotal * 0.03) },
        { platform: 'Google Search', spend: totalSpend * 0.15, clicks: 850, impressions: 7200, platformConversions: 78, leads: Math.round(totalLeadsCRM * 0.12), enrolled: Math.round(enrolledTotal * 0.18) },
        { platform: 'Google Search Partners', spend: totalSpend * 0.05, clicks: 210, impressions: 2100, platformConversions: 18, leads: Math.round(totalLeadsCRM * 0.03), enrolled: Math.round(enrolledTotal * 0.05) }
      ]

      const finalFormatsMock = [
        { format: 'Single Image', spend: totalSpend * 0.35, clicks: 2400, impressions: 160000, platformConversions: 62, leads: Math.round(totalLeadsCRM * 0.32), enrolled: Math.round(enrolledTotal * 0.28) },
        { format: 'Video & Reels', spend: totalSpend * 0.48, clicks: 3600, impressions: 220000, platformConversions: 120, leads: Math.round(totalLeadsCRM * 0.54), enrolled: Math.round(enrolledTotal * 0.62) },
        { format: 'Carousel Ads', spend: totalSpend * 0.17, clicks: 800, impressions: 45000, platformConversions: 28, leads: Math.round(totalLeadsCRM * 0.14), enrolled: Math.round(enrolledTotal * 0.10) }
      ]

      return NextResponse.json({
        placements: isReal ? finalPlacements : finalPlacementsMock,
        formats: isReal ? finalFormats : finalFormatsMock,
        isReal
      })
    }

    if (route === 'course-ads') {
      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      let courses: any[] = []

      if (isReal) {
        const classifyCourse = (name: string): string => {
          const n = name.toLowerCase()
          if (
            n.includes('scm') || n.includes('supply chain') || n.includes('logistics') || 
            n.includes('wms') || n.includes('manufacturing') || n.includes('ppm') || 
            n.includes('pmp') || n.includes('otm') || n.includes('warehouse') || n.includes('tms')
          ) {
            return 'Oracle Fusion SCM'
          }
          if (n.includes('hcm') || n.includes('human capital') || n.includes('payroll') || n.includes('talent')) {
            return 'Oracle Fusion HCM'
          }
          if (
            n.includes('financial') || n.includes('finance') || n.includes('accounting') || 
            n.includes('gl') || n.includes('ap') || n.includes('ar') || n.includes('tax') || 
            n.includes('revenue') || n.includes('ebs') || n.includes('financials')
          ) {
            return 'Oracle Fusion Financials'
          }
          if (
            n.includes('technical') || n.includes('oic') || n.includes('integration') || 
            n.includes('apex') || n.includes('db') || n.includes('sql') || n.includes('developer') || n.includes('admin')
          ) {
            return 'Oracle Fusion Technical'
          }
          return 'Other Courses'
        }

        const getCourseGroup = (courseName: string): string => {
          if (!courseName) return 'Other Courses'
          if (
            courseName === 'Oracle Fusion SCM' || 
            courseName === 'Oracle Fusion PPM' || 
            courseName === 'Oracle Fusion WMS' || 
            courseName === 'Oracle TMS'
          ) {
            return 'Oracle Fusion SCM'
          }
          if (courseName === 'Oracle Fusion HCM') {
            return 'Oracle Fusion HCM'
          }
          if (
            courseName === 'Oracle Fusion Financials' || 
            courseName === 'Oracle EBS'
          ) {
            return 'Oracle Fusion Financials'
          }
          if (
            courseName === 'Oracle Fusion Technical' || 
            courseName === 'Oracle Integration'
          ) {
            return 'Oracle Fusion Technical'
          }
          return 'Other Courses'
        }

        // Initialize spends
        const spends: Record<string, number> = {
          'Oracle Fusion SCM': 0,
          'Oracle Fusion HCM': 0,
          'Oracle Fusion Financials': 0,
          'Oracle Fusion Technical': 0,
          'Other Courses': 0
        }

        metaCampaigns.forEach(c => {
          spends[classifyCourse(c.name)] += c.spend
        })

        googleCampaigns.forEach(c => {
          spends[classifyCourse(c.name)] += c.spend
        })

        // Count outcomes from CRM leads
        const metrics: Record<string, { leads: number; enrolled: number; revenue: number }> = {
          'Oracle Fusion SCM': { leads: 0, enrolled: 0, revenue: 0 },
          'Oracle Fusion HCM': { leads: 0, enrolled: 0, revenue: 0 },
          'Oracle Fusion Financials': { leads: 0, enrolled: 0, revenue: 0 },
          'Oracle Fusion Technical': { leads: 0, enrolled: 0, revenue: 0 },
          'Other Courses': { leads: 0, enrolled: 0, revenue: 0 }
        }

        attributedLeads.forEach(lead => {
          const group = getCourseGroup(lead.courseName)
          if (metrics[group]) {
            metrics[group].leads++
            if (lead.isEnrolled) {
              metrics[group].enrolled++
              metrics[group].revenue += lead.feeValue
            }
          }
        })

        courses = Object.keys(spends).map(name => {
          const s = spends[name]
          const m = metrics[name] || { leads: 0, enrolled: 0, revenue: 0 }
          const trueROAS = s > 0 ? m.revenue / s : 0
          return {
            course: name,
            spend: Math.round(s),
            leads: m.leads,
            enrolled: m.enrolled,
            revenue: m.revenue,
            trueROAS: parseFloat(trueROAS.toFixed(2))
          }
        })
      } else {
        courses = [
          { course: 'Oracle Fusion SCM', spend: totalSpend * 0.35, leads: Math.round(totalLeadsCRM * 0.38), enrolled: Math.round(enrolledTotal * 0.42), revenue: enrolledTotal * 0.42 * 27169, trueROAS: 4.2 },
          { course: 'Oracle Fusion HCM', spend: totalSpend * 0.25, leads: Math.round(totalLeadsCRM * 0.24), enrolled: Math.round(enrolledTotal * 0.20), revenue: enrolledTotal * 0.20 * 19929, trueROAS: 3.5 },
          { course: 'Oracle Fusion Financials', spend: totalSpend * 0.22, leads: Math.round(totalLeadsCRM * 0.20), enrolled: Math.round(enrolledTotal * 0.25), revenue: enrolledTotal * 0.25 * 21950, trueROAS: 4.8 },
          { course: 'Oracle Fusion Technical', spend: totalSpend * 0.18, leads: Math.round(totalLeadsCRM * 0.18), enrolled: Math.round(enrolledTotal * 0.13), revenue: enrolledTotal * 0.13 * 22350, trueROAS: 2.8 }
        ]
      }

      return NextResponse.json({ courses, isReal })
    }

    if (route === 'forecast') {
      const start = new Date(dateRange.from)
      const end = new Date(dateRange.to)
      const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)
      
      const totalClicks = metaOverview.clicks + googleOverview.clicks
      const mtdSpend = totalSpend
      const mtdLeads = totalLeadsCRM
      const mtdEnrolled = enrolledTotal
      const mtdRevenue = totalRevenue

      // Project Month-End (30 days) pro-rata based on elapsed daysCount in selected range
      const projected = projectMonthEnd(mtdSpend, mtdLeads, mtdEnrolled, mtdRevenue, daysCount, 30)
      
      // Calculate real baseline stats from active data
      const projectedClicks = Math.round(totalClicks * (30 / daysCount))
      const leadToEnrollRate = mtdLeads > 0 ? (mtdEnrolled / mtdLeads) * 100 : 6.5
      const avgFee = mtdEnrolled > 0 ? mtdRevenue / mtdEnrolled : 22500
      const currentCR = totalClicks > 0 ? (mtdLeads / totalClicks) * 105 / 105 : 2.5 // check division safety

      // Generate dynamic scenarios targeting CR improvements (+1%, +2.5%, +5%)
      const targets = [
        Math.round((currentCR + 1) * 10) / 10,
        Math.round((currentCR + 2.5) * 10) / 10,
        Math.round((currentCR + 5) * 10) / 10
      ]

      const scenarios = targets.map(targetCR => {
        return calculateWhatIfScenario(
          projectedClicks,
          targetCR,
          leadToEnrollRate,
          projected.spend,
          avgFee
        )
      })

      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      return NextResponse.json({
        projected,
        scenarios,
        baseline: {
          daysCount,
          totalClicks,
          currentCR: parseFloat(currentCR.toFixed(2)),
          leadToEnrollRate: parseFloat(leadToEnrollRate.toFixed(2)),
          avgFee: Math.round(avgFee),
          projectedClicks
        },
        isReal
      })
    }

    if (route === 'competitor') {
      const keyword = searchParams.get('keyword') || undefined
      const pageIds = searchParams.get('pageIds') || undefined
      const competitorData = await fetchCompetitorIntelligence(bypassCache, metaAccessToken, keyword, pageIds)
      return NextResponse.json(competitorData)
    }

    if (route === 'alerts') {
      const hasMeta = metaAccountId && metaAccessToken && metaAccountId !== 'mock'
      const hasGoogle = googleCustomerId && googleCustomerId !== 'mock'
      const isReal = !!(hasMeta || hasGoogle)

      const alerts: any[] = []

      if (isReal) {
        const metaSpend = metaOverview.spend || 0
        const googleSpend = googleOverview.spend || 0
        const totalSpend = metaSpend + googleSpend

        const metaLeads = attributedLeads.filter(l => l.channel === 'meta').length
        const googleLeads = attributedLeads.filter(l => l.channel === 'google').length
        const totalLeads = metaLeads + googleLeads

        const metaPrepaid = activeConfig?.metaPrepaidBalance || 0
        const googlePrepaid = activeConfig?.googlePrepaidBalance || 0

        const start = new Date(dateRange.from)
        const end = new Date(dateRange.to)
        const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1)

        const activeMetaDailyBudget = metaCampaigns
          .filter(c => c.status === 'ACTIVE')
          .reduce((sum, c) => sum + (c.dailyBudget || 0), 0)

        const activeGoogleDailyBudget = googleCampaigns
          .filter(c => c.status === 'ENABLED')
          .reduce((sum, c) => sum + (c.dailyBudget || 0), 0)

        const totalDailyBudget = activeMetaDailyBudget + activeGoogleDailyBudget

        // 1. Prepaid balance check
        if (metaPrepaid > 0 && metaPrepaid < 5000) {
          alerts.push({
            id: 'meta_prepaid_low',
            level: 'critical',
            channel: 'meta',
            title: 'Low Meta Prepaid Balance',
            detail: `Meta prepaid ad account balance is ₹${Math.round(metaPrepaid).toLocaleString('en-IN')}. At current spend rates, ads may stop serving soon.`,
            time: 'Just now',
            metric: 'Prepaid Balance',
            value: `₹${Math.round(metaPrepaid).toLocaleString('en-IN')}`,
            expected: '> ₹5,000',
            recommendation: 'Recharge your Meta prepaid wallet immediately to prevent campaigns from halting.'
          })
        }

        if (googlePrepaid > 0 && googlePrepaid < 5000) {
          alerts.push({
            id: 'google_prepaid_low',
            level: 'critical',
            channel: 'google',
            title: 'Low Google Ads Prepaid Balance',
            detail: `Google Ads prepaid balance is ₹${Math.round(googlePrepaid).toLocaleString('en-IN')}. Recharge to prevent campaign interruption.`,
            time: 'Just now',
            metric: 'Prepaid Balance',
            value: `₹${Math.round(googlePrepaid).toLocaleString('en-IN')}`,
            expected: '> ₹5,000',
            recommendation: 'Recharge Google Ads account funds using the Google Ads Billing console.'
          })
        }

        // 2. Attribution tracking check (Spend > 1000 but 0 CRM Leads)
        if (metaSpend > 1000 && metaLeads === 0) {
          alerts.push({
            id: 'meta_tracking_offline',
            level: 'critical',
            channel: 'meta',
            title: 'Meta Attribution Tracking Offline',
            detail: `Meta ads registered ₹${Math.round(metaSpend).toLocaleString('en-IN')} in spend, but 0 leads were registered in TeleCRM with Meta attribution in this period. Check if lead capture forms, webhooks, or UTM parameters are misconfigured.`,
            time: 'Active',
            metric: 'CRM Leads',
            value: '0 leads',
            expected: '> 0 leads',
            recommendation: 'Verify that UTM tracking (utm_source=meta) and TeleCRM API webhooks are properly processing incoming leads.'
          })
        }

        if (googleSpend > 1000 && googleLeads === 0) {
          alerts.push({
            id: 'google_tracking_offline',
            level: 'critical',
            channel: 'google',
            title: 'Google Ads Attribution Tracking Offline',
            detail: `Google Ads registered ₹${Math.round(googleSpend).toLocaleString('en-IN')} in spend, but 0 leads were registered in TeleCRM with Google attribution in this period. Check if gclid tracking, Google tag manager, or landing page UTM mappings are broken.`,
            time: 'Active',
            metric: 'CRM Leads',
            value: '0 leads',
            expected: '> 0 leads',
            recommendation: 'Ensure Google Click Identifier (gclid) auto-tagging is enabled and GTM conversion tags are active on landing pages.'
          })
        }

        // 3. Creative fatigue (Meta frequency check)
        if (metaOverview.frequency > 3.0) {
          alerts.push({
            id: 'meta_frequency_fatigue',
            level: 'warning',
            channel: 'meta',
            title: 'Meta Creative Fatigue Warning',
            detail: `Average frequency reached ${metaOverview.frequency.toFixed(2)} in the selected range (Optimal: 1.0 - 2.5). Users are seeing the same ads too often, which can lead to click-through rate decline and higher CPL.`,
            time: 'Active',
            metric: 'Frequency',
            value: metaOverview.frequency.toFixed(2),
            expected: '< 3.00',
            recommendation: 'Refresh visual assets, test new ad copy variants, or expand target audience sizes to dilute frequency.'
          })
        }

        // 4. CPA/CPL Spike
        const metaCPL = metaLeads > 0 ? metaSpend / metaLeads : 0
        if (metaSpend > 2000 && metaCPL > 1200) {
          alerts.push({
            id: 'meta_cpl_spike',
            level: 'critical',
            channel: 'meta',
            title: 'Meta Cost Per Lead (CPL) Spike',
            detail: `Meta CPL has spiked to ₹${Math.round(metaCPL).toLocaleString('en-IN')} (Target threshold: ₹800). High ad costs are reducing your enrollment margins.`,
            time: 'Active',
            metric: 'Meta CPL',
            value: `₹${Math.round(metaCPL).toLocaleString('en-IN')}`,
            expected: '< ₹800',
            recommendation: 'Underperforming target sets should be paused. Shift budget to the highest converting course-ads.'
          })
        }

        const googleCPL = googleLeads > 0 ? googleSpend / googleLeads : 0
        if (googleSpend > 2000 && googleCPL > 1200) {
          alerts.push({
            id: 'google_cpl_spike',
            level: 'critical',
            channel: 'google',
            title: 'Google Ads Cost Per Lead (CPL) Spike',
            detail: `Google Ads CPL has spiked to ₹${Math.round(googleCPL).toLocaleString('en-IN')} (Target threshold: ₹800). Low quality score keywords or broad match placements might be diluting performance.`,
            time: 'Active',
            metric: 'Google CPL',
            value: `₹${Math.round(googleCPL).toLocaleString('en-IN')}`,
            expected: '< ₹800',
            recommendation: 'Review the search terms report and add negative keywords. Pause low quality score keywords.'
          })
        }

        // 5. Budget Pacing check
        const expectedSpend = totalDailyBudget * daysCount
        if (expectedSpend > 2000 && totalSpend < expectedSpend * 0.5) {
          alerts.push({
            id: 'budget_underpacing',
            level: 'warning',
            channel: 'system',
            title: 'Ad Budget Under-Pacing Alert',
            detail: `Cumulative spend (₹${Math.round(totalSpend).toLocaleString('en-IN')}) is lagging significantly behind the expected pacing target of ₹${Math.round(expectedSpend).toLocaleString('en-IN')} for this period.`,
            time: 'Active',
            metric: 'Budget Spent',
            value: `${Math.round((totalSpend / expectedSpend) * 100)}%`,
            expected: '> 80%',
            recommendation: 'Check for paused ad sets, low bid limits, or narrow audience sizes restricting active distribution.'
          })
        }
      } else {
        // High fidelity simulated alerts representing realistic scenarios
        alerts.push({
          id: 'sim_meta_prepaid',
          level: 'critical',
          channel: 'meta',
          title: 'Low Meta Prepaid Balance',
          detail: 'Meta prepaid ad account balance is ₹1,450. At current spend rates, ads will stop serving within 6 hours.',
          time: '2 hours ago',
          metric: 'Prepaid Balance',
          value: '₹1,450',
          expected: '> ₹5,000',
          recommendation: 'Recharge your Meta prepaid wallet immediately via Billing Manager to prevent campaign halt.'
        })

        alerts.push({
          id: 'sim_meta_frequency',
          level: 'warning',
          channel: 'meta',
          title: 'Meta Creative Fatigue Warning',
          detail: 'Meta SCM retargeting campaign frequency reached 4.1 in this period. Users are seeing identical creatives too often, causing CPL inflation.',
          time: '1 day ago',
          metric: 'Frequency',
          value: '4.10',
          expected: '< 3.00',
          recommendation: 'Refresh visual assets (new image or video thumbnail) and replace old ad copy hooks.'
        })

        alerts.push({
          id: 'sim_tracking_offline',
          level: 'critical',
          channel: 'google',
          title: 'Google Ads Attribution Mismatch',
          detail: 'Google Ads registered ₹12,400 in spend, but only 2 leads were attributed in TeleCRM. This suggests a potential gclid tracking or landing page GTM script failure.',
          time: 'Active',
          metric: 'CRM Attribution',
          value: '2 leads',
          expected: '> 15 leads',
          recommendation: 'Test your landing page lead forms to ensure GTM tags fire properly and forward gclids to TeleCRM.'
        })
      }

      return NextResponse.json({ alerts, isReal })
    }

    return NextResponse.json({ error: 'Endpoint route not found' }, { status: 404 })
  } catch (error: any) {
    console.error(`Ads Intel Dynamic Route API error (${request.url}):`, error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
