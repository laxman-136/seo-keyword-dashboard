// lib/ga4-api.ts
import { DateRange } from './dateRange'
import { getOrSetCache } from './cache'
import {
  GA4Overview, GA4TrafficSource, GA4LandingPage, GA4PagePath,
  GA4DeviceData, GA4GeoData, GA4DailyPoint, GA4ConversionData,
  GA4SourceLandingRow, GA4ReturningData
} from './types'

// Dynamic check for credentials
function hasGA4Credentials(): boolean {
  const propertyId = process.env.GA4_PROPERTY_ID
  const jsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  
  if (!propertyId || !jsonStr) return false
  if (propertyId === 'your_ga4_property_id' || jsonStr.includes('your_oauth2_client_id')) return false
  
  try {
    JSON.parse(jsonStr)
    return true
  } catch {
    return false
  }
}

// Lazy load the API package so it doesn't throw if imports fail in build phase
async function getGA4Client() {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data')
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!)
  return new BetaAnalyticsDataClient({ credentials })
}

// ── ACCOUNT OVERVIEW ──────────────────────────────────────
export async function fetchGA4Overview(dateRange: DateRange, bypassCache = false): Promise<GA4Overview> {
  const cacheKey = `ga4_overview_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000 // 24 hours

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4Overview(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'screenPageViews' },
            { name: 'conversions' }
          ]
        })

        // Fetch previous period for delta comparison
        const diffMs = new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()
        const prevFrom = new Date(new Date(dateRange.from).getTime() - diffMs - (24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        const prevTo = new Date(new Date(dateRange.from).getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0]

        const [prevResponse] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: prevFrom, endDate: prevTo }],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'bounceRate' }
          ]
        })

        const row = response.rows?.[0]
        const prevRow = prevResponse.rows?.[0]

        const sessions = Number(row?.metricValues?.[0]?.value || 0)
        const totalUsers = Number(row?.metricValues?.[1]?.value || 0)
        const newUsers = Number(row?.metricValues?.[2]?.value || 0)
        const bounceRate = Number(row?.metricValues?.[3]?.value || 0) * 100 // convert ratio to percentage
        const avgSessionDuration = Number(row?.metricValues?.[4]?.value || 0)
        const pageViews = Number(row?.metricValues?.[5]?.value || 0)
        const conversions = Number(row?.metricValues?.[6]?.value || 0)

        const prevSessions = Number(prevRow?.metricValues?.[0]?.value || 0)
        const prevConversions = Number(prevRow?.metricValues?.[1]?.value || 0)
        const prevBounceRate = Number(prevRow?.metricValues?.[2]?.value || 0) * 100

        return {
          sessions,
          totalUsers,
          newUsers,
          returningUsers: Math.max(0, totalUsers - newUsers),
          bounceRate: parseFloat(bounceRate.toFixed(1)),
          avgSessionDuration: Math.round(avgSessionDuration),
          pageViews,
          conversions,
          conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0,
          prevSessions,
          prevConversions,
          prevBounceRate: parseFloat(prevBounceRate.toFixed(1))
        }
      } catch (err) {
        console.error('Failed to query live GA4 Overview, falling back to mock:', err)
        return generateMockGA4Overview(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── TRAFFIC SOURCES ───────────────────────────────────────
export async function fetchGA4TrafficSources(dateRange: DateRange, bypassCache = false): Promise<GA4TrafficSource[]> {
  const cacheKey = `ga4_traffic_sources_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4TrafficSources(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'sessionDefaultChannelGroup' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
          ]
        })

        const totalSessions = response.rows?.reduce((sum, r) => sum + Number(r.metricValues?.[0]?.value || 0), 0) || 1

        const sources: GA4TrafficSource[] = (response.rows || []).map(r => {
          const channelGroup = r.dimensionValues?.[0]?.value || 'Direct'
          const source = r.dimensionValues?.[1]?.value || '(direct)'
          const medium = r.dimensionValues?.[2]?.value || '(none)'
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const newUsers = Number(r.metricValues?.[2]?.value || 0)
          const bounceRate = Number(r.metricValues?.[3]?.value || 0) * 100
          const avgSessionDuration = Number(r.metricValues?.[4]?.value || 0)
          const conversions = Number(r.metricValues?.[5]?.value || 0)

          return {
            channelGroup,
            source,
            medium,
            sessions,
            users,
            newUsers,
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            avgSessionDuration: Math.round(avgSessionDuration),
            conversions,
            conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0,
            shareOfSessions: parseFloat(((sessions / totalSessions) * 100).toFixed(1))
          }
        })

        return sources
      } catch (err) {
        console.error('Failed to query live GA4 Traffic Sources, falling back to mock:', err)
        return generateMockGA4TrafficSources(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── LANDING PAGE PERFORMANCE ──────────────────────────────
export async function fetchGA4LandingPages(dateRange: DateRange, bypassCache = false): Promise<GA4LandingPage[]> {
  const cacheKey = `ga4_landing_pages_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4LandingPages(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'landingPage' },
            { name: 'pageTitle' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'engagedSessions' }
          ]
        })

        return (response.rows || []).map(r => {
          const pagePath = r.dimensionValues?.[0]?.value || '/'
          const pageTitle = r.dimensionValues?.[1]?.value || 'Page'
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const bounceRate = Number(r.metricValues?.[2]?.value || 0) * 100
          const avgSessionDuration = Number(r.metricValues?.[3]?.value || 0)
          const conversions = Number(r.metricValues?.[4]?.value || 0)
          const engagedSessions = Number(r.metricValues?.[5]?.value || 0)

          let courseGroup: string | null = null
          if (pagePath.includes('scm')) courseGroup = 'Oracle Fusion SCM'
          else if (pagePath.includes('hcm')) courseGroup = 'Oracle Fusion HCM'
          else if (pagePath.includes('financial') || pagePath.includes('fin')) courseGroup = 'Oracle Fusion Financials'
          else if (pagePath.includes('tech') || pagePath.includes('oic')) courseGroup = 'Oracle Fusion Technical'
          else if (pagePath.includes('ppm')) courseGroup = 'Oracle Fusion PPM'

          return {
            pagePath,
            pageTitle,
            sessions,
            users,
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            avgSessionDuration: Math.round(avgSessionDuration),
            conversions,
            conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0,
            engagedSessions,
            engagementRate: sessions > 0 ? parseFloat(((engagedSessions / sessions) * 100).toFixed(1)) : 0,
            courseGroup,
            isCoursePage: !!courseGroup
          }
        })
      } catch (err) {
        console.error('Failed to query live GA4 Landing Pages, falling back to mock:', err)
        return generateMockGA4LandingPages(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── USER JOURNEY / PAGE PATH ──────────────────────────────
export async function fetchGA4PagePaths(dateRange: DateRange, bypassCache = false): Promise<GA4PagePath[]> {
  const cacheKey = `ga4_page_paths_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4PagePaths(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' }
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'userEngagementDuration' }, // sum of engaged seconds
            { name: 'bounceRate' },
            { name: 'exits' }
          ]
        })

        return (response.rows || []).map(r => {
          const pagePath = r.dimensionValues?.[0]?.value || '/'
          const pageTitle = r.dimensionValues?.[1]?.value || 'Page'
          const pageViews = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const avgTimeOnPage = users > 0 ? Number(r.metricValues?.[2]?.value || 0) / users : 0
          const bounceRate = Number(r.metricValues?.[3]?.value || 0) * 100
          const exits = Number(r.metricValues?.[4]?.value || 0)

          return {
            pagePath,
            pageTitle,
            pageViews,
            users,
            avgTimeOnPage: Math.round(avgTimeOnPage),
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            exits,
            exitRate: pageViews > 0 ? parseFloat(((exits / pageViews) * 100).toFixed(1)) : 0
          }
        })
      } catch (err) {
        console.error('Failed to query live GA4 Page Paths, falling back to mock:', err)
        return generateMockGA4PagePaths(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── DEVICE BREAKDOWN ──────────────────────────────────────
export async function fetchGA4Devices(dateRange: DateRange, bypassCache = false): Promise<GA4DeviceData[]> {
  const cacheKey = `ga4_devices_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4Devices(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'bounceRate' },
            { name: 'conversions' },
            { name: 'averageSessionDuration' }
          ]
        })

        return (response.rows || []).map(r => {
          const rawDevice = r.dimensionValues?.[0]?.value || 'desktop'
          const device = rawDevice.toLowerCase() as any
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const bounceRate = Number(r.metricValues?.[2]?.value || 0) * 100
          const conversions = Number(r.metricValues?.[3]?.value || 0)
          const avgSessionDuration = Number(r.metricValues?.[4]?.value || 0)

          return {
            device,
            sessions,
            users,
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            conversions,
            conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0,
            avgSessionDuration: Math.round(avgSessionDuration)
          }
        })
      } catch (err) {
        console.error('Failed to query live GA4 Devices, falling back to mock:', err)
        return generateMockGA4Devices(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── GEO BREAKDOWN ─────────────────────────────────────────
export async function fetchGA4Geography(dateRange: DateRange, bypassCache = false): Promise<GA4GeoData[]> {
  const cacheKey = `ga4_geography_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4Geography(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'city' },
            { name: 'region' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'conversions' }
          ],
          limit: 30
        })

        return (response.rows || []).map(r => {
          const city = r.dimensionValues?.[0]?.value || 'Unknown'
          const region = r.dimensionValues?.[1]?.value || 'Location'
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const conversions = Number(r.metricValues?.[2]?.value || 0)

          return {
            city,
            region,
            sessions,
            users,
            conversions,
            conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0
          }
        }).filter(item => item.city !== '(not set)')
      } catch (err) {
        console.error('Failed to query live GA4 Geography, falling back to mock:', err)
        return generateMockGA4Geography(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── CONVERSION EVENTS ─────────────────────────────────────
export async function fetchGA4Conversions(dateRange: DateRange, bypassCache = false): Promise<GA4ConversionData[]> {
  const cacheKey = `ga4_conversions_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4Conversions(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'eventName' },
            { name: 'sessionDefaultChannelGroup' }
          ],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalUsers' },
            { name: 'sessions' } // auxiliary to compute conversion rate
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              inListFilter: {
                values: ['form_submit', 'generate_lead', 'contact', 'lead_form_fill']
              }
            }
          }
        })

        return (response.rows || []).map(r => {
          const eventName = r.dimensionValues?.[0]?.value || 'form_submit'
          const channelGroup = r.dimensionValues?.[1]?.value || 'Direct'
          const eventCount = Number(r.metricValues?.[0]?.value || 0)
          const users = Number(r.metricValues?.[1]?.value || 0)
          const sessions = Number(r.metricValues?.[2]?.value || 0) || 1

          return {
            eventName,
            channelGroup,
            eventCount,
            users,
            conversionRate: parseFloat(((eventCount / sessions) * 100).toFixed(2))
          }
        })
      } catch (err) {
        console.error('Failed to query live GA4 Conversions, falling back to mock:', err)
        return generateMockGA4Conversions(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── DAILY TREND ───────────────────────────────────────────
export async function fetchGA4DailyTrend(dateRange: DateRange, bypassCache = false): Promise<GA4DailyPoint[]> {
  const cacheKey = `ga4_daily_trend_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4DailyTrend(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'conversions' },
            { name: 'bounceRate' }
          ]
        })

        const trend: GA4DailyPoint[] = (response.rows || []).map(r => {
          const dateStr = r.dimensionValues?.[0]?.value || '' // YYYYMMDD
          const year = dateStr.slice(0, 4)
          const month = dateStr.slice(4, 6)
          const day = dateStr.slice(6, 8)
          const formattedDate = `${year}-${month}-${day}` // YYYY-MM-DD

          return {
            date: formattedDate,
            sessions: Number(r.metricValues?.[0]?.value || 0),
            users: Number(r.metricValues?.[1]?.value || 0),
            newUsers: Number(r.metricValues?.[2]?.value || 0),
            conversions: Number(r.metricValues?.[3]?.value || 0),
            bounceRate: parseFloat((Number(r.metricValues?.[4]?.value || 0) * 100).toFixed(1))
          }
        })

        return trend.sort((a, b) => a.date.localeCompare(b.date))
      } catch (err) {
        console.error('Failed to query live GA4 Daily Trend, falling back to mock:', err)
        return generateMockGA4DailyTrend(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── SOURCE × LANDING PAGE MATRIX ─────────────────────────
export async function fetchGA4SourceLandingMatrix(dateRange: DateRange, bypassCache = false): Promise<GA4SourceLandingRow[]> {
  const cacheKey = `ga4_source_landing_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4SourceLandingMatrix(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'sessionDefaultChannelGroup' },
            { name: 'landingPage' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'bounceRate' }
          ]
        })

        return (response.rows || []).map(r => {
          const channelGroup = r.dimensionValues?.[0]?.value || 'Direct'
          const landingPage = r.dimensionValues?.[1]?.value || '/'
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const conversions = Number(r.metricValues?.[1]?.value || 0)
          const bounceRate = Number(r.metricValues?.[2]?.value || 0) * 100

          return {
            channelGroup,
            landingPage,
            sessions,
            conversions,
            bounceRate: parseFloat(bounceRate.toFixed(1)),
            conversionRate: sessions > 0 ? parseFloat(((conversions / sessions) * 100).toFixed(2)) : 0
          }
        })
      } catch (err) {
        console.error('Failed to query live GA4 Source Landing Matrix, falling back to mock:', err)
        return generateMockGA4SourceLandingMatrix(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

// ── RETURNING USER ANALYSIS ───────────────────────────────
export async function fetchGA4ReturningUsers(dateRange: DateRange, bypassCache = false): Promise<GA4ReturningData> {
  const cacheKey = `ga4_returning_${dateRange.from}_${dateRange.to}`
  const ttl = 86400 * 1000

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      if (!hasGA4Credentials()) {
        return generateMockGA4ReturningUsers(dateRange)
      }

      try {
        const client = await getGA4Client()
        const [response] = await client.runReport({
          property: process.env.GA4_PROPERTY_ID!,
          dateRanges: [{ startDate: dateRange.from, endDate: dateRange.to }],
          dimensions: [
            { name: 'newVsReturning' },
            { name: 'sessionDefaultChannelGroup' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' }
          ]
        })

        let newSessions = 0
        let newConvs = 0
        let retSessions = 0
        let retConvs = 0
        
        const channelMap: Record<string, { channel: string; newSessions: number; returningSessions: number; newConversions: number; returningConversions: number }> = {}

        response.rows?.forEach(r => {
          const type = r.dimensionValues?.[0]?.value || 'new'
          const channel = r.dimensionValues?.[1]?.value || 'Direct'
          const sessions = Number(r.metricValues?.[0]?.value || 0)
          const conversions = Number(r.metricValues?.[1]?.value || 0)

          if (!channelMap[channel]) {
            channelMap[channel] = { channel, newSessions: 0, returningSessions: 0, newConversions: 0, returningConversions: 0 }
          }

          if (type.toLowerCase().includes('new')) {
            newSessions += sessions
            newConvs += conversions
            channelMap[channel].newSessions += sessions
            channelMap[channel].newConversions += conversions
          } else {
            retSessions += sessions
            retConvs += conversions
            channelMap[channel].returningSessions += sessions
            channelMap[channel].returningConversions += conversions
          }
        })

        return {
          newUserSessions: newSessions,
          returningUserSessions: retSessions,
          newUserConversions: newConvs,
          returningUserConversions: retConvs,
          newUserConvRate: newSessions > 0 ? parseFloat(((newConvs / newSessions) * 100).toFixed(2)) : 0,
          returningUserConvRate: retSessions > 0 ? parseFloat(((retConvs / retSessions) * 100).toFixed(2)) : 0,
          byChannel: Object.values(channelMap)
        }
      } catch (err) {
        console.error('Failed to query live GA4 Returning Users, falling back to mock:', err)
        return generateMockGA4ReturningUsers(dateRange)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}


// ── MOCK DATA GENERATORS ──────────────────────────────────
// Returns realistic mock values in date ranges so that pages render smoothly

function getDaysBetween(from: string, to: string): number {
  const d1 = new Date(from).getTime()
  const d2 = new Date(to).getTime()
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1)
}

function generateMockGA4Overview(dateRange: DateRange): GA4Overview {
  const days = getDaysBetween(dateRange.from, dateRange.to)
  const sessions = 450 * days
  const totalUsers = Math.round(sessions * 0.78)
  const newUsers = Math.round(totalUsers * 0.65)
  const conversions = Math.round(sessions * 0.048) // 4.8% conversion rate

  return {
    sessions,
    totalUsers,
    newUsers,
    returningUsers: totalUsers - newUsers,
    bounceRate: 54.5,
    avgSessionDuration: 135, // 2:15 min
    pageViews: sessions * 2.4,
    conversions,
    conversionRate: 4.8,
    prevSessions: Math.round(sessions * 0.92),
    prevConversions: Math.round(conversions * 0.88),
    prevBounceRate: 56.8
  }
}

function generateMockGA4TrafficSources(dateRange: DateRange): GA4TrafficSource[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)
  
  return [
    { channelGroup: 'Organic Search', source: 'google', medium: 'organic', sessions: 200 * days, users: 160 * days, newUsers: 110 * days, bounceRate: 48.2, avgSessionDuration: 180, conversions: 12 * days, conversionRate: 6.0, shareOfSessions: 44.4 },
    { channelGroup: 'Paid Search', source: 'google', medium: 'cpc', sessions: 110 * days, users: 85 * days, newUsers: 55 * days, bounceRate: 52.4, avgSessionDuration: 140, conversions: 8 * days, conversionRate: 7.27, shareOfSessions: 24.4 },
    { channelGroup: 'Paid Social', source: 'facebook', medium: 'cpc', sessions: 80 * days, users: 65 * days, newUsers: 45 * days, bounceRate: 68.5, avgSessionDuration: 45, conversions: 4 * days, conversionRate: 5.0, shareOfSessions: 17.8 },
    { channelGroup: 'Direct', source: '(direct)', medium: '(none)', sessions: 45 * days, users: 38 * days, newUsers: 10 * days, bounceRate: 58.0, avgSessionDuration: 90, conversions: 2 * days, conversionRate: 4.44, shareOfSessions: 10.0 },
    { channelGroup: 'Referral', source: 'techleadsit.com', medium: 'referral', sessions: 15 * days, users: 12 * days, newUsers: 5 * days, bounceRate: 41.5, avgSessionDuration: 220, conversions: 1 * days, conversionRate: 6.67, shareOfSessions: 3.3 }
  ]
}

function generateMockGA4LandingPages(dateRange: DateRange): GA4LandingPage[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { pagePath: '/oracle-fusion-scm-training', pageTitle: 'Oracle Fusion SCM Training Course Online', sessions: 150 * days, users: 120 * days, bounceRate: 42.5, avgSessionDuration: 204, conversions: 12 * days, conversionRate: 8.0, engagedSessions: 110 * days, engagementRate: 73.3, courseGroup: 'Oracle Fusion SCM', isCoursePage: true },
    { pagePath: '/oracle-fusion-hcm-training', pageTitle: 'Oracle Fusion HCM Certification Online Class', sessions: 120 * days, users: 95 * days, bounceRate: 51.0, avgSessionDuration: 145, conversions: 6 * days, conversionRate: 5.0, engagedSessions: 78 * days, engagementRate: 65.0, courseGroup: 'Oracle Fusion HCM', isCoursePage: true },
    { pagePath: '/oracle-fusion-financials', pageTitle: 'Oracle Fusion Financials Cloud Course', sessions: 90 * days, users: 70 * days, bounceRate: 44.8, avgSessionDuration: 188, conversions: 7 * days, conversionRate: 7.78, engagedSessions: 65 * days, engagementRate: 72.2, courseGroup: 'Oracle Fusion Financials', isCoursePage: true },
    { pagePath: '/oracle-fusion-technical', pageTitle: 'Oracle Fusion Technical OIC Training', sessions: 60 * days, users: 48 * days, bounceRate: 56.4, avgSessionDuration: 112, conversions: 2 * days, conversionRate: 3.33, engagedSessions: 36 * days, engagementRate: 60.0, courseGroup: 'Oracle Fusion Technical', isCoursePage: true },
    { pagePath: '/oracle-fusion-ppm', pageTitle: 'Oracle Fusion PPM Projects Training', sessions: 30 * days, users: 24 * days, bounceRate: 48.0, avgSessionDuration: 150, conversions: 1 * days, conversionRate: 3.33, engagedSessions: 20 * days, engagementRate: 66.7, courseGroup: 'Oracle Fusion PPM', isCoursePage: true }
  ]
}

function generateMockGA4PagePaths(dateRange: DateRange): GA4PagePath[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { pagePath: '/', pageTitle: 'TechLeadsIT — Premium ERP Training Hub', pageViews: 380 * days, users: 180 * days, avgTimeOnPage: 45, bounceRate: 52.1, exits: 120 * days, exitRate: 31.6 },
    { pagePath: '/oracle-fusion-scm-training', pageTitle: 'Oracle Fusion SCM Training Course Online', pageViews: 280 * days, users: 120 * days, avgTimeOnPage: 135, bounceRate: 42.5, exits: 45 * days, exitRate: 16.1 },
    { pagePath: '/oracle-fusion-hcm-training', pageTitle: 'Oracle Fusion HCM Certification Online Class', pageViews: 210 * days, users: 95 * days, avgTimeOnPage: 110, bounceRate: 51.0, exits: 38 * days, exitRate: 18.1 },
    { pagePath: '/contact-us', pageTitle: 'Contact Us & Free Demo Registration', pageViews: 140 * days, users: 80 * days, avgTimeOnPage: 85, bounceRate: 38.0, exits: 25 * days, exitRate: 17.8 },
    { pagePath: '/thank-you', pageTitle: 'Registration Successful - TechLeadsIT', pageViews: 28 * days, users: 28 * days, avgTimeOnPage: 25, bounceRate: 0, exits: 26 * days, exitRate: 92.8 }
  ]
}

function generateMockGA4Devices(dateRange: DateRange): GA4DeviceData[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { device: 'desktop', sessions: 250 * days, users: 190 * days, bounceRate: 46.5, conversions: 18 * days, conversionRate: 7.2, avgSessionDuration: 175 },
    { device: 'mobile', sessions: 180 * days, users: 145 * days, bounceRate: 64.2, conversions: 8 * days, conversionRate: 4.44, avgSessionDuration: 85 },
    { device: 'tablet', sessions: 20 * days, users: 15 * days, bounceRate: 58.0, conversions: 0, conversionRate: 0, avgSessionDuration: 100 }
  ]
}

function generateMockGA4Geography(dateRange: DateRange): GA4GeoData[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { city: 'Hyderabad', region: 'Telangana', sessions: 180 * days, users: 140 * days, conversions: 12 * days, conversionRate: 6.67 },
    { city: 'Bangalore', region: 'Karnataka', sessions: 110 * days, users: 85 * days, conversions: 8 * days, conversionRate: 7.27 },
    { city: 'Pune', region: 'Maharashtra', sessions: 70 * days, users: 55 * days, conversions: 3 * days, conversionRate: 4.29 },
    { city: 'Chennai', region: 'Tamil Nadu', sessions: 40 * days, users: 32 * days, conversions: 2 * days, conversionRate: 5.0 },
    { city: 'Noida', region: 'Uttar Pradesh', sessions: 25 * days, users: 20 * days, conversions: 1 * days, conversionRate: 4.0 }
  ]
}

function generateMockGA4Conversions(dateRange: DateRange): GA4ConversionData[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { eventName: 'form_submit', channelGroup: 'Organic Search', eventCount: 12 * days, users: 12 * days, conversionRate: 6.0 },
    { eventName: 'form_submit', channelGroup: 'Paid Search', eventCount: 8 * days, users: 8 * days, conversionRate: 7.27 },
    { eventName: 'form_submit', channelGroup: 'Paid Social', eventCount: 4 * days, users: 4 * days, conversionRate: 5.0 },
    { eventName: 'contact', channelGroup: 'Organic Search', eventCount: 8 * days, users: 8 * days, conversionRate: 4.0 },
    { eventName: 'contact', channelGroup: 'Direct', eventCount: 2 * days, users: 2 * days, conversionRate: 4.44 }
  ]
}

function generateMockGA4DailyTrend(dateRange: DateRange): GA4DailyPoint[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)
  const points: GA4DailyPoint[] = []

  const start = new Date(dateRange.from)
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const formatted = d.toISOString().split('T')[0]
    
    // sine fluctuation
    const mod = Math.sin(i * 0.4) + 1.2
    const sessions = Math.round(380 * mod)
    const users = Math.round(sessions * 0.8)
    const newUsers = Math.round(users * 0.65)
    const conversions = Math.round(sessions * 0.048)

    points.push({
      date: formatted,
      sessions,
      users,
      newUsers,
      conversions,
      bounceRate: 54.5
    })
  }

  return points
}

function generateMockGA4SourceLandingMatrix(dateRange: DateRange): GA4SourceLandingRow[] {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return [
    { channelGroup: 'Organic Search', landingPage: '/oracle-fusion-scm-training', sessions: 80 * days, conversions: 6 * days, bounceRate: 41.2, conversionRate: 7.5 },
    { channelGroup: 'Organic Search', landingPage: '/oracle-fusion-hcm-training', sessions: 60 * days, conversions: 3 * days, bounceRate: 49.5, conversionRate: 5.0 },
    { channelGroup: 'Paid Search', landingPage: '/oracle-fusion-scm-training', sessions: 50 * days, conversions: 4 * days, bounceRate: 45.0, conversionRate: 8.0 },
    { channelGroup: 'Paid Search', landingPage: '/oracle-fusion-financials', sessions: 40 * days, conversions: 3 * days, bounceRate: 41.5, conversionRate: 7.5 },
    { channelGroup: 'Paid Social', landingPage: '/oracle-fusion-scm-training', sessions: 40 * days, conversions: 2 * days, bounceRate: 69.2, conversionRate: 5.0 },
    { channelGroup: 'Paid Social', landingPage: '/oracle-fusion-hcm-training', sessions: 30 * days, conversions: 1 * days, bounceRate: 74.0, conversionRate: 3.33 }
  ]
}

function generateMockGA4ReturningUsers(dateRange: DateRange): GA4ReturningData {
  const days = getDaysBetween(dateRange.from, dateRange.to)

  return {
    newUserSessions: 300 * days,
    returningUserSessions: 150 * days,
    newUserConversions: 10 * days,
    returningUserConversions: 16 * days,
    newUserConvRate: 3.33,
    returningUserConvRate: 10.67,
    byChannel: [
      { channel: 'Organic Search', newSessions: 130 * days, returningSessions: 70 * days, newConversions: 5 * days, returningConversions: 7 * days },
      { channel: 'Paid Search', newSessions: 70 * days, returningSessions: 40 * days, newConversions: 3 * days, returningConversions: 5 * days },
      { channel: 'Paid Social', newSessions: 60 * days, returningSessions: 20 * days, newConversions: 1 * days, returningConversions: 3 * days },
      { channel: 'Direct', newSessions: 30 * days, returningSessions: 15 * days, newConversions: 1 * days, returningConversions: 1 * days }
    ]
  }
}
