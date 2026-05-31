// app/api/auth/change-password/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth'
import { getUserByEmail, updateUser } from '@/lib/user-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const sessionUser = getCurrentUser(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both current and new password are required.' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
  }

  const user = await getUserByEmail(sessionUser.email)
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
  }

  await updateUser(sessionUser.email, { passwordHash: hashPassword(newPassword) })

  return NextResponse.json({ success: true, message: 'Password changed successfully.' })
}
