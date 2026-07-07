// app/api/keywords/daily/route.ts
import { NextResponse } from 'next/server'
import { fetchSheetValues } from '@/lib/sheets'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache revalidation

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

function generateMockDailyKeywords() {
  const values: string[][] = []
  // Headers
  values.push(['Date', 'Keyword', 'Group', 'Page', 'Position'])

  const keywordsList = [
    { name: 'oracle fusion scm training', group: 'Oracle SCM' },
    { name: 'oracle fusion hcm course', group: 'Oracle HCM' },
    { name: 'oracle fusion financials', group: 'Oracle Financials' },
    { name: 'sap training online', group: 'SAP' },
    { name: 'oracle oic integration course', group: 'Oracle Technical' },
    { name: 'oracle ppm fusion training', group: 'Oracle PPM' },
    { name: 'oracle fusion manufacturing online', group: 'Oracle Mfg' }
  ]

  const today = new Date()
  // Generate 30 days of daily rankings for the keywords
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    keywordsList.forEach((kw, kwIdx) => {
      // Fluctuating daily position using math functions and randomness
      const progressFactor = (30 - i) * 0.1 // Rank improves slowly over time
      const fluctuation = Math.round(Math.sin((i + kwIdx * 2) * 0.5) * 2 + (Math.random() - 0.5) * 2)
      const startBase = 15 + kwIdx * 4
      
      const position = Math.max(1, Math.round(startBase - progressFactor + fluctuation))
      const page = Math.ceil(position / 10)

      values.push([
        dateStr,
        kw.name,
        kw.group,
        String(page),
        String(position)
      ])
    })
  }

  return { values }
}

function generateMockSearchVolumesForKeywords(keywords: string[]) {
  const volumes: Record<string, any> = {}
  keywords.forEach(kw => {
    let hash = 0
    for (let i = 0; i < kw.length; i++) {
      hash = kw.charCodeAt(i) + ((hash << 5) - hash)
    }
    hash = Math.abs(hash)
    
    const priorities = ['HIGH', 'MEDIUM', 'LOW']
    const competition = priorities[hash % 3]
    const avgMonthlySearches = (hash % 15) * 100 + 50
    
    const monthlySearchVolumes: any[] = []
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const now = new Date()
    for (let i = 12; i > 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlySearchVolumes.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        volume: Math.round(avgMonthlySearches * (1 + Math.sin(d.getMonth()) * 0.3))
      })
    }

    volumes[kw] = {
      searchVolume: avgMonthlySearches,
      competition,
      competitionIndex: Math.round(hash % 100),
      monthlySearchVolumes
    }
  })
  return volumes
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    // Fallback immediately if sheetId is 'mock' or not configured
    if (!sheetId || sheetId === 'mock' || !apiKey) {
      const mock = generateMockDailyKeywords()
      const mockKeywords = Array.from(new Set(mock.values.slice(1).map(r => r[1])))
      return NextResponse.json({
        ...mock,
        searchVolumes: generateMockSearchVolumesForKeywords(mockKeywords),
        isMock: true,
        fallbackReason: 'Showing mock daily keywords data.'
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }

    let values: string[][] = []
    let isMock = false
    let fallbackReason = undefined

    try {
      values = await fetchSheetValues(sheetId, apiKey, 'Daily Keywords', bypassCache)
    } catch (err: any) {
      console.warn(`Daily Keywords fetch failed from Google Sheets: ${err.message}. Falling back to mock data.`)
      const mock = generateMockDailyKeywords()
      values = mock.values
      isMock = true
      fallbackReason = 'Failed to fetch from Google Sheets API. Falling back to mock daily keyword rankings.'
    }

    // Extract unique keywords from grid
    const uniqueKeywords = Array.from(new Set(
      values.slice(1)
        .map(row => row[1]?.trim())
        .filter(Boolean)
    ))

    const searchVolumes: Record<string, any> = {}

    if (uniqueKeywords.length > 0) {
      // 1. Fetch google ads credentials from Supabase
      let googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId
      if (supabase) {
        try {
          const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle()
          if (config) {
            googleDevToken = config.google_developer_token || undefined
            googleClientId = config.google_client_id || undefined
            googleClientSecret = config.google_client_secret || undefined
            googleRefreshToken = config.google_refresh_token || undefined
            googleCustomerId = config.google_customer_id || undefined
            googleManagerId = config.google_manager_id || undefined
          }
        } catch (err) {
          console.warn('Failed to load credentials for daily keywords planning:', err)
        }
      }

      if (supabase) {
        try {
          // Fetch existing cache
          const { data: cachedVolumes, error: cacheErr } = await supabase
            .from('keyword_search_volumes')
            .select('*')
            .in('keyword', uniqueKeywords)
            
          const cacheMap = new Map<string, any>()
          if (!cacheErr && cachedVolumes) {
            cachedVolumes.forEach(row => {
              cacheMap.set(row.keyword, row)
            })
          }

          const now = Date.now()
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
          const staleKeywords: string[] = []

          uniqueKeywords.forEach(kw => {
            const cached = cacheMap.get(kw)
            if (!cached || !cached.updated_at || new Date(cached.updated_at).getTime() < thirtyDaysAgo) {
              staleKeywords.push(kw)
            }
          })

          if (staleKeywords.length > 0) {
            const { fetchKeywordSearchVolumes } = await import('@/lib/google-ads-api')
            const liveMetrics = await fetchKeywordSearchVolumes(
              staleKeywords,
              googleDevToken,
              googleClientId,
              googleClientSecret,
              googleRefreshToken,
              googleCustomerId,
              googleManagerId
            )

            const upserts = Object.entries(liveMetrics).map(([kw, metrics]: [string, any]) => ({
              keyword: kw,
              avg_monthly_searches: metrics.avgMonthlySearches,
              competition: metrics.competition,
              competition_index: metrics.competitionIndex,
              monthly_data: metrics.monthlySearchVolumes,
              updated_at: new Date().toISOString()
            }))

            if (upserts.length > 0) {
              const { error: upsertErr } = await supabase
                .from('keyword_search_volumes')
                .upsert(upserts)
              
              if (upsertErr) {
                console.error('Failed to upsert daily search volumes cache into Supabase:', upsertErr)
              } else {
                upserts.forEach(up => {
                  cacheMap.set(up.keyword, {
                    keyword: up.keyword,
                    avg_monthly_searches: up.avg_monthly_searches,
                    competition: up.competition,
                    competition_index: up.competition_index,
                    monthly_data: up.monthly_data
                  })
                })
              }
            }
          }

          // Build searchVolumes response map
          uniqueKeywords.forEach(kw => {
            const cached = cacheMap.get(kw)
            if (cached) {
              searchVolumes[kw] = {
                searchVolume: Number(cached.avg_monthly_searches || 0),
                competition: cached.competition || 'UNSPECIFIED',
                competitionIndex: Number(cached.competition_index || 0),
                monthlySearchVolumes: cached.monthly_data || []
              }
            } else {
              searchVolumes[kw] = {
                searchVolume: 0,
                competition: 'UNSPECIFIED',
                competitionIndex: 0,
                monthlySearchVolumes: []
              }
            }
          })

        } catch (err) {
          console.error('Failed to enrich daily keywords with cached search volumes:', err)
        }
      } else {
        // Fallback mock enrichment
        try {
          const { fetchKeywordSearchVolumes } = await import('@/lib/google-ads-api')
          const liveMetrics = await fetchKeywordSearchVolumes(uniqueKeywords)
          uniqueKeywords.forEach(kw => {
            const metrics = liveMetrics[kw]
            if (metrics) {
              searchVolumes[kw] = {
                searchVolume: metrics.avgMonthlySearches,
                competition: metrics.competition,
                competitionIndex: metrics.competitionIndex,
                monthlySearchVolumes: metrics.monthlySearchVolumes
              }
            }
          })
        } catch (err) {
          console.error('Failed to enrich daily keywords with fallback mock volume:', err)
        }
      }
    }

    return NextResponse.json({
      values,
      searchVolumes,
      isMock,
      fallbackReason,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': bypassCache
          ? 'no-store, max-age=0'
          : 'public, s-maxage=300, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Daily Keywords API Route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
