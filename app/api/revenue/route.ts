// app/api/revenue/route.ts
import { NextResponse } from 'next/server'
import { fetchRevenueMonthly, fetchRevenueCourses } from '@/lib/sheets'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('refresh') === 'true'
    const sheetId = searchParams.get('sheetId') || undefined
    const apiKey = searchParams.get('apiKey') || undefined

    const [monthlyResult, coursesResult] = await Promise.all([
      fetchRevenueMonthly(bypassCache, sheetId, apiKey),
      fetchRevenueCourses(bypassCache, sheetId, apiKey)
    ])

    return NextResponse.json({
      monthly: monthlyResult.rows,
      courses: coursesResult.rows,
      isMock: monthlyResult.isMock,
      lastUpdated: monthlyResult.lastUpdated,
      fallbackReason: monthlyResult.fallbackReason
    }, {
      headers: {
        'Cache-Control': bypassCache 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    console.error('Revenue API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
