'use client'
// components/layout/AuthShell.tsx
// Controls what wraps each page:
//   /login, /register  →  full-screen standalone (NO sidebar)
//   all other routes   →  sidebar + main dashboard layout

import React, { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import FloatingAdminButton from '@/components/layout/FloatingAdminButton'
import { clearActiveConfig, setActiveConfig } from '@/lib/config'
import { isSectionAllowed } from '@/lib/auth'

const AUTH_PAGES = ['/login', '/register', '/client-login']

interface Props { children: React.ReactNode }

export default function AuthShell({ children }: Props) {
  const pathname   = usePathname()
  const router     = useRouter()
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const [checked, setChecked] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuButtonPos, setMenuButtonPos] = useState<{ left: number; top: number } | null>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0, moved: false })

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mobileMenuButtonPos')
      if (raw) {
        const p = JSON.parse(raw)
        setMenuButtonPos({ left: p.left, top: p.top })
        return
      }
    } catch {
      // ignore
    }

    const computeDefault = () => {
      const left = Math.max(24, window.innerWidth - 64 - 24)
      const top = 24
      setMenuButtonPos({ left, top })
    }

    computeDefault()
    window.addEventListener('resize', computeDefault)
    return () => window.removeEventListener('resize', computeDefault)
  }, [])

  const saveMenuButtonPos = (p: { left: number; top: number }) => {
    try {
      localStorage.setItem('mobileMenuButtonPos', JSON.stringify(p))
    } catch {
      // ignore
    }
  }

  const onMenuPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current.dragging = true
    dragRef.current.moved = false
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.origLeft = menuButtonPos?.left ?? 0
    dragRef.current.origTop = menuButtonPos?.top ?? 0
    window.addEventListener('pointermove', onMenuPointerMove)
    window.addEventListener('pointerup', onMenuPointerUp)
    window.addEventListener('pointercancel', onMenuPointerUp)
  }

  const onMenuPointerMove = (e: PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const moved = Math.abs(dx) > 8 || Math.abs(dy) > 8
    if (!moved && !dragRef.current.moved) return
    dragRef.current.moved = true
    const maxLeft = Math.max(8, window.innerWidth - 64)
    const maxTop = Math.max(8, window.innerHeight - 64)
    const newLeft = Math.min(maxLeft, Math.max(8, dragRef.current.origLeft + dx))
    const newTop = Math.min(maxTop, Math.max(8, dragRef.current.origTop + dy))
    setMenuButtonPos({ left: newLeft, top: newTop })
  }

  const onMenuPointerUp = () => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false
    window.removeEventListener('pointermove', onMenuPointerMove)
    window.removeEventListener('pointerup', onMenuPointerUp)
    window.removeEventListener('pointercancel', onMenuPointerUp)
    if (!dragRef.current.moved) {
      setMobileMenuOpen(true)
    } else if (menuButtonPos) {
      saveMenuButtonPos(menuButtonPos)
    }
  }

  useEffect(() => {
    // Auth pages (login/register) — never need a session check
    if (isAuthPage) {
      setChecked(true)
      return
    }

    // Dashboard pages — verify session and enforce viewer source access
    fetch('/api/auth/me')
      .then(async r => {
        if (!r.ok) {
          router.replace(`/login?from=${encodeURIComponent(pathname)}`)
          return
        }

        const data = await r.json()
        const user = data.user
        const grants = Array.isArray(data.viewerAccess) ? data.viewerAccess : []
        const activeLabel = grants[0]?.label || null

        if (grants.length > 0 && (user?.role === 'user' || user?.role === 'viewer')) {
          const grant = grants[0]
          setActiveConfig({
            label: grant.label,
            sheetId: grant.sheetId,
            apiKey: grant.apiKey,
            createdAt: grant.createdAt
          })
        }

        // Section access validation
        const role = user?.role || null
        let pathSection = ''

        if (pathname === '/' || pathname.startsWith('/groups') || pathname.startsWith('/compare')) {
          pathSection = 'keywords'
        } else if (pathname.startsWith('/traffic')) {
          pathSection = 'traffic'
        } else if (pathname.startsWith('/leads')) {
          pathSection = 'leads'
        } else if (pathname.startsWith('/revenue')) {
          pathSection = 'revenue'
        } else if (pathname.startsWith('/site-status')) {
          pathSection = 'site'
        } else if (pathname.startsWith('/settings')) {
          const allowedSettings = role === 'superadmin' || role === 'admin' || role === 'ceo'
          if (!allowedSettings) {
            router.replace('/')
            return
          }
        }

        if (pathSection) {
          const isAllowed = isSectionAllowed(pathSection, role, activeLabel)
          if (!isAllowed) {
            const sections = ['keywords', 'traffic', 'leads', 'revenue', 'site']
            const allowedSections = sections.filter(sec => isSectionAllowed(sec, role, activeLabel))
            
            if (allowedSections.length > 0) {
              const firstAllowed = allowedSections[0]
              const sectionRedirects: Record<string, string> = {
                keywords: '/',
                traffic: '/traffic',
                leads: '/leads',
                revenue: '/revenue',
                site: '/site-status'
              }
              router.replace(sectionRedirects[firstAllowed])
            } else {
              router.replace('/login')
            }
            return
          }
        }

        setChecked(true)
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
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        <button
          type="button"
          onPointerDown={onMenuPointerDown}
          style={menuButtonPos ?? { right: 24, top: 24, touchAction: 'none' }}
          className="lg:hidden fixed z-40 inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/95 p-3 text-slate-200 shadow-lg shadow-black/20 transition hover:bg-slate-900 touch-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        {children}
      </main>
      {/* Sticky floating button — always visible while scrolling */}
      <FloatingAdminButton />
    </div>
  )
}
