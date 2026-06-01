// app/api/traffic/route.ts
import { NextResponse } from 'next/server'
import { fetchTrafficData } from '@/lib/sheets'

export const dynamic = 'force-dynamic'
// Set revalidate time for ISR server-side caching (3600 seconds = 1 hour)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    const data = await fetchTrafficData(bypassCache, sheetId, apiKey)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Traffic API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
