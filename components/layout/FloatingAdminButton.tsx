'use client'
// components/layout/FloatingAdminButton.tsx
// A fixed floating button for admins — always visible on screen.
// Shows a red badge with count of pending approval requests.

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Users, Clock, LogOut, Crown, Shield, ChevronUp, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Me {
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'user' | 'viewer'
}

const STORAGE_KEY = 'floating-admin-button-position'

export default function FloatingAdminButton() {
  const [me, setMe]               = useState<Me | null>(null)
  const [pendingCount, setPending] = useState(0)
  const [open, setOpen]           = useState(false)
  const [position, setPosition]   = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging]   = useState(false)
  const dragDelta = useRef({ x: 0, y: 0 })
  const draggedRef = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setMe(d.user) })
  }, [])

  // Load saved floating position
  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.x != null && parsed?.y != null) {
          setPosition(parsed)
          return
        }
      } catch {
        // ignore invalid saved data
      }
    }

    const defaultX = window.innerWidth - 220
    const defaultY = window.innerHeight - 100
    setPosition({ x: defaultX, y: defaultY })
  }, [])

  // Persist floating position
  useEffect(() => {
    if (!position || typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  }, [position])

  // Poll pending users every 30s (admins only)
  useEffect(() => {
    if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return

    const check = () => {
      fetch('/api/admin/users')
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.users) {
            setPending(d.users.filter((u: { status: string }) => u.status === 'pending').length)
          }
        })
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [me])

  // Close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Drag support for the floating badge
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || !position) return
      const nextX = event.clientX - dragDelta.current.x
      const nextY = event.clientY - dragDelta.current.y
      const maxX = window.innerWidth - 220
      const maxY = window.innerHeight - 90
      setPosition({
        x: Math.min(Math.max(8, nextX), maxX),
        y: Math.min(Math.max(8, nextY), maxY)
      })
      draggedRef.current = true
    }

    const handlePointerUp = () => {
      if (dragging) {
        setDragging(false)
      }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragging, position])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    dragDelta.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    draggedRef.current = false
    setDragging(true)
  }

  const handleButtonClick = () => {
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    setOpen(v => !v)
  }

  // Only show for logged-in users
  if (!me) return null

  const isAdmin = me.role === 'admin' || me.role === 'superadmin'
  const RoleIcon = me.role === 'superadmin' ? Crown : me.role === 'admin' ? Shield : me.role === 'viewer' ? Eye : Users

  return (
    <div
      ref={ref}
      style={position ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px` } : undefined}
      className="z-[9999] flex flex-col items-end gap-2"
    >

      {/* Popup card */}
      {open && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 p-4 w-64 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* User info */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{me.name}</p>
              <div className={cn(
                'flex items-center gap-1 text-[11px] font-semibold mt-0.5',
                me.role === 'superadmin' ? 'text-violet-400' : me.role === 'admin' ? 'text-blue-400' : 'text-slate-400'
              )}>
                <RoleIcon className="w-3 h-3" />
                {me.role}
              </div>
            </div>
          </div>

          {/* Admin panel link */}
          {isAdmin && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-violet-300">User Management</span>
              </div>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 rounded-full text-[10px] font-bold text-white">
                  <Clock className="w-2.5 h-2.5" />
                  {pendingCount}
                </span>
              )}
              {pendingCount === 0 && (
                <ChevronUp className="w-3.5 h-3.5 text-violet-400 rotate-90 opacity-50 group-hover:opacity-100 transition-opacity" />
              )}
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all text-sm font-medium border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}

      {/* Main FAB button */}
      <button
        onPointerDown={handlePointerDown}
        onClick={handleButtonClick}
        className={cn(
          'relative flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl shadow-2xl shadow-black/40 border transition-all duration-200 group select-none',
          open
            ? 'bg-slate-800 border-slate-600 shadow-violet-500/10'
            : 'bg-slate-900 border-slate-700 hover:border-violet-500/40 hover:shadow-violet-500/10'
        )}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
          {me.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + role */}
        <div className="text-left">
          <p className="text-xs font-bold text-white leading-none truncate max-w-[100px]">{me.name}</p>
          <p className={cn(
            'text-[10px] font-semibold mt-0.5 flex items-center gap-0.5',
            me.role === 'superadmin' ? 'text-violet-400' : me.role === 'admin' ? 'text-blue-400' : 'text-slate-400'
          )}>
            <RoleIcon className="w-2.5 h-2.5" />
            {me.role}
          </p>
        </div>

        {/* Pending badge — always visible on FAB */}
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/40 animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  )
}
