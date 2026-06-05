// app/api/traffic/sync-ga4-monthly/route.ts
import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

function formatYearMonth(yearMonthStr: string): string {
  // E.g. "202606" -> "June-2026"
  if (!yearMonthStr || yearMonthStr.length !== 6) return yearMonthStr
  const year = yearMonthStr.slice(0, 4)
  const monthNum = parseInt(yearMonthStr.slice(4, 6), 10)
  const monthsArray = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${monthsArray[monthNum - 1]}-${year}`
}

function getStartDateForSync(): string {
  const date = new Date()
  // Go back 3 months (e.g., June -> March) to ensure 3 full months are updated
  date.setMonth(date.getMonth() - 3)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export async function POST(request: Request) {
  try {
    const { seoSheetId, apiKey, gaPropertyId, gaClientEmail, gaPrivateKey } = await request.json()

    if (!seoSheetId) {
      return NextResponse.json({ error: 'SEO Spreadsheet ID is required. Please set it in Settings.' }, { status: 400 })
    }
    if (!gaPropertyId || !gaClientEmail || !gaPrivateKey) {
      return NextResponse.json({ error: 'GA4 Property ID, Service Account Email, and Private Key are all required.' }, { status: 400 })
    }

    const formattedPrivateKey = gaPrivateKey.replace(/\\n/g, '\n').trim()

    // 1. Initialize GA4 Data API Client
    let analyticsDataClient;
    try {
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: gaClientEmail.trim(),
          private_key: formattedPrivateKey
        }
      })
    } catch (err: any) {
      return NextResponse.json({
        error: `Failed to initialize GA4 API Client. Check your Private Key format. Details: ${err.message}`
      }, { status: 400 })
    }

    const startDate = getStartDateForSync()
    console.log(`GA4 Monthly Sync: Querying from ${startDate} to yesterday`)

    // 2. Fetch data from GA4 (from start of 3 months ago to yesterday)
    let totalResponse, channelResponse, countryResponse;
    try {
      // Query A: Total and New Users by Month
      const [totalRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate, endDate: 'yesterday' }],
        dimensions: [{ name: 'yearMonth' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' }
        ]
      })
      totalResponse = totalRes

      // Query B: Channel Groupings by Month
      const [channelRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate, endDate: 'yesterday' }],
        dimensions: [
          { name: 'yearMonth' },
          { name: 'firstUserDefaultChannelGroup' }
        ],
        metrics: [
          { name: 'totalUsers' }
        ]
      })
      channelResponse = channelRes

      // Query C: Countries by Month
      const [countryRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate, endDate: 'yesterday' }],
        dimensions: [
          { name: 'yearMonth' },
          { name: 'country' }
        ],
        metrics: [
          { name: 'totalUsers' }
        ]
      })
      countryResponse = countryRes
    } catch (err: any) {
      console.error('GA4 Query Error:', err)
      return NextResponse.json({
        error: `Failed to query GA4 property ${gaPropertyId}. Details: ${err.message}`
      }, { status: 400 })
    }

    // 3. Process and group GA4 data by month
    const monthlyRecords: Record<string, {
      monthLabel: string;
      totalUsers: number;
      newUsers: number;
      channels: Record<string, number>;
      countries: Record<string, number>;
    }> = {}

    // Initialize month records from Query A
    totalResponse.rows?.forEach((row: any) => {
      const yearMonth = row.dimensionValues?.[0]?.value || ''
      if (!yearMonth) return
      const monthLabel = formatYearMonth(yearMonth)
      const totalUsers = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const newUsers = parseInt(row.metricValues?.[1]?.value || '0', 10)

      monthlyRecords[yearMonth] = {
        monthLabel,
        totalUsers,
        newUsers,
        channels: {
          Organic: 0, Direct: 0, Social: 0, Video: 0, Referral: 0,
          PaidSearch: 0, CrossNetwork: 0, Display: 0, Email: 0, Unassigned: 0
        },
        countries: {
          India: 0, USA: 0, UAE: 0, SaudiArabia: 0, Canada: 0,
          Pakistan: 0, UK: 0, Poland: 0, Others: 0
        }
      }
    })

    // Map Channels from Query B
    channelResponse.rows?.forEach((row: any) => {
      const yearMonth = row.dimensionValues?.[0]?.value || ''
      const record = monthlyRecords[yearMonth]
      if (!record) return

      const group = row.dimensionValues?.[1]?.value || ''
      const val = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const gLower = group.toLowerCase().replace(/\s+/g, '')

      if (gLower.includes('organicsearch')) {
        record.channels.Organic += val
      } else if (gLower === 'direct') {
        record.channels.Direct += val
      } else if (gLower.includes('social') || gLower.includes('organicsocial') || gLower.includes('paidsocial')) {
        record.channels.Social += val
      } else if (gLower.includes('video') || gLower.includes('organicvideo')) {
        record.channels.Video += val
      } else if (gLower === 'referral') {
        record.channels.Referral += val
      } else if (gLower.includes('paidsearch') || gLower.includes('searchads')) {
        record.channels.PaidSearch += val
      } else if (gLower.includes('cross-network') || gLower.includes('crossnetwork')) {
        record.channels.CrossNetwork += val
      } else if (gLower === 'display') {
        record.channels.Display += val
      } else if (gLower === 'email') {
        record.channels.Email += val
      } else {
        record.channels.Unassigned += val
      }
    })

    // Map Countries from Query C
    countryResponse.rows?.forEach((row: any) => {
      const yearMonth = row.dimensionValues?.[0]?.value || ''
      const record = monthlyRecords[yearMonth]
      if (!record) return

      const countryName = row.dimensionValues?.[1]?.value || ''
      const val = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const cLower = countryName.toLowerCase().trim()

      if (cLower === 'india') {
        record.countries.India += val
      } else if (cLower === 'united states' || cLower === 'usa' || cLower === 'us') {
        record.countries.USA += val
      } else if (cLower === 'united arab emirates' || cLower === 'uae') {
        record.countries.UAE += val
      } else if (cLower === 'saudi arabia') {
        record.countries.SaudiArabia += val
      } else if (cLower === 'canada') {
        record.countries.Canada += val
      } else if (cLower === 'pakistan') {
        record.countries.Pakistan += val
      } else if (cLower === 'united kingdom' || cLower === 'uk') {
        record.countries.UK += val
      } else if (cLower === 'poland') {
        record.countries.Poland += val
      } else {
        record.countries.Others += val
      }
    })

    // 4. Initialize Google Sheets Auth
    let sheets;
    try {
      const auth = new google.auth.JWT(
        gaClientEmail.trim(),
        undefined,
        formattedPrivateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      )
      sheets = google.sheets({ version: 'v4', auth })
    } catch (err: any) {
      return NextResponse.json({
        error: `Failed to authenticate with Google Sheets API. Details: ${err.message}`
      }, { status: 400 })
    }

    // 5. Ensure "Traffic" tab exists and write data
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: seoSheetId })
      const sheetsList = meta.data.sheets ?? []
      const hasTab = sheetsList.some(s => s.properties?.title === 'Traffic')

      if (!hasTab) {
        // Create tab
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: seoSheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: 'Traffic' }
              }
            }]
          }
        })

        // Write Headers
        const headers = [
          'Month', 'Total Users', 'New Users', 'Organic', 'Direct', 'Social', 'Video',
          'Referral', 'Paid Search', 'Cross Network', 'Display', 'Email', 'Unassigned',
          'India', 'USA', 'UAE', 'Saudi Arabia', 'Canada', 'Pakistan', 'UK', 'Poland', 'Others'
        ]
        await sheets.spreadsheets.values.update({
          spreadsheetId: seoSheetId,
          range: 'Traffic!A1:V1',
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        })
      }

      // Read existing months
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: seoSheetId,
        range: 'Traffic!A:A'
      })
      const existingRows = readRes.data.values ?? []
      const existingMonths = existingRows.map(r => r[0])

      // Write each monthly record
      for (const [yearMonth, record] of Object.entries(monthlyRecords)) {
        const rowValues = [
          record.monthLabel,
          record.totalUsers,
          record.newUsers,
          record.channels.Organic,
          record.channels.Direct,
          record.channels.Social,
          record.channels.Video,
          record.channels.Referral,
          record.channels.PaidSearch,
          record.channels.CrossNetwork,
          record.channels.Display,
          record.channels.Email,
          record.channels.Unassigned,
          record.countries.India,
          record.countries.USA,
          record.countries.UAE,
          record.countries.SaudiArabia,
          record.countries.Canada,
          record.countries.Pakistan,
          record.countries.UK,
          record.countries.Poland,
          record.countries.Others
        ]

        const monthIndex = existingMonths.indexOf(record.monthLabel)

        if (monthIndex >= 0) {
          // Update row
          await sheets.spreadsheets.values.update({
            spreadsheetId: seoSheetId,
            range: `Traffic!A${monthIndex + 1}:V${monthIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: { values: [rowValues] }
          })
        } else {
          // Append row
          await sheets.spreadsheets.values.append({
            spreadsheetId: seoSheetId,
            range: 'Traffic!A:A',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [rowValues] }
          })
          // Update local list to prevent appending duplicates in the same run
          existingMonths.push(record.monthLabel)
        }
      }

    } catch (err: any) {
      console.error('Google Sheets Write Error:', err)
      return NextResponse.json({
        error: `Failed to write to Google Sheet ${seoSheetId}. Make sure your spreadsheet is shared with ${gaClientEmail} as Editor. Details: ${err.message}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced monthly traffic data!`,
      monthsSynced: Object.values(monthlyRecords).map(r => r.monthLabel)
    })

  } catch (err: any) {
    console.error('Catch handler API sync error:', err)
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 })
  }
}
