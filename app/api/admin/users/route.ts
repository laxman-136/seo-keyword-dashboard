// app/api/admin/users/route.ts
// Admin-only endpoints: list users, approve, reject, delete, export
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getAllUsers, updateUser, deleteUser, exportUsersAsEnvVar
} from '@/lib/user-store'
import { getActiveAccessGrantSummaries } from '@/lib/access-store'

export const dynamic = 'force-dynamic'

// ─── Protected account — can NEVER be deleted or demoted, by anyone ──────────
const SUPER_ADMIN_EMAIL = 'laxmansubramanyam@gmail.com'

function isSuperAdminAccount(email: string) {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

function requireAdmin(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) return { error: 'Unauthorized', status: 401, user: null }
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return { error: 'Forbidden: Admins only', status: 403, user: null }
  }
  return { error: null, status: 200, user }
}

// GET — list all users
export async function GET(request: NextRequest) {
  const { error, status } = requireAdmin(request)
  if (error) return NextResponse.json({ error }, { status })

  const users = (await getAllUsers()).map(u => ({
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    approvedAt: u.approvedAt,
    approvedBy: u.approvedBy
  }))

  const includeGrants = request.nextUrl.searchParams.get('includeGrants') === 'true'
  if (!includeGrants) {
    return NextResponse.json({ users })
  }

  const grantSummaries = await getActiveAccessGrantSummaries()
  return NextResponse.json({ users, grantSummaries })
}

// POST — approve, reject, delete, or change role
export async function POST(request: NextRequest) {
  const { error, status, user: adminUser } = requireAdmin(request)
  if (error || !adminUser) return NextResponse.json({ error }, { status })

  const { action, targetEmail, role } = await request.json()

  if (!action || !targetEmail) {
    return NextResponse.json({ error: 'action and targetEmail are required.' }, { status: 400 })
  }

  const targetNorm = targetEmail.trim().toLowerCase()

  // ── Hard lock: super admin account is PERMANENTLY protected ─────────────
  // No one can delete or demote laxmansubramanyam@gmail.com — not even themselves.
  if (isSuperAdminAccount(targetNorm) && (action === 'delete' || action === 'set-role')) {
    return NextResponse.json({
      error: 'The super admin account is permanently protected and cannot be deleted or modified.'
    }, { status: 403 })
  }

  const allUsers = await getAllUsers()
  const target   = allUsers.find(u => u.email.toLowerCase() === targetNorm)
  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  // Regular admins cannot touch other admin/superadmin accounts
  if (target.role === 'superadmin' && adminUser.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only the super admin can modify super admin accounts.' }, { status: 403 })
  }

  // Prevent self-deletion for everyone
  if (action === 'delete' && targetNorm === adminUser.email.toLowerCase()) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  switch (action) {
    case 'approve':
      await updateUser(targetNorm, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminUser.email
      })
      return NextResponse.json({ success: true, message: `${target.name} approved.` })

    case 'reject':
      await updateUser(targetNorm, { status: 'rejected' })
      return NextResponse.json({ success: true, message: `${target.name} rejected.` })

    case 'delete':
      // Only super admin can delete admin accounts
      if (adminUser.role !== 'superadmin' && (target.role === 'admin' || target.role === 'superadmin')) {
        return NextResponse.json({ error: 'Only the super admin can delete admin accounts.' }, { status: 403 })
      }
      await deleteUser(targetNorm)
      return NextResponse.json({ success: true, message: `${target.name} deleted.` })

    case 'set-role':
      if (adminUser.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only the super admin can change roles.' }, { status: 403 })
      }
      if (!['admin', 'ceo', 'user'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
      }
      await updateUser(targetNorm, { role })
      return NextResponse.json({ success: true, message: `${target.name}'s role set to ${role}.` })

    case 'export':
      const exported = exportUsersAsEnvVar()
      return NextResponse.json({ success: true, data: exported })

    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  }
}
