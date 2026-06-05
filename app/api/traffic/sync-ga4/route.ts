// app/api/traffic/sync-ga4/route.ts
import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

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

    // 2. Fetch data from GA4 (yesterday range)
    let totalResponse, channelResponse, countryResponse;
    try {
      // Query A: Total and New Users
      const [totalRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'newUsers' }
        ]
      })
      totalResponse = totalRes

      // Query B: Channel Groupings (First User Default Channel Group)
      const [channelRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        dimensions: [
          { name: 'date' },
          { name: 'firstUserDefaultChannelGroup' }
        ],
        metrics: [
          { name: 'totalUsers' }
        ]
      })
      channelResponse = channelRes

      // Query C: Countries
      const [countryRes] = await analyticsDataClient.runReport({
        property: `properties/${gaPropertyId.trim()}`,
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        dimensions: [
          { name: 'date' },
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
        error: `Failed to query GA4 property ${gaPropertyId}. Make sure your Service Account Email (${gaClientEmail}) is added as a 'Viewer' in your Google Analytics Admin console (under Property Access Management). Details: ${err.message}`
      }, { status: 400 })
    }

    // 3. Map GA4 dimensions/metrics to Daily row
    // Extract date
    const dateVal = totalResponse.rows?.[0]?.dimensionValues?.[0]?.value
    let formattedDate = ''
    if (dateVal && dateVal.length === 8) {
      formattedDate = `${dateVal.slice(0, 4)}-${dateVal.slice(4, 6)}-${dateVal.slice(6, 8)}`
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      formattedDate = yesterday.toISOString().split('T')[0]
    }

    const totalUsers = parseInt(totalResponse.rows?.[0]?.metricValues?.[0]?.value || '0', 10)
    const newUsers = parseInt(totalResponse.rows?.[0]?.metricValues?.[1]?.value || '0', 10)

    // Map Channels
    const channels = {
      Organic: 0,
      Direct: 0,
      Social: 0,
      Video: 0,
      Referral: 0,
      PaidSearch: 0,
      CrossNetwork: 0,
      Display: 0,
      Email: 0,
      Unassigned: 0
    }

    channelResponse.rows?.forEach((row: any) => {
      const group = row.dimensionValues?.[1]?.value || ''
      const val = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const gLower = group.toLowerCase().replace(/\s+/g, '')

      if (gLower.includes('organicsearch')) {
        channels.Organic += val
      } else if (gLower === 'direct') {
        channels.Direct += val
      } else if (gLower.includes('social') || gLower.includes('organicsocial')) {
        channels.Social += val
      } else if (gLower.includes('video') || gLower.includes('organicvideo')) {
        channels.Video += val
      } else if (gLower === 'referral') {
        channels.Referral += val
      } else if (gLower.includes('paidsearch') || gLower.includes('searchads')) {
        channels.PaidSearch += val
      } else if (gLower.includes('cross-network') || gLower.includes('crossnetwork')) {
        channels.CrossNetwork += val
      } else if (gLower === 'display') {
        channels.Display += val
      } else if (gLower === 'email') {
        channels.Email += val
      } else {
        channels.Unassigned += val
      }
    })

    // Map Countries
    const countries = {
      India: 0,
      USA: 0,
      UAE: 0,
      SaudiArabia: 0,
      Canada: 0,
      Pakistan: 0,
      UK: 0,
      Poland: 0,
      Others: 0
    }

    countryResponse.rows?.forEach((row: any) => {
      const countryName = row.dimensionValues?.[1]?.value || ''
      const val = parseInt(row.metricValues?.[0]?.value || '0', 10)
      const cLower = countryName.toLowerCase().trim()

      if (cLower === 'india') {
        countries.India += val
      } else if (cLower === 'united states' || cLower === 'usa' || cLower === 'us') {
        countries.USA += val
      } else if (cLower === 'united arab emirates' || cLower === 'uae') {
        countries.UAE += val
      } else if (cLower === 'saudi arabia') {
        countries.SaudiArabia += val
      } else if (cLower === 'canada') {
        countries.Canada += val
      } else if (cLower === 'pakistan') {
        countries.Pakistan += val
      } else if (cLower === 'united kingdom' || cLower === 'uk') {
        countries.UK += val
      } else if (cLower === 'poland') {
        countries.Poland += val
      } else {
        countries.Others += val
      }
    })

    // Construct spreadsheet row array
    const rowValues = [
      formattedDate,
      totalUsers,
      newUsers,
      channels.Organic,
      channels.Direct,
      channels.Social,
      channels.Video,
      channels.Referral,
      channels.PaidSearch,
      channels.CrossNetwork,
      channels.Display,
      channels.Email,
      channels.Unassigned,
      countries.India,
      countries.USA,
      countries.UAE,
      countries.SaudiArabia,
      countries.Canada,
      countries.Pakistan,
      countries.UK,
      countries.Poland,
      countries.Others
    ]

    // 4. Initialize Google Sheets Auth using the same Service Account credentials
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

    // 5. Ensure "Daily Traffic" tab exists and write data
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: seoSheetId })
      const sheetsList = meta.data.sheets ?? []
      const hasTab = sheetsList.some(s => s.properties?.title === 'Daily Traffic')

      if (!hasTab) {
        // Create tab
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: seoSheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: 'Daily Traffic' }
              }
            }]
          }
        })

        // Write Headers
        const headers = [
          'Date', 'Total Users', 'New Users', 'Organic', 'Direct', 'Social', 'Video',
          'Referral', 'Paid Search', 'Cross Network', 'Display', 'Email', 'Unassigned',
          'India', 'USA', 'UAE', 'Saudi Arabia', 'Canada', 'Pakistan', 'UK', 'Poland', 'Others'
        ]
        await sheets.spreadsheets.values.update({
          spreadsheetId: seoSheetId,
          range: 'Daily Traffic!A1:V1',
          valueInputOption: 'RAW',
          requestBody: { values: [headers] }
        })
      }

      // Read existing dates
      const readRes = await sheets.spreadsheets.values.get({
        spreadsheetId: seoSheetId,
        range: 'Daily Traffic!A:A'
      })
      const existingRows = readRes.data.values ?? []
      const dateIndex = existingRows.findIndex(r => r[0] === formattedDate)

      if (dateIndex >= 0) {
        // Update row
        await sheets.spreadsheets.values.update({
          spreadsheetId: seoSheetId,
          range: `Daily Traffic!A${dateIndex + 1}:V${dateIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [rowValues] }
        })
      } else {
        // Append row
        await sheets.spreadsheets.values.append({
          spreadsheetId: seoSheetId,
          range: 'Daily Traffic!A:A',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [rowValues] }
        })
      }
    } catch (err: any) {
      console.error('Google Sheets Write Error:', err)
      return NextResponse.json({
        error: `Failed to write to Google Sheet ${seoSheetId}. Make sure you shared your spreadsheet with the Service Account email (${gaClientEmail}) as an 'Editor' so it has write access. Details: ${err.message}`
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced yesterday's traffic data for ${formattedDate}!`,
      date: formattedDate,
      totalUsers,
      newUsers
    })
  } catch (err: any) {
    console.error('Catch handler API sync error:', err)
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 })
  }
}
