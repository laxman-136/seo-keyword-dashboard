// app/api/keywords/daily/route.ts
import { NextResponse } from 'next/server'
import { fetchSheetValues } from '@/lib/sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache revalidation

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    // Fallback immediately if sheetId is 'mock' or not configured
    if (!sheetId || sheetId === 'mock' || !apiKey) {
      return NextResponse.json({
        ...generateMockDailyKeywords(),
        isMock: true,
        fallbackReason: 'Showing mock daily keywords data.'
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }

    try {
      const values = await fetchSheetValues(sheetId, apiKey, 'Daily Keywords', bypassCache)
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
      console.warn(`Daily Keywords fetch failed from Google Sheets: ${err.message}. Falling back to mock data.`)
      return NextResponse.json({
        ...generateMockDailyKeywords(),
        isMock: true,
        fallbackReason: 'Failed to fetch from Google Sheets API. Falling back to mock daily keyword rankings.'
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }
  } catch (error) {
    console.error('Daily Keywords API Route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
