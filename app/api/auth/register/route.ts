// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { addUser, getUserByEmail } from '@/lib/user-store'
import { User } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()

    const existing = await getUserByEmail(normalized)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const newUser: User = {
      email: normalized,
      name: name.trim(),
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'pending', // requires admin approval
      createdAt: new Date().toISOString()
    }

    const result = await addUser(newUser)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    return NextResponse.json({
      success: true,
      message: 'Registration request submitted. An admin will review and approve your account.'
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
