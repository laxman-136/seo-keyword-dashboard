// app/api/ads/google/searchterms/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, isSectionAllowed } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'
import { getOrSetCache } from '@/lib/cache'
import { resolveDateRange, DatePreset } from '@/lib/dateRange'
import { fetchGoogleSearchTerms } from '@/lib/google-ads-api'

export const dynamic = 'force-dynamic'

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
    const cacheKey = `google_searchterms_${dateRange.from}_${dateRange.to}_${dateRange.preset}_${googleCustomerId || 'default'}`

    const cacheResult = await getOrSetCache(
      cacheKey,
      () => fetchGoogleSearchTerms(dateRange, googleDevToken, googleClientId, googleClientSecret, googleRefreshToken, googleCustomerId, googleManagerId),
      bypassCache
    )

    return NextResponse.json({
      searchTerms: cacheResult.data,
      lastRefreshedAt: cacheResult.cachedAt,
      nextRefreshAt: cacheResult.expiresAt,
      isCached: cacheResult.isCached
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Google Search Terms API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
