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

  let grants = await getValidAccessGrantsForRecipient(user.email)
  if (user.grantId) {
    const loggedInGrantIdx = grants.findIndex(g => g.id === user.grantId)
    if (loggedInGrantIdx > 0) {
      const [loggedInGrant] = grants.splice(loggedInGrantIdx, 1)
      grants = [loggedInGrant, ...grants]
    }
  }
  return NextResponse.json({ user, viewerAccess: grants })
}
