// app/api/ads/overview/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getOrSetCache } from '@/lib/cache'
import { resolveDateRange, DatePreset } from '@/lib/dateRange'
import { fetchMetaAccountOverview, fetchMetaCampaigns } from '@/lib/meta-api'
import { fetchGoogleAccountOverview, fetchGoogleCampaigns } from '@/lib/google-ads-api'
import { AdsCombinedOverview, AdsBudgetAlert } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: Request) {
  try {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let activeLabel = null
    if (user.role === 'viewer') {
      const grants = await getValidAccessGrantsForRecipient(user.email)
      const activeGrant = grants[0]
      if (!activeGrant) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      activeLabel = activeGrant.label
    }

    const isAllowed = isSectionAllowed('ads', user.role, activeLabel)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const preset = (searchParams.get('preset') || 'last_7_days') as DatePreset
    const bypassCache = searchParams.get('refresh') === 'true'

    // Ads credentials
    const metaAdAccountId = searchParams.get('metaAdAccountId') || undefined
    const metaAccessToken = searchParams.get('metaAccessToken') || undefined
    const googleDevToken = searchParams.get('googleDeveloperToken') || undefined
    const googleClientId = searchParams.get('googleClientId') || undefined
    const googleClientSecret = searchParams.get('googleClientSecret') || undefined
    const googleRefreshToken = searchParams.get('googleRefreshToken') || undefined
    const googleCustomerId = searchParams.get('googleCustomerId') || undefined
    const googleManagerId = searchParams.get('googleManagerId') || undefined

    const dateRange = resolveDateRange(preset, from, to)
    const cacheKey = `ads_overview_${dateRange.from}_${dateRange.to}_${dateRange.preset}_${metaAdAccountId || 'default'}_${googleCustomerId || 'default'}`

    const cacheResult = await getOrSetCache(
      cacheKey,
      async () => {
        // Fetch overview and campaigns for budget details
        const [metaOverview, metaCampaigns, googleOverview, googleCampaigns] = await Promise.all([
          fetchMetaAccountOverview(dateRange, metaAdAccountId, metaAccessToken),
          fetchMetaCampaigns(dateRange, metaAdAccountId, metaAccessToken),
          fetchGoogleAccountOverview(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
          fetchGoogleCampaigns(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId)
        ])

        // Collect budget alerts
        const budgetAlerts: AdsBudgetAlert[] = []
        
        // Meta budget alerts
        let metaDailyBudgetTotal = 0
        let metaSpentTodayTotal = 0
        metaCampaigns.forEach(c => {
          if (c.status === 'ACTIVE') {
            metaDailyBudgetTotal += c.dailyBudget
            metaSpentTodayTotal += c.spentToday
            
            const pct = c.dailyBudget > 0 ? (c.spentToday / c.dailyBudget) * 100 : 0
            let alertLevel: AdsBudgetAlert['alertLevel'] = 'healthy'
            if (pct >= 100) alertLevel = 'exhausted'
            else if (pct >= 90) alertLevel = 'critical'
            else if (pct >= 75) alertLevel = 'warning'

            if (alertLevel !== 'healthy' && c.dailyBudget > 0) {
              budgetAlerts.push({
                platform: 'meta',
                campaignName: c.name,
                campaignId: c.id,
                dailyBudget: c.dailyBudget,
                spentToday: c.spentToday,
                remaining: c.budgetRemaining,
                percentUsed: pct,
                alertLevel
              })
            }
          }
        })

        // Google budget alerts
        let googleDailyBudgetTotal = 0
        let googleSpentTodayTotal = 0
        googleCampaigns.forEach(c => {
          if (c.status === 'ENABLED') {
            googleDailyBudgetTotal += c.dailyBudget
            googleSpentTodayTotal += c.spentToday

            const pct = c.dailyBudget > 0 ? (c.spentToday / c.dailyBudget) * 100 : 0
            let alertLevel: AdsBudgetAlert['alertLevel'] = 'healthy'
            if (pct >= 100) alertLevel = 'exhausted'
            else if (pct >= 90) alertLevel = 'critical'
            else if (pct >= 75) alertLevel = 'warning'

            if (alertLevel !== 'healthy' && c.dailyBudget > 0) {
              budgetAlerts.push({
                platform: 'google',
                campaignName: c.name,
                campaignId: c.id,
                dailyBudget: c.dailyBudget,
                spentToday: c.spentToday,
                remaining: c.budgetRemaining,
                percentUsed: pct,
                alertLevel
              })
            }
          }
        })

        // Update overall budget metrics
        metaOverview.totalDailyBudget = metaDailyBudgetTotal
        metaOverview.totalSpentToday = metaSpentTodayTotal
        metaOverview.budgetAlerts = budgetAlerts.filter(a => a.platform === 'meta')

        googleOverview.totalDailyBudget = googleDailyBudgetTotal
        googleOverview.totalSpentToday = googleSpentTodayTotal
        googleOverview.budgetAlerts = budgetAlerts.filter(a => a.platform === 'google')

        // Combine KPIs
        const totalSpend = metaOverview.spend + googleOverview.spend
        const totalImpressions = metaOverview.impressions + googleOverview.impressions
        const totalClicks = metaOverview.clicks + googleOverview.clicks
        const totalConversions = metaOverview.totalConversions + googleOverview.conversions
        const totalLeads = (metaOverview.leadFormFills + metaOverview.websiteLeads) + googleOverview.formSubmissions
        const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0
        const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
        const overallCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

        const combined: AdsCombinedOverview = {
          dateRange: {
            from: dateRange.from,
            to: dateRange.to,
            preset: dateRange.preset,
            label: dateRange.label
          },
          totalSpend,
          totalImpressions,
          totalClicks,
          totalConversions,
          totalLeads,
          avgCostPerLead,
          overallCTR,
          overallCPC,
          metaSpend: metaOverview.spend,
          googleSpend: googleOverview.spend,
          metaConversions: metaOverview.totalConversions,
          googleConversions: googleOverview.conversions,
          metaCPL: (metaOverview.leadFormFills + metaOverview.websiteLeads) > 0 
            ? metaOverview.spend / (metaOverview.leadFormFills + metaOverview.websiteLeads) 
            : 0,
          googleCPL: googleOverview.formSubmissions > 0 
            ? googleOverview.spend / googleOverview.formSubmissions 
            : 0,
          metaLeadFormFills: metaOverview.leadFormFills,
          metaWebsiteLeads: metaOverview.websiteLeads,
          metaLeadFormCPL: metaOverview.costPerLeadForm,
          metaWebsiteLeadCPL: metaOverview.costPerWebsiteLead,
          googleFormSubmissions: googleOverview.formSubmissions,
          googlePhoneCalls: googleOverview.phoneCalls,
          budgetAlerts,
          lastRefreshedAt: '', // Filled below
          nextRefreshAt: ''    // Filled below
        }

        return combined
      },
      bypassCache
    )

    // Calculate Prepaid Balance dynamically based on Supabase deposits list
    let googlePrepaidBalance = 0
    let googleTotalDeposits = 0
    let googleSpendSinceStart = 0
    let googleStartDepositDate: string | null = null

    if (supabase) {
      try {
        const { data: deposits } = await supabase
          .from('google_ads_deposits')
          .select('*')
          .order('deposit_date', { ascending: true })

        if (deposits && deposits.length > 0) {
          const earliest = deposits[0]
          googleStartDepositDate = earliest.deposit_date
          googleTotalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)

          if (googleStartDepositDate) {
            const todayStr = new Date().toISOString().split('T')[0]
            const customRange = {
              from: googleStartDepositDate,
              to: todayStr,
              preset: 'custom' as const,
              label: 'Custom Range'
            }

            const rangeOverview = await fetchGoogleAccountOverview(
              customRange,
              googleDevToken,
              googleClientId,
              googleClientSecret,
              googleRefreshToken,
              googleCustomerId,
              googleManagerId
            )
            googleSpendSinceStart = rangeOverview.spend || 0
            googlePrepaidBalance = Math.max(0, googleTotalDeposits - googleSpendSinceStart)
          }
        }
      } catch (err) {
        console.warn('Failed to calculate live prepaid balance in combined view:', err)
      }
    }

    return NextResponse.json({
      ...cacheResult.data,
      lastRefreshedAt: cacheResult.cachedAt,
      nextRefreshAt: cacheResult.expiresAt,
      isCached: cacheResult.isCached,
      googlePrepaidBalance,
      googleTotalDeposits,
      googleSpendSinceStart,
      googleStartDepositDate
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Combined Ads Overview API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
