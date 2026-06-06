'use client'
// components/layout/FloatingAdminButton.tsx
// A fixed floating button for admins — always visible on screen.
// Shows a red badge with count of pending approval requests.

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Users, Clock, LogOut, Crown, Shield, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Me {
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'ceo' | 'user'
}

export default function FloatingAdminButton() {
  const [me, setMe]               = useState<Me | null>(null)
  const [pendingCount, setPending] = useState(0)
  const [open, setOpen]           = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0, moved: false })

  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Fetch current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const r = await fetch('/api/auth/me')
        if (r.ok) {
          const d = await r.json()
          if (d?.user) setMe(d.user)
        }
      } catch (err) {
        console.warn('Failed to fetch user context:', err)
      }
    }
    loadUser()
  }, [])

  // Poll pending users every 30s (admins only)
  useEffect(() => {
    if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) return

    const check = async () => {
      try {
        const r = await fetch('/api/admin/users')
        if (r.ok) {
          const d = await r.json()
          if (d?.users) {
            setPending(d.users.filter((u: { status: string }) => u.status === 'pending').length)
          }
        }
      } catch (err) {
        console.warn('Failed to poll admin users count:', err)
      }
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

  // Set default position on mount
  useEffect(() => {
    setPos(null)
  }, [])

  // Snap to home helper (snaps to right side)
  const snapToHome = () => {
    setIsSnapping(true)
    const targetLeft = window.innerWidth - 48
    setPos({ left: targetLeft, top: 300 })
    setTimeout(() => {
      setPos(null)
      setIsSnapping(false)
    }, 300)
  }

  // Snap back when popup closes or drag ends
  useEffect(() => {
    if (!open && !isDragging) {
      snapToHome()
    }
  }, [open, isDragging])

  // Pointer handlers for dragging
  const onPointerDown = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el) return
    
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId)
    } catch (err) {}

    const rect = el.getBoundingClientRect()
    dragRef.current.dragging = true
    dragRef.current.moved = false
    dragRef.current.startX = e.clientX
    dragRef.current.startY = e.clientY
    dragRef.current.origLeft = rect.left
    dragRef.current.origTop = rect.top

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const moved = Math.abs(dx) > 8 || Math.abs(dy) > 8
    
    if (!moved && !dragRef.current.moved) return
    
    if (!dragRef.current.moved) {
      dragRef.current.moved = true
      setIsDragging(true)
      setOpen(false) // Close popup when dragging
    }

    const newLeft = Math.min(window.innerWidth - 60, Math.max(0, dragRef.current.origLeft + dx))
    const newTop = Math.min(window.innerHeight - 60, Math.max(0, dragRef.current.origTop + dy))
    setPos({ left: newLeft, top: newTop })
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!dragRef.current.dragging) return
    dragRef.current.dragging = false

    try {
      ref.current?.releasePointerCapture(e.pointerId)
    } catch (err) {}

    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)

    if (!dragRef.current.moved) {
      // Treat as click toggle
      setOpen(v => !v)
    } else {
      // End drag, snap back home
      setIsDragging(false)
      snapToHome()
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // Only show for logged-in users
  if (!me) return null

  const isAdmin = me.role === 'admin' || me.role === 'superadmin' || me.role === 'ceo'
  const RoleIcon = me.role === 'superadmin' ? Crown : me.role === 'admin' ? Shield : me.role === 'ceo' ? Crown : Users

  const isExpanded = open || isDragging

  return (
    <div
      ref={ref}
      style={pos ? { left: pos.left, top: pos.top, touchAction: 'none' } : { right: 0, top: 300, touchAction: 'none' }}
      className={cn(
        "fixed z-[9999] flex flex-col items-end gap-2 touch-none select-none",
        isSnapping && "transition-all duration-300 ease-out"
      )}
      onPointerDown={onPointerDown}
    >
      {/* Popup card */}
      {open && (
        <div className="mr-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 p-4 w-64 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* User info */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {me.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{me.name}</p>
              <div className={cn(
                'flex items-center gap-1 text-[11px] font-semibold mt-0.5',
                me.role === 'superadmin' ? 'text-violet-400' : me.role === 'admin' ? 'text-blue-400' : me.role === 'ceo' ? 'text-amber-400' : 'text-slate-400'
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
        type="button"
        className={cn(
          'relative flex items-center shadow-2xl shadow-black/40 transition-all duration-300 group select-none hover:shadow-violet-500/10 focus:outline-none',
          isExpanded
            ? 'bg-slate-800 border-slate-600 rounded-2xl pl-4 pr-3 py-2.5 gap-2.5 border'
            : 'bg-slate-900 border-y border-l border-slate-700 hover:border-violet-500/40 rounded-l-2xl rounded-r-none pl-2 pr-3 py-2 gap-0 border-r-0'
        )}
      >
        {/* Name + role - visible on left when expanded */}
        {isExpanded && (
          <div className="text-left animate-in fade-in zoom-in-95 duration-200">
            <p className="text-xs font-bold text-white leading-none truncate max-w-[120px]">{me.name}</p>
            <p className={cn(
              'text-[10px] font-semibold mt-0.5 flex items-center gap-0.5',
              me.role === 'superadmin' ? 'text-violet-400' : me.role === 'admin' ? 'text-blue-400' : me.role === 'ceo' ? 'text-amber-400' : 'text-slate-400'
            )}>
              <RoleIcon className="w-2.5 h-2.5" />
              {me.role}
            </p>
          </div>
        )}

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
          {me.name.charAt(0).toUpperCase()}
        </div>

        {/* Pending badge — always visible on FAB */}
        {pendingCount > 0 && (
          <span className={cn(
            "absolute min-w-[20px] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-red-500/40 animate-pulse",
            isExpanded ? "-top-1.5 -right-1.5" : "top-0 left-0 -translate-x-1/3 -translate-y-1/3"
          )}>
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  )
}
