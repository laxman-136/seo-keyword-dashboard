// lib/course-mapping.ts

import { COURSE_TO_GROUP } from './telecrm-api'

export const COURSE_FEES: Record<string, number> = {
  'Oracle Fusion SCM': Number(process.env.COURSE_FEE_SCM) || 27169,
  'Oracle Fusion HCM': Number(process.env.COURSE_FEE_HCM) || 19929,
  'Oracle Fusion Financials': Number(process.env.COURSE_FEE_FINANCIALS) || 21950,
  'Oracle Fusion Technical': Number(process.env.COURSE_FEE_TECHNICAL) || 22350,
  'Oracle Fusion PPM': Number(process.env.COURSE_FEE_PPM) || 27857,
  'Oracle Fusion WMS': Number(process.env.COURSE_FEE_SCM) || 27169, // maps to SCM fee
  'Oracle TMS': Number(process.env.COURSE_FEE_SCM) || 27169,        // maps to SCM fee
  'Oracle EBS': Number(process.env.COURSE_FEE_FINANCIALS) || 21950, // maps to Financials fee
  'SAP': Number(process.env.COURSE_FEE_DEFAULT) || 23290,
  'Oracle Integration': Number(process.env.COURSE_FEE_TECHNICAL) || 22350,
  'Unknown Course': Number(process.env.COURSE_FEE_DEFAULT) || 23290
}

/**
 * Normalizes any course name string to a clean group name and retrieves its corresponding fee
 */
export function getCourseFeeAndName(rawCourseName: string): { name: string; fee: number } {
  const normalized = COURSE_TO_GROUP[rawCourseName || ''] || 'Unknown Course'
  const fee = COURSE_FEES[normalized] || COURSE_FEES['Unknown Course']
  return { name: normalized, fee }
}
