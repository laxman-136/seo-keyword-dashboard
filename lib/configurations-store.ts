// lib/configurations-store.ts
// Database-backed configuration storage using Supabase PostgreSQL

import { createClient } from '@supabase/supabase-js'
import { SheetConfig } from './config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your .env.local variables.')
  }
}

function mapRowToConfig(row: any): SheetConfig {
  return {
    label: row.label,
    seoSheetId: row.seo_sheet_id || undefined,
    leadsSheetId: row.leads_sheet_id || undefined,
    revenueSheetId: row.revenue_sheet_id || undefined,
    apiKey: row.api_key || undefined,
    gaPropertyId: row.ga_property_id || undefined,
    gaClientEmail: row.ga_client_email || undefined,
    gaPrivateKey: row.ga_private_key || undefined,
    metaAdAccountId: row.meta_ad_account_id || undefined,
    metaAccessToken: row.meta_access_token || undefined,
    googleDeveloperToken: row.google_developer_token || undefined,
    googleClientId: row.google_client_id || undefined,
    googleClientSecret: row.google_client_secret || undefined,
    googleRefreshToken: row.google_refresh_token || undefined,
    googleCustomerId: row.google_customer_id || undefined,
    googleManagerId: row.google_manager_id || undefined,
    metaPrepaidBalance: row.meta_prepaid_balance ? Number(row.meta_prepaid_balance) : undefined,
    googlePrepaidBalance: row.google_prepaid_balance ? Number(row.google_prepaid_balance) : undefined,
    telecrmApiToken: row.telecrm_api_token || undefined,
    telecrmEnterpriseId: row.telecrm_enterprise_id || undefined,
    createdAt: row.created_at,
    sheetId: row.seo_sheet_id || '',
    isActive: row.is_active || false
  }
}

export async function getConfigurations(): Promise<SheetConfig[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('configurations')
      .select('*')
      .order('label', { ascending: true })

    if (error) {
      // Return empty list if table doesn't exist yet, avoiding crashing before migration runs
      if (error.code === '42P01') {
        console.warn('⚠️ configurations table does not exist in Supabase yet. Please run migration.')
        return []
      }
      throw error
    }
    return (data || []).map(mapRowToConfig)
  } catch (err) {
    console.error('Error fetching configurations from Supabase:', err)
    return []
  }
}

export async function saveConfiguration(config: SheetConfig, ownerEmail: string): Promise<void> {
  ensureSupabase()
  const client = supabase!

  const payload = {
    label: config.label,
    seo_sheet_id: config.seoSheetId || null,
    leads_sheet_id: config.leadsSheetId || null,
    revenue_sheet_id: config.revenueSheetId || null,
    api_key: config.apiKey || null,
    ga_property_id: config.gaPropertyId || null,
    ga_client_email: config.gaClientEmail || null,
    ga_private_key: config.gaPrivateKey || null,
    meta_ad_account_id: config.metaAdAccountId || null,
    meta_access_token: config.metaAccessToken || null,
    google_developer_token: config.googleDeveloperToken || null,
    google_client_id: config.googleClientId || null,
    google_client_secret: config.googleClientSecret || null,
    google_refresh_token: config.googleRefreshToken || null,
    google_customer_id: config.googleCustomerId || null,
    google_manager_id: config.googleManagerId || null,
    meta_prepaid_balance: config.metaPrepaidBalance || null,
    google_prepaid_balance: config.googlePrepaidBalance || null,
    telecrm_api_token: config.telecrmApiToken || null,
    telecrm_enterprise_id: config.telecrmEnterpriseId || null,
    owner_email: ownerEmail.toLowerCase(),
    updated_at: new Date().toISOString()
  }

  try {
    const { data: existing, error: findError } = await client
      .from('configurations')
      .select('id, is_active')
      .eq('label', config.label)
      .maybeSingle()

    if (findError) throw findError

    if (existing) {
      const { error: updateError } = await client
        .from('configurations')
        .update(payload)
        .eq('id', existing.id)
      if (updateError) throw updateError
    } else {
      // Set to active if it is the first config
      const existingConfigs = await getConfigurations()
      const isFirst = existingConfigs.length === 0

      const { error: insertError } = await client
        .from('configurations')
        .insert({
          ...payload,
          is_active: isFirst,
          created_at: config.createdAt || new Date().toISOString()
        })
      if (insertError) throw insertError
    }
  } catch (err) {
    console.error('Error saving configuration to Supabase:', err)
    throw err
  }
}

export async function deleteConfiguration(label: string): Promise<void> {
  ensureSupabase()
  const client = supabase!
  try {
    const { error } = await client
      .from('configurations')
      .delete()
      .eq('label', label)
    if (error) throw error
  } catch (err) {
    console.error('Error deleting configuration from Supabase:', err)
    throw err
  }
}

export async function setActiveConfiguration(label: string | null): Promise<void> {
  ensureSupabase()
  const client = supabase!
  try {
    if (!label) {
      const { error } = await client
        .from('configurations')
        .update({ is_active: false })
        .neq('label', 'dummy-unmatched-label-string')
      if (error) throw error
      return
    }

    // Update the targeted configuration
    const { error: updateTrue } = await client
      .from('configurations')
      .update({ is_active: true })
      .eq('label', label)

    if (updateTrue) throw updateTrue

    // De-activate all other configurations
    const { error: updateFalse } = await client
      .from('configurations')
      .update({ is_active: false })
      .neq('label', label)

    if (updateFalse) throw updateFalse
  } catch (err) {
    console.error('Error setting active configuration in Supabase:', err)
    throw err
  }
}
