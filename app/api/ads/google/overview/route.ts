// app/api/ads/google/overview/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getOrSetCache } from '@/lib/cache'
import { resolveDateRange, DatePreset } from '@/lib/dateRange'
import { fetchGoogleAccountOverview, fetchGoogleCampaigns } from '@/lib/google-ads-api'
import { AdsBudgetAlert } from '@/lib/types'
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

    const googleDevToken = searchParams.get('googleDeveloperToken') || undefined
    const googleClientId = searchParams.get('googleClientId') || undefined
    const googleClientSecret = searchParams.get('googleClientSecret') || undefined
    const googleRefreshToken = searchParams.get('googleRefreshToken') || undefined
    const googleCustomerId = searchParams.get('googleCustomerId') || undefined
    const googleManagerId = searchParams.get('googleManagerId') || undefined

    const dateRange = resolveDateRange(preset, from, to)
    const cacheKey = `google_overview_${dateRange.from}_${dateRange.to}_${dateRange.preset}_${googleCustomerId || 'default'}`

    const cacheResult = await getOrSetCache(
      cacheKey,
      async () => {
        const [overview, campaigns] = await Promise.all([
          fetchGoogleAccountOverview(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
          fetchGoogleCampaigns(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId)
        ])

        const budgetAlerts: AdsBudgetAlert[] = []
        let totalDailyBudget = 0
        let totalSpentToday = 0

        campaigns.forEach(c => {
          if (c.status === 'ENABLED') {
            totalDailyBudget += c.dailyBudget
            totalSpentToday += c.spentToday

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

        overview.totalDailyBudget = totalDailyBudget
        overview.totalSpentToday = totalSpentToday
        overview.budgetAlerts = budgetAlerts

        return overview
      },
      bypassCache
    )

    // Calculate Prepaid Balance dynamically based on Supabase deposits list
    let prepaidBalance = 0
    let totalDeposits = 0
    let spendSinceStart = 0
    let startDepositDate: string | null = null

    if (supabase) {
      try {
        const { data: deposits } = await supabase
          .from('google_ads_deposits')
          .select('*')
          .order('deposit_date', { ascending: true })

        if (deposits && deposits.length > 0) {
          const earliest = deposits[0]
          startDepositDate = earliest.deposit_date
          totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0)

          if (startDepositDate) {
            const todayStr = new Date().toISOString().split('T')[0]
            const customRange = {
              from: startDepositDate,
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
            spendSinceStart = rangeOverview.spend || 0
            prepaidBalance = Math.max(0, totalDeposits - spendSinceStart)
          }
        }
      } catch (err) {
        console.warn('Failed to calculate live prepaid balance:', err)
      }
    }

    return NextResponse.json({
      ...cacheResult.data,
      lastRefreshedAt: cacheResult.cachedAt,
      nextRefreshAt: cacheResult.expiresAt,
      isCached: cacheResult.isCached,
      prepaidBalance,
      totalDeposits,
      spendSinceStart,
      startDepositDate
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Google Ads Overview API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
