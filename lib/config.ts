// lib/config.ts
// Utilities for managing client-side Google Sheets configuration

export interface SheetConfig {
  label: string        // Human-readable company/client name
  seoSheetId?: string  // SEO, Traffic & Site Status spreadsheet ID
  leadsSheetId?: string // Leads spreadsheet ID
  revenueSheetId?: string // Revenue & Conversion spreadsheet ID
  apiKey?: string       // Google Sheets API key
  gaPropertyId?: string  // GA4 property ID
  gaClientEmail?: string // Service account client email
  gaPrivateKey?: string  // Service account private key
  metaAdAccountId?: string
  metaAccessToken?: string
  googleDeveloperToken?: string
  googleClientId?: string
  googleClientSecret?: string
  googleRefreshToken?: string
  googleCustomerId?: string
  googleManagerId?: string
  metaPrepaidBalance?: number
  googlePrepaidBalance?: number
  telecrmApiToken?: string
  telecrmEnterpriseId?: string
  createdAt: string    // ISO timestamp
  sheetId?: string     // Keep for legacy compatibility
}

const CONFIGS_KEY = 'sheet-configs'
const ACTIVE_KEY = 'active-sheet-config'

/**
 * Extracts the Google Spreadsheet ID from various URL formats:
 * - https://docs.google.com/spreadsheets/d/SHEET_ID/edit
 * - https://docs.google.com/spreadsheets/d/SHEET_ID/view
 * - https://docs.google.com/spreadsheets/d/SHEET_ID
 * - Raw ID directly
 */
export function extractSheetId(input: string): string {
  const trimmed = input.trim()
  
  // Match spreadsheet ID from Google Sheets URLs (handles /d/ID with or without user indices like /u/0/)
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  
  // Assume it's already a raw ID (alphanumeric + underscore/dash)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return trimmed
  
  return trimmed
}

/**
 * Validates that a Sheet ID looks correct (not empty, reasonable length)
 */
export function isValidSheetId(id: string): boolean {
  return id.trim().length > 10 && /^[a-zA-Z0-9_-]+$/.test(id.trim())
}

/**
 * Validates that an API key looks like a Google API key
 */
export function isValidApiKey(key: string): boolean {
  return key.trim().length > 10
}

// ---- Saved Configs ----

export function getSavedConfigs(): SheetConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONFIGS_KEY)
    const list = raw ? JSON.parse(raw) : []
    return list.map((c: any) => ({
      ...c,
      seoSheetId: c.seoSheetId || c.sheetId || '',
      leadsSheetId: c.leadsSheetId || '',
      revenueSheetId: c.revenueSheetId || ''
    }))
  } catch {
    return []
  }
}

export function saveConfig(config: SheetConfig): void {
  const configs = getSavedConfigs()
  // Replace if same label exists
  const idx = configs.findIndex(c => c.label === config.label)
  if (idx >= 0) {
    configs[idx] = config
  } else {
    configs.push(config)
  }
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs))
}

export function deleteConfig(label: string): void {
  const configs = getSavedConfigs().filter(c => c.label !== label)
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs))
  // If active config was deleted, clear active
  const active = getActiveConfig()
  if (active?.label === label) {
    clearActiveConfig()
  }
}

// ---- Active Config ----

export function getActiveConfig(): SheetConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    return {
      ...c,
      seoSheetId: c.seoSheetId || c.sheetId || '',
      leadsSheetId: c.leadsSheetId || '',
      revenueSheetId: c.revenueSheetId || ''
    }
  } catch {
    return null
  }
}

export const ACTIVE_CONFIG_UPDATED_EVENT = 'active-config-updated'

function dispatchActiveConfigUpdate(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ACTIVE_CONFIG_UPDATED_EVENT))
}

export function setActiveConfig(config: SheetConfig): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(config))
  // Also set the individual keys used by the hooks
  localStorage.setItem('client-seo-sheet-id', config.seoSheetId || config.sheetId || '')
  localStorage.setItem('client-leads-sheet-id', config.leadsSheetId || '')
  localStorage.setItem('client-revenue-sheet-id', config.revenueSheetId || '')
  localStorage.setItem('client-api-key', config.apiKey || '')
  localStorage.setItem('client-ga-property-id', config.gaPropertyId || '')
  localStorage.setItem('client-ga-client-email', config.gaClientEmail || '')
  localStorage.setItem('client-ga-private-key', config.gaPrivateKey || '')
  localStorage.setItem('client-meta-ad-account-id', config.metaAdAccountId || '')
  localStorage.setItem('client-meta-access-token', config.metaAccessToken || '')
  localStorage.setItem('client-google-developer-token', config.googleDeveloperToken || '')
  localStorage.setItem('client-google-client-id', config.googleClientId || '')
  localStorage.setItem('client-google-client-secret', config.googleClientSecret || '')
  localStorage.setItem('client-google-refresh-token', config.googleRefreshToken || '')
  localStorage.setItem('client-google-customer-id', config.googleCustomerId || '')
  localStorage.setItem('client-google-manager-id', config.googleManagerId || '')
  localStorage.setItem('client-meta-prepaid-balance', String(config.metaPrepaidBalance || ''))
  localStorage.setItem('client-google-prepaid-balance', String(config.googlePrepaidBalance || ''))
  localStorage.setItem('client-telecrm-api-token', config.telecrmApiToken || '')
  localStorage.setItem('client-telecrm-enterprise-id', config.telecrmEnterpriseId || '')
  dispatchActiveConfigUpdate()
}

export function clearActiveConfig(): void {
  localStorage.removeItem(ACTIVE_KEY)
  localStorage.removeItem('client-seo-sheet-id')
  localStorage.removeItem('client-leads-sheet-id')
  localStorage.removeItem('client-revenue-sheet-id')
  localStorage.removeItem('client-api-key')
  localStorage.removeItem('client-ga-property-id')
  localStorage.removeItem('client-ga-client-email')
  localStorage.removeItem('client-ga-private-key')
  localStorage.removeItem('client-meta-ad-account-id')
  localStorage.removeItem('client-meta-access-token')
  localStorage.removeItem('client-google-developer-token')
  localStorage.removeItem('client-google-client-id')
  localStorage.removeItem('client-google-client-secret')
  localStorage.removeItem('client-google-refresh-token')
  localStorage.removeItem('client-google-customer-id')
  localStorage.removeItem('client-google-manager-id')
  localStorage.removeItem('client-meta-prepaid-balance')
  localStorage.removeItem('client-google-prepaid-balance')
  localStorage.removeItem('client-telecrm-api-token')
  localStorage.removeItem('client-telecrm-enterprise-id')
  dispatchActiveConfigUpdate()
}
