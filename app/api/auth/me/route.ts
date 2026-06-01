// app/api/auth/me/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getValidAccessGrantsForRecipient } from '@/lib/access-store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const grants = await getValidAccessGrantsForRecipient(user.email)
  return NextResponse.json({ user, viewerAccess: grants })
}
