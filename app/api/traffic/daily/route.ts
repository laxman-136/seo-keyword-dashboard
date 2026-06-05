// app/api/traffic/daily/route.ts
import { NextResponse } from 'next/server'
import { fetchSheetValues } from '@/lib/sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache revalidation

function generateMockDailyTraffic() {
  const values: string[][] = []
  // Headers
  values.push([
    'Date', 'Total Users', 'New Users', 'Organic', 'Direct', 'Social', 'Video',
    'Referral', 'Paid Search', 'Cross Network', 'Display', 'Email', 'Unassigned',
    'India', 'USA', 'UAE', 'Saudi Arabia', 'Canada', 'Pakistan', 'UK', 'Poland', 'Others'
  ])

  const today = new Date()
  // Generate 30 days of mock data
  for (let i = 30; i >= 1; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // Fluctuating daily stats
    const totalUsers = 450 + Math.round(Math.sin(i * 0.4) * 120 + Math.random() * 60)
    const newUsers = Math.round(totalUsers * 0.62)

    // Channels
    const organic = Math.round(totalUsers * 0.45)
    const direct = Math.round(totalUsers * 0.20)
    const social = Math.round(totalUsers * 0.05)
    const video = Math.round(totalUsers * 0.04)
    const referral = Math.round(totalUsers * 0.08)
    const paidSearch = Math.round(totalUsers * 0.12)
    const crossNetwork = Math.round(totalUsers * 0.02)
    const display = Math.round(totalUsers * 0.02)
    const email = Math.round(totalUsers * 0.01)
    const unassigned = totalUsers - (organic + direct + social + video + referral + paidSearch + crossNetwork + display + email)

    // Countries
    const india = Math.round(totalUsers * 0.55)
    const usa = Math.round(totalUsers * 0.15)
    const uae = Math.round(totalUsers * 0.08)
    const saudiArabia = Math.round(totalUsers * 0.06)
    const canada = Math.round(totalUsers * 0.05)
    const pakistan = Math.round(totalUsers * 0.04)
    const uk = Math.round(totalUsers * 0.03)
    const poland = Math.round(totalUsers * 0.02)
    const others = totalUsers - (india + usa + uae + saudiArabia + canada + pakistan + uk + poland)

    values.push([
      dateStr,
      String(totalUsers),
      String(newUsers),
      String(organic),
      String(direct),
      String(social),
      String(video),
      String(referral),
      String(paidSearch),
      String(crossNetwork),
      String(display),
      String(email),
      String(unassigned),
      String(india),
      String(usa),
      String(uae),
      String(saudiArabia),
      String(canada),
      String(pakistan),
      String(uk),
      String(poland),
      String(others)
    ])
  }
  return { values }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    // Fallback immediately if sheetId is 'mock' or not configured
    if (!sheetId || sheetId === 'mock' || !apiKey) {
      return NextResponse.json({
        ...generateMockDailyTraffic(),
        isMock: true,
        fallbackReason: 'Showing mock daily traffic data.'
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }

    try {
      const values = await fetchSheetValues(sheetId, apiKey, 'Daily Traffic', bypassCache)
      if (!values || values.length <= 1) {
        console.warn('Daily Traffic sheet exists but is empty (only headers found). Falling back to mock data.')
        return NextResponse.json({
          ...generateMockDailyTraffic(),
          isMock: true,
          fallbackReason: 'Daily Traffic sheet is empty (only headers found). Showing demo data.'
        }, {
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        })
      }
      return NextResponse.json({
        values,
        isMock: false,
        lastUpdated: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': bypassCache
            ? 'no-store, max-age=0'
            : 'public, s-maxage=300, stale-while-revalidate=60'
        }
      })
    } catch (err: any) {
      console.warn(`Daily Traffic fetch failed from Google Sheets: ${err.message}. Falling back to mock data.`)
      return NextResponse.json({
        ...generateMockDailyTraffic(),
        isMock: true,
        fallbackReason: 'Failed to fetch from Google Sheets API. Falling back to mock daily data.'
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }
  } catch (error) {
    console.error('Daily Traffic API Route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
