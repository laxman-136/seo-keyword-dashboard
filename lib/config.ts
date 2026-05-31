// lib/config.ts
// Utilities for managing client-side Google Sheets configuration

export interface SheetConfig {
  label: string        // Human-readable company/client name
  sheetId: string      // Google Sheets spreadsheet ID
  apiKey: string       // Google Sheets API key
  createdAt: string    // ISO timestamp
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
  
  // Match spreadsheet ID from Google Sheets URLs
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
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
    return raw ? JSON.parse(raw) : []
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
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setActiveConfig(config: SheetConfig): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(config))
  // Also set the individual keys used by the hooks
  localStorage.setItem('client-sheet-id', config.sheetId)
  localStorage.setItem('client-api-key', config.apiKey)
}

export function clearActiveConfig(): void {
  localStorage.removeItem(ACTIVE_KEY)
  localStorage.removeItem('client-sheet-id')
  localStorage.removeItem('client-api-key')
}
