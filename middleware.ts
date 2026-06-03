// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeTokenEdge, getTokenFromCookiesEdge } from '@/lib/auth-edge'

const PUBLIC_PATHS  = ['/', '/login', '/register', '/groups', '/compare', '/traffic', '/leads', '/site-status']
const PUBLIC_PREFIX = [
  '/api/auth/',
  '/api/leads',
  '/api/traffic',
  '/api/keywords',
  '/api/site-status',
  '/_next/',
  '/favicon',
  '/viewer/',
  '/leads/',
  '/traffic/',
  '/compare',
  '/groups',
  '/site-status/',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()
  if (pathname.startsWith('/client-login')) return NextResponse.next()
  if (pathname === '/api/access-grants/login') return NextResponse.next()
  if (PUBLIC_PREFIX.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Read cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const token = getTokenFromCookiesEdge(cookieHeader)
  const user  = token ? decodeTokenEdge(token) : null

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
