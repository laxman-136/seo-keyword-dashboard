'use client'
// components/layout/AuthShell.tsx
// Controls what wraps each page:
//   /login, /register  →  full-screen standalone (NO sidebar)
//   all other routes   →  sidebar + main dashboard layout

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import FloatingAdminButton from '@/components/layout/FloatingAdminButton'

const AUTH_PAGES = ['/login', '/register']

interface Props { children: React.ReactNode }

export default function AuthShell({ children }: Props) {
  const pathname   = usePathname()
  const router     = useRouter()
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Auth pages (login/register) — never need a session check
    if (isAuthPage) {
      setChecked(true)
      return
    }

    // Dashboard pages — verify session
    fetch('/api/auth/me')
      .then(r => {
        if (!r.ok) {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`)
        } else {
          setChecked(true)
        }
      })
      .catch(() => router.replace('/login'))
  }, [pathname, isAuthPage, router])

  // ── Login / Register: full-screen, no sidebar ────────────────────────────
  if (isAuthPage) {
    return <>{children}</>
  }

  // ── Dashboard: show spinner while verifying session ──────────────────────
  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  // ── Authenticated dashboard layout: sidebar + content + floating button ────
  return (
    <div className="flex min-h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {children}
      </main>
      {/* Sticky floating button — always visible while scrolling */}
      <FloatingAdminButton />
    </div>
  )
}
