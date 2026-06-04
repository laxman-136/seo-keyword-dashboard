// lib/access-store.ts
// Supabase-backed viewer access grants for shared dashboard data sources.

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { ViewerAccessGrant } from './types'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.')
  }
}

function mapGrantRow(row: any): ViewerAccessGrant {
  return {
    id: row.id,
    recipientEmail: row.recipient_email,
    ownerEmail: row.owner_email,
    label: row.label,
    sheetId: row.seo_sheet_id || row.sheet_id || '',
    seoSheetId: row.seo_sheet_id || row.sheet_id || undefined,
    leadsSheetId: row.leads_sheet_id || undefined,
    revenueSheetId: row.revenue_sheet_id || undefined,
    apiKey: row.api_key,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  }
}

export async function getValidAccessGrantsForRecipient(email: string): Promise<ViewerAccessGrant[]> {
  if (!supabase) return []
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('access_grants')
      .select('*')
      .eq('recipient_email', email.toLowerCase())
      .gt('expires_at', now)
      .order('expires_at', { ascending: true })

    if (error) throw error
    return (data || []).map(mapGrantRow)
  } catch (err) {
    console.error('Error fetching viewer access grants:', err)
    return []
  }
}

export async function getValidAccessGrantById(id: string): Promise<ViewerAccessGrant | null> {
  if (!supabase) return null
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('access_grants')
      .select('*')
      .eq('id', id)
      .gt('expires_at', now)
      .single()

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    return data ? mapGrantRow(data) : null
  } catch (err) {
    console.error('Error fetching access grant by id:', err)
    return null
  }
}

export async function getAccessGrantsByOwner(email: string, sheetId?: string): Promise<ViewerAccessGrant[]> {
  if (!supabase) return []
  try {
    let query = supabase.from('access_grants').select('*').eq('owner_email', email.toLowerCase())
    if (sheetId) {
      query = query.or(`seo_sheet_id.eq.${sheetId},sheet_id.eq.${sheetId}`)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapGrantRow)
  } catch (err) {
    console.error('Error fetching owner access grants:', err)
    return []
  }
}

export async function getActiveAccessGrantSummaries(): Promise<Array<{
  ownerEmail: string
  label: string
  sheetId: string
  viewerCount: number
  nextExpiry: string
}>> {
  if (!supabase) return []
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('access_grants')
      .select('*')
      .gt('expires_at', now)
      .order('expires_at', { ascending: true })

    if (error) throw error
    const groups = new Map<string, {
      ownerEmail: string
      label: string
      sheetId: string
      viewerCount: number
      nextExpiry: string
    }>()

    ;(data || []).forEach((row: any) => {
      const activeSheetId = row.seo_sheet_id || row.sheet_id || ''
      const key = `${row.owner_email}::${activeSheetId}`
      const existing = groups.get(key)
      const expiry = row.expires_at
      if (!existing) {
        groups.set(key, {
          ownerEmail: row.owner_email,
          label: row.label,
          sheetId: activeSheetId,
          viewerCount: 1,
          nextExpiry: expiry
        })
      } else {
        existing.viewerCount += 1
        if (new Date(expiry).getTime() < new Date(existing.nextExpiry).getTime()) {
          existing.nextExpiry = expiry
        }
      }
    })

    return Array.from(groups.values()).sort((a, b) => a.ownerEmail.localeCompare(b.ownerEmail) || a.label.localeCompare(b.label))
  } catch (err) {
    console.error('Error fetching access grant summaries:', err)
    return []
  }
}

export async function createAccessGrant(grant: {
  recipientEmail: string
  ownerEmail: string
  label: string
  seoSheetId?: string
  leadsSheetId?: string
  revenueSheetId?: string
  sheetId?: string
  apiKey: string
  expiresAt: string
}): Promise<ViewerAccessGrant> {
  ensureSupabase()
  const client = supabase!
  try {
    const id = crypto.randomUUID()
    const { data, error } = await client.from('access_grants').insert({
      id,
      recipient_email: grant.recipientEmail.toLowerCase(),
      owner_email: grant.ownerEmail.toLowerCase(),
      label: grant.label,
      sheet_id: grant.sheetId || grant.seoSheetId || '',
      seo_sheet_id: grant.seoSheetId || null,
      leads_sheet_id: grant.leadsSheetId || null,
      revenue_sheet_id: grant.revenueSheetId || null,
      api_key: grant.apiKey,
      expires_at: grant.expiresAt,
      created_at: new Date().toISOString()
    }).select().single()

    if (error) {
      console.error('Supabase insert error (access_grants):', error)
      throw new Error(error?.message || 'Supabase insert failed')
    }

    if (!data) {
      console.error('Supabase insert returned no data for access_grants:', { data, error })
      throw new Error('No grant data returned from Supabase. Check server logs for details.')
    }

    return mapGrantRow(data)
  } catch (err: any) {
    console.error('Error creating access grant (unexpected):', err)
    throw err
  }
}

export async function revokeAccessGrant(id: string): Promise<boolean> {
  ensureSupabase()
  const client = supabase!
  try {
    const { error } = await client
      .from('access_grants')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Error revoking access grant:', err)
    return false
  }
}
