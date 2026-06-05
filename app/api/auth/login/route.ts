// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { verifyPassword, createToken, makeAuthCookie } from '@/lib/auth'
import { getUserByEmail } from '@/lib/user-store'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log("--> /api/auth/login POST handler hit!")
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await getUserByEmail(email.trim().toLowerCase())

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'Your account is pending admin approval. Please wait.' }, { status: 403 })
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'Your account access has been rejected. Contact an admin.' }, { status: 403 })
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = createToken({ email: user.email, name: user.name, role: user.role })
    const cookie = makeAuthCookie(token)

    return NextResponse.json(
      { success: true, user: { email: user.email, name: user.name, role: user.role } },
      { headers: { 'Set-Cookie': cookie } }
    )
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
