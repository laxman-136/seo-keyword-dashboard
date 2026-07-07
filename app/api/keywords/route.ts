// app/api/keywords/route.ts
import { NextResponse } from 'next/server'
import { fetchKeywordData } from '@/lib/sheets'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    // 1. Fetch credentials from active config
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
        console.warn('Failed to load credentials for keywords planning:', err)
      }
    }

    // 2. Fetch keyword rankings from Google Sheets
    const data = await fetchKeywordData(bypassCache, sheetId, apiKey)
    const keywordRows = data.rows || []

    // 3. Enrich keywords with search volume data
    if (keywordRows.length > 0) {
      if (supabase) {
        try {
          const keywordNames = keywordRows.map(k => k.keyword)
          
          // Fetch existing cache
          const { data: cachedVolumes, error: cacheErr } = await supabase
            .from('keyword_search_volumes')
            .select('*')
            .in('keyword', keywordNames)
            
          const cacheMap = new Map<string, any>()
          if (!cacheErr && cachedVolumes) {
            cachedVolumes.forEach(row => {
              cacheMap.set(row.keyword, row)
            })
          }

          // Check for missing or stale cache (older than 30 days)
          const now = Date.now()
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
          const staleKeywords: string[] = []

          keywordNames.forEach(kw => {
            const cached = cacheMap.get(kw)
            if (!cached || !cached.updated_at || new Date(cached.updated_at).getTime() < thirtyDaysAgo) {
              staleKeywords.push(kw)
            }
          })

          // Retrieve live search volumes if needed
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

            // Upsert into Supabase cache
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
                console.error('Failed to upsert search volumes cache into Supabase:', upsertErr)
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

          // Merge cached metrics into sheet rows
          keywordRows.forEach(row => {
            const cached = cacheMap.get(row.keyword)
            if (cached) {
              row.searchVolume = Number(cached.avg_monthly_searches || 0)
              row.competition = cached.competition || 'UNSPECIFIED'
              row.competitionIndex = Number(cached.competition_index || 0)
              row.monthlySearchVolumes = cached.monthly_data || []
            } else {
              row.searchVolume = 0
              row.competition = 'UNSPECIFIED'
              row.competitionIndex = 0
              row.monthlySearchVolumes = []
            }
          })

        } catch (err) {
          console.error('Failed to enrich keywords with cached search volumes:', err)
        }
      } else {
        // Mock fallback if Supabase is offline
        try {
          const { fetchKeywordSearchVolumes } = await import('@/lib/google-ads-api')
          const keywordNames = keywordRows.map(k => k.keyword)
          const liveMetrics = await fetchKeywordSearchVolumes(keywordNames)
          keywordRows.forEach(row => {
            const metrics = liveMetrics[row.keyword]
            if (metrics) {
              row.searchVolume = metrics.avgMonthlySearches
              row.competition = metrics.competition
              row.competitionIndex = metrics.competitionIndex
              row.monthlySearchVolumes = metrics.monthlySearchVolumes
            }
          })
        } catch (err) {
          console.error('Failed to enrich keywords with fallback mock volume:', err)
        }
      }
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
