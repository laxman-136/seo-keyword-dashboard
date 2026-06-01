// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'
import { makeClearCookie, makeClearViewerCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Set-Cookie': `${makeClearCookie()}, ${makeClearViewerCookie()}`
      }
    }
  )
}
