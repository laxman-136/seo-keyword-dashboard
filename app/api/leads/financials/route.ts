// app/api/leads/financials/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getChannelFinancials, TeleCRMApiError } from '@/lib/telecrm-api'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

function getMonthsInRange(from: Date, to: Date): string[] {
  const months: string[] = []
  const start = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  
  while (start <= end) {
    months.push(start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
    start.setMonth(start.getMonth() + 1)
  }
  return months
}

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

    const isAllowed = isSectionAllowed('leads', user.role, activeLabel)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const customToken = request.headers.get('x-telecrm-api-token') || searchParams.get('telecrmApiToken') || undefined
    const customEnterpriseId = request.headers.get('x-telecrm-enterprise-id') || searchParams.get('telecrmEnterpriseId') || undefined

    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    if (!fromStr || !toStr) {
      return NextResponse.json({ error: 'Missing from or to date parameter' }, { status: 400 })
    }

    const fromDate = new Date(fromStr)
    const toDate = new Date(toStr)

    // Fetch manual budgets & configurations from Supabase
    const months = getMonthsInRange(fromDate, toDate)
    const manualBudgets: Record<string, number> = {}

    let googleDevToken: string | undefined
    let googleClientId: string | undefined
    let googleClientSecret: string | undefined
    let googleRefreshToken: string | undefined
    let googleCustomerId: string | undefined
    let googleManagerId: string | undefined
    let metaAccountId: string | undefined
    let metaToken: string | undefined

    if (supabase) {
      try {
        const [budgetsRes, configRes] = await Promise.all([
          supabase.from('channel_budgets').select('channel, budget').in('month', months),
          supabase.from('configurations').select('*').eq('is_active', true).maybeSingle()
        ])
        
        if (!budgetsRes.error && budgetsRes.data) {
          budgetsRes.data.forEach((b: any) => {
            const ch = b.channel
            const amt = parseFloat(String(b.budget || 0))
            manualBudgets[ch] = (manualBudgets[ch] || 0) + amt
          })
        }

        if (!configRes.error && configRes.data) {
          const config = configRes.data
          googleDevToken = config.google_developer_token || undefined
          googleClientId = config.google_client_id || undefined
          googleClientSecret = config.google_client_secret || undefined
          googleRefreshToken = config.google_refresh_token || undefined
          googleCustomerId = config.google_customer_id || undefined
          googleManagerId = config.google_manager_id || undefined
          
          metaAccountId = config.meta_ad_account_id || undefined
          metaToken = config.meta_access_token || undefined
        }
      } catch (err) {
        console.warn('Failed to query custom budgets or config from Supabase:', err)
      }
    }

    // Fetch ad spends on server side
    let googleSpend = 0
    let metaSpend = 0
    try {
      const { fetchGoogleAccountOverview } = await import('@/lib/google-ads-api')
      const { fetchMetaAccountOverview } = await import('@/lib/meta-api')
      const formattedRange = {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        preset: 'custom' as const,
        label: 'Custom Range'
      }
      const [googleRes, metaRes] = await Promise.all([
        fetchGoogleAccountOverview(
          formattedRange,
          googleDevToken,
          googleClientId,
          googleClientSecret,
          googleRefreshToken,
          googleCustomerId,
          googleManagerId
        ).catch(() => ({ spend: 0 })),
        fetchMetaAccountOverview(
          formattedRange,
          metaAccountId,
          metaToken
        ).catch(() => ({ spend: 0 }))
      ])
      googleSpend = googleRes.spend
      metaSpend = metaRes.spend
    } catch (err) {
      console.warn('Failed to fetch ad spends in financials route:', err)
    }

    const financials = await getChannelFinancials(
      { from: fromDate, to: toDate },
      customToken,
      customEnterpriseId,
      bypassCache,
      manualBudgets,
      googleSpend,
      metaSpend
    )

    return NextResponse.json(financials, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=900, stale-while-revalidate=300'
      }
    })
  } catch (error: any) {
    console.error('Leads Financials API Route error:', error)
    if (error instanceof TeleCRMApiError || (error && error.name === 'TeleCRMApiError')) {
      const status = error.status === 401 || error.status === 403 || error.status === 404 ? 401 : 500
      return NextResponse.json(
        { error: `TeleCRM Live API: ${error.message}. Please verify your credentials in Settings.` },
        { status }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
