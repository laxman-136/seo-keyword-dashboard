// components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Layers, 
  BarChart2, 
  ShieldCheck, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Settings,
  Building2,
  Users,
  LogOut,
  KeyRound,
  Crown,
  Shield,
  User2,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { getActiveConfig, ACTIVE_CONFIG_UPDATED_EVENT, setActiveConfig } from '@/lib/config'
import { cn } from '@/lib/utils'
import { isSectionAllowed } from '@/lib/auth'

// ─── Active Config Badge ─────────────────────────────────────────────────────
function ActiveConfigBadge() {
  const [activeLabel, setActiveLabel] = React.useState<string | null>(null)
  useEffect(() => {
    const updateActive = () => {
      const cfg = getActiveConfig()
      setActiveLabel(cfg?.label || null)
    }
    updateActive()
    window.addEventListener(ACTIVE_CONFIG_UPDATED_EVENT, updateActive)
    return () => window.removeEventListener(ACTIVE_CONFIG_UPDATED_EVENT, updateActive)
  }, [])
  if (!activeLabel) return null
  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all"
    >
      <Building2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
      <div className="flex-1 overflow-hidden">
        <p className="text-[10px] text-violet-300 uppercase tracking-wider font-bold">Active Source</p>
        <p className="text-xs text-violet-200 font-semibold truncate">{activeLabel}</p>
      </div>
    </Link>
  )
}

// ─── User Menu (bottom of sidebar) ───────────────────────────────────────────
function UserMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [changePw, setChangePw] = useState(false)
  const [curPw, setCurPw]   = useState('')
  const [newPw, setNewPw]   = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwMsg, setPwMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setUser(d.user)
    })
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg(null)
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw })
    })
    const data = await res.json()
    setPwMsg({ ok: res.ok, text: data.message || data.error })
    setPwLoading(false)
    if (res.ok) { setCurPw(''); setNewPw('') }
  }

  const RoleIcon = user?.role === 'superadmin'
    ? Crown
    : user?.role === 'admin'
      ? Shield
      : user?.role === 'viewer'
        ? Eye
        : User2
  const roleBg = user?.role === 'superadmin'
    ? 'text-violet-400'
    : user?.role === 'admin'
      ? 'text-blue-400'
      : user?.role === 'viewer'
        ? 'text-emerald-400'
        : 'text-slate-400'

  if (!user) return null

  if (collapsed) {
    return (
      <button
        onClick={handleLogout}
        title={`Logout (${user.name})`}
        className="w-full flex justify-center p-2.5 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
      >
        <LogOut className="w-4.5 h-4.5" />
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* User card — click to open menu */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{user.name}</p>
          <div className={cn('flex items-center gap-1 text-[10px] font-semibold mt-0.5', roleBg)}>
            <RoleIcon className="w-3 h-3" /> {user.role}
          </div>
        </div>
        <ChevronRight className={cn('w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform', open && 'rotate-90')} />
      </button>

      {/* Dropdown menu */}
      {open && !changePw && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
          </div>

          {/* Admin panel link */}
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              User Management
              {user.role === 'superadmin' && (
                <span className="ml-auto text-[9px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">SUPER</span>
              )}
            </Link>
          )}

          <button
            onClick={() => { setChangePw(true); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Change Password
          </button>

          <div className="border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Change Password inline panel */}
      {changePw && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Change Password
            </p>
            <button onClick={() => { setChangePw(false); setPwMsg(null) }} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
          </div>
          <form onSubmit={handleChangePw} className="space-y-2">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={curPw}
                onChange={e => setCurPw(e.target.value)}
                placeholder="Current password"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-500 pr-8"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="New password (min 8 chars)"
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-violet-500"
            />
            {pwMsg && (
              <p className={cn('text-[10px] font-medium', pwMsg.ok ? 'text-emerald-400' : 'text-red-400')}>
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null)
  const [activeConfig, setActiveConfigState] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setIsCollapsed(true)
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setUser(d.user)
        }
      })
  }, [])

  useEffect(() => {
    const updateConfig = () => {
      setActiveConfigState(getActiveConfig())
    }
    updateConfig()
    window.addEventListener(ACTIVE_CONFIG_UPDATED_EVENT, updateConfig)
    return () => window.removeEventListener(ACTIVE_CONFIG_UPDATED_EVENT, updateConfig)
  }, [])

  const handleToggle = () => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    keywords: true,
    traffic: false,
    leads: false,
    site: false,
    revenue: false,
  })

  const navigationSections = [
    {
      id: 'keywords',
      title: 'Keyword Rankings',
      icon: Sparkles,
      items: [
        { label: 'Overview',       href: '/',        icon: LayoutDashboard },
        { label: 'By Group',       href: '/groups',  icon: Layers },
        { label: 'Compare Months', href: '/compare', icon: BarChart2 }
      ]
    },
    {
      id: 'traffic',
      title: 'Traffic Analytics',
      icon: BarChart2,
      items: [
        { label: 'Overview',        href: '/traffic',          icon: BarChart2 },
        { label: 'By Source',       href: '/traffic/sources',  icon: Layers },
        { label: 'By Countries',    href: '/traffic/countries',icon: LayoutDashboard },
        { label: 'Compare Periods', href: '/traffic/compare',  icon: BarChart2 }
      ]
    },
    {
      id: 'leads',
      title: 'Leads Report',
      icon: Users,
      items: [
        { label: 'Overview',          href: '/leads',          icon: LayoutDashboard },
        { label: 'By Course',         href: '/leads/courses',  icon: Layers },
        { label: 'Funnel & Conversion',href: '/leads/funnel',   icon: BarChart2 },
        { label: 'Monthly Trends',     href: '/leads/trends',   icon: BarChart2 },
        { label: 'Compare & Reports', href: '/leads/compare',  icon: BarChart2 }
      ]
    },
    {
      id: 'revenue',
      title: 'Revenue & Conversion',
      icon: Crown,
      items: [
        { label: 'Overview',          href: '/revenue',          icon: LayoutDashboard },
        { label: 'By Course',         href: '/revenue/courses',  icon: Layers },
        { label: 'Ad Spend & ROAS',   href: '/revenue/ads',      icon: BarChart2 },
        { label: 'By Lead Source',    href: '/revenue/sources',  icon: Layers },
        { label: 'Compare & Reports', href: '/revenue/compare',  icon: BarChart2 }
      ]
    },
    {
      id: 'site',
      title: 'Site Status',
      icon: Building2,
      items: [
        { label: 'Site Status', href: '/site-status', icon: Building2 }
      ]
    }
  ]

  const allowedSections = navigationSections.filter(sec => 
    isSectionAllowed(sec.id, user?.role || null, activeConfig?.label || null)
  )

  const showSettings = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'ceo'

  useEffect(() => {
    const activeSection = navigationSections.find(sec =>
      sec.items.some(item => pathname === item.href)
    )
    if (activeSection) {
      setOpenSections(prev => ({
        ...prev,
        [activeSection.id]: true
      }))
    }
  }, [pathname])

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleSectionClick = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false)
      localStorage.setItem('sidebar-collapsed', 'false')
      setOpenSections(prev => ({
        ...prev,
        [id]: true
      }))
    } else {
      toggleSection(id)
    }
  }

  const renderSection = (section: typeof navigationSections[0], forceExpanded = false) => {
    const collapsedForRender = forceExpanded ? false : isCollapsed
    const isOpen = openSections[section.id]
    const hasActiveItem = section.items.some(item => pathname === item.href)
    const SectionIcon = section.icon

    if (collapsedForRender) {
      return (
        <div key={section.id} className="relative group flex justify-center py-1">
          <button
            onClick={() => handleSectionClick(section.id)}
            className={cn(
              "p-3 rounded-xl transition-all duration-150 relative",
              hasActiveItem
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent"
            )}
            title={`${section.title} (Click to expand)`}
          >
            <SectionIcon className="w-4.5 h-4.5 shrink-0" />
            {hasActiveItem && (
              <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
            )}
          </button>
        </div>
      )
    }

    return (
      <div key={section.id} className="space-y-1">
        <button
          onClick={() => handleSectionClick(section.id)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 select-none group text-left",
            hasActiveItem
              ? "text-slate-200 bg-slate-800/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          )}
        >
          <div className="flex items-center gap-2.5">
            <SectionIcon className={cn("w-4 h-4 transition-colors", hasActiveItem ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300")} />
            <span className="truncate">{section.title}</span>
          </div>
          <ChevronRight className={cn(
            "w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0",
            isOpen && "rotate-90 text-slate-400"
          )} />
        </button>

        {isOpen && (
          <div className="pl-3.5 ml-4 border-l border-slate-800 space-y-1 mt-1 transition-all duration-200 animate-in fade-in slide-in-from-top-1 duration-150">
            {section.items.map(item => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group/item",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                      : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-400" : "text-slate-400 group-hover/item:text-slate-300")} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderSettingsLink = (forceExpanded = false) => {
    const collapsedForRender = forceExpanded ? false : isCollapsed
    const isActive = pathname === '/settings'

    if (collapsedForRender) {
      return (
        <div className="relative group flex justify-center py-1">
          <Link
            href="/settings"
            className={cn(
              "p-3 rounded-xl transition-all duration-150 relative",
              isActive
                ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                : "hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent"
            )}
            title="Data Sources Settings"
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            {isActive && (
              <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-500/50" />
            )}
          </Link>
        </div>
      )
    }

    return (
      <Link
        href="/settings"
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 text-left",
          isActive
            ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
            : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent"
        )}
      >
        <Settings className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-400" : "text-slate-400")} />
        <span className="truncate">Data Sources</span>
      </Link>
    )
  }

  const sidebarWidthClass = isMounted && isCollapsed ? "w-20" : "w-64"
  const desktopSidebarClass = cn("hidden lg:flex", sidebarWidthClass)
  const mobileSidebarClass = mobileOpen ? "fixed inset-y-0 left-0 z-50 w-72 lg:hidden" : "hidden lg:hidden"

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
    return
  }, [mobileOpen])

  return (
    <>
      {mobileOpen && onClose && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 shadow-[5px_0_25px_-5px_rgba(0,0,0,0.4)] text-slate-400 flex flex-col min-h-screen shrink-0 no-print transition-all duration-300 ease-in-out overflow-x-hidden z-20 relative",
        desktopSidebarClass
      )}>
        <div className={cn(
          "relative p-6 border-b border-slate-800 flex items-center justify-between",
          isMounted && isCollapsed && "justify-center p-4"
        )}>
          <Link
            href={isMounted && isCollapsed ? "#" : "/"}
            onClick={(e) => {
              if (isMounted && isCollapsed) {
                e.preventDefault()
                handleToggle()
              }
            }}
            className="flex items-center gap-3 group shrink-0 pr-8"
            title={isMounted && isCollapsed ? "Expand Sidebar" : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-105 shrink-0">
              <Sparkles className="w-5 h-5 fill-current text-white" />
            </div>
            {(!isMounted || !isCollapsed) && (
              <div className="flex flex-col">
                <h1 className="text-white font-bold leading-none tracking-wide text-base whitespace-nowrap">SEO INTELLIGENCE</h1>
                <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase mt-0.5">IT Training Hub</span>
              </div>
            )}
          </Link>

          {(!isMounted || !isCollapsed) && !mobileOpen && (
            <button
              onClick={handleToggle}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 text-slate-300 hover:text-emerald-400 shadow-sm transition-all shrink-0 z-30"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {mobileOpen && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/95 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {allowedSections.map(sec => renderSection(sec))}
          
          {showSettings && (
            <>
              <div className="border-t border-slate-800/40 my-3 mx-1" />
              {renderSettingsLink()}
            </>
          )}
        </nav>

        <div className={cn("p-4 border-t border-slate-800 text-xs space-y-3", isMounted && isCollapsed && "p-2")}>
          {(!isMounted || !isCollapsed) && (
            <>
              <ActiveConfigBadge />
              <div className="glass-panel-dark px-3 py-2.5 rounded-lg flex items-center gap-2 border border-slate-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-slate-300 font-medium truncate">Secure Access</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">TechLeads IT Dashboard</p>
                </div>
              </div>
            </>
          )}

          <UserMenu collapsed={isMounted && isCollapsed} />

          <button
            onClick={handleToggle}
            className={cn(
              "w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150",
              isMounted && isCollapsed
                ? "justify-center text-slate-400 hover:text-slate-200 bg-slate-800/40 border-slate-800/80 hover:bg-slate-800"
                : "text-slate-400 hover:text-slate-200 bg-slate-800/20 border-slate-800/40 hover:bg-slate-800/60"
            )}
            title={isMounted && isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isMounted && isCollapsed
              ? <ChevronRight className="w-4.5 h-4.5 text-emerald-400" />
              : <ChevronLeft className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
            {(!isMounted || !isCollapsed) && <span>Collapse Sidebar</span>}
          </button>

          {(!isMounted || !isCollapsed) && (
            <p className="text-center text-[10px] text-slate-600 mt-2">SEO Rankings v2.0.0</p>
          )}
        </div>
      </aside>

      {/* Mobile aside: slide-in panel */}
      <aside
        aria-hidden={!mobileOpen}
        role="dialog"
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 lg:hidden transform transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto">
          <div className="bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col min-h-screen">
            {/* re-use header/nav/content from desktop */}
            <div className={cn(
              "relative p-6 border-b border-slate-800 flex items-center justify-between",
              isMounted && isCollapsed && "justify-center p-4"
            )}>
              <Link href="/" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 transition-transform group-hover:scale-105 shrink-0">
                  <Sparkles className="w-5 h-5 fill-current text-white" />
                </div>
                {(!isMounted || !isCollapsed) && (
                  <div className="flex flex-col">
                    <h1 className="text-white font-bold leading-none tracking-wide text-base whitespace-nowrap">SEO INTELLIGENCE</h1>
                    <span className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase mt-0.5">IT Training Hub</span>
                  </div>
                )}
              </Link>

              {mobileOpen && onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/95 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
              {allowedSections.map(sec => renderSection(sec, true))}
              
              {showSettings && (
                <>
                  <div className="border-t border-slate-800/40 my-3 mx-1" />
                  {renderSettingsLink(true)}
                </>
              )}
            </nav>

            <div className={cn("p-4 border-t border-slate-800 text-xs space-y-3", isMounted && isCollapsed && "p-2")}>
              {(!isMounted || !isCollapsed) && (
                <>
                  <ActiveConfigBadge />
                  <div className="glass-panel-dark px-3 py-2.5 rounded-lg flex items-center gap-2 border border-slate-800/80">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-slate-300 font-medium truncate">Secure Access</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">TechLeads IT Dashboard</p>
                    </div>
                  </div>
                </>
              )}

              <UserMenu collapsed={false} />

              <button
                onClick={handleToggle}
                className={cn(
                  "w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-150",
                  isMounted && isCollapsed
                    ? "justify-center text-slate-400 hover:text-slate-200 bg-slate-800/40 border-slate-800/80 hover:bg-slate-800"
                    : "text-slate-400 hover:text-slate-200 bg-slate-800/20 border-slate-800/40 hover:bg-slate-800/60"
                )}
                title={isMounted && isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isMounted && isCollapsed
                  ? <ChevronRight className="w-4.5 h-4.5 text-emerald-400" />
                  : <ChevronLeft className="w-4.5 h-4.5 text-emerald-400 shrink-0" />}
                {(!isMounted || !isCollapsed) && <span>Collapse Sidebar</span>}
              </button>

              {(!isMounted || !isCollapsed) && (
                <p className="text-center text-[10px] text-slate-600 mt-2">SEO Rankings v2.0.0</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
