// lib/meta-ad-library.ts
import { getOrSetCache } from './cache'

export interface CompetitorAd {
  id: string
  pageId: string
  pageName: string
  adCreationTime: string
  body: string
  platforms: string[]
  linkTitle?: string
  angleDetected?: string
  snapshotUrl?: string
}

export interface CompetitorReport {
  competitors: Array<{
    name: string
    pageId: string
    threatLevel: 'high' | 'medium' | 'low'
    activeAdsCount: number
    angles: string[]
    runningSince: string
  }>
  gaps: string[]
  activeAds: CompetitorAd[]
  scannedAt: string
  isReal: boolean
}

export const KNOWN_COMPETITORS = [
  { name: 'Cloudshine', pageId: '519383907933319', threat: 'high' as const },
  { name: 'GrowMore Technologies', pageId: '374798099056166', threat: 'medium' as const },
  { name: 'Erptree Job Guarantee', pageId: '408185105700768', threat: 'medium' as const },
  { name: 'Cloud Finance Guru', pageId: '1110304798838787', threat: 'low' as const },
  { name: 'Applstar Technologies', pageId: '945066105345619', threat: 'low' as const },
  { name: 'MJ Adworks', pageId: '440615765813122', threat: 'low' as const }
]

export const COMPETITOR_SEARCH_TERMS = [
  'oracle fusion scm training',
  'oracle fusion hcm training',
  'oracle fusion financials training',
  'oracle fusion technical training',
  'oracle fusion online training',
  'oracle scm certification'
]

export const COMPETITOR_ANGLES_DETECTED: Record<string, string[]> = {
  '519383907933319': ['Job Guarantee', 'Master Oracle SCM in 3 Months', 'Master Oracle HCM in 3 Months', 'We Guarantee Your Job'],
  '374798099056166': ['Oracle Finance Training with Placement Support', 'No Coding Required'],
  '408185105700768': ['High Paying Job Without Coding', 'Skills That Get You Hired'],
  '1110304798838787': ['Oracle Cloud Finance Training', 'Become Financial Consultant'],
  '945066105345619': ['Learn Fusion Technical', 'ERP cloud technical guide'],
  '440615765813122': ['ERP Career Support', 'Experts Wanted']
}

export const ANGLE_GAPS = [
  'Trainer credibility (Krishna 20yr exp)',
  'Batch number social proof (74th batch)',
  'Alumni salary proofs',
  '"Limited seats" urgency',
  'Student testimonial video'
]

export async function fetchCompetitorIntelligence(
  bypassCache = false, 
  accessToken?: string,
  searchTerms?: string,
  pageIds?: string
): Promise<CompetitorReport> {
  const cacheKey = pageIds 
    ? `meta_competitor_intel_p_${encodeURIComponent(pageIds)}` 
    : searchTerms 
      ? `meta_competitor_intel_s_${encodeURIComponent(searchTerms)}` 
      : 'meta_competitor_intel'
  const ttl = 86400 * 1000 // 24 hours

  const res = await getOrSetCache(
    cacheKey,
    async () => {
      const token = accessToken || process.env.META_ACCESS_TOKEN
      
      // If no token exists, fall back to mock data
      if (!token || token === 'your_long_lived_access_token' || token === 'mock') {
        return generateMockCompetitorReport(searchTerms, pageIds)
      }

      try {
        const activeAds: CompetitorAd[] = []
        const country = process.env.META_AD_LIBRARY_COUNTRY || 'IN'

        if (pageIds) {
          const ids = pageIds.split(',')
          for (const pageId of ids) {
            const url = `https://graph.facebook.com/v19.0/ads_archive?fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,page_id,page_name,publisher_platforms,snapshot_url&search_page_ids=${pageId}&ad_reached_countries=['${country}']&ad_type=ALL&ad_active_status=ACTIVE&access_token=${token}`
            const apiRes = await fetch(url)
            if (apiRes.ok) {
              const json = await apiRes.json()
              const data = json.data || []
              data.forEach((ad: any) => {
                const body = ad.ad_creative_bodies?.[0] || 'ERP Training Ad'
                activeAds.push({
                  id: ad.id,
                  pageId: ad.page_id,
                  pageName: ad.page_name || 'Competitor',
                  adCreationTime: ad.ad_creation_time || new Date().toISOString(),
                  body,
                  platforms: ad.publisher_platforms || ['facebook', 'instagram'],
                  linkTitle: ad.ad_creative_link_titles?.[0] || undefined,
                  angleDetected: detectAngle(body, pageId),
                  snapshotUrl: ad.snapshot_url || undefined,
                  imageUrl: getAdPreviewImage(body, ad.ad_creative_link_titles?.[0])
                })
              })
            } else {
              const errJson = await apiRes.json().catch(() => ({}))
              console.error(`Meta Ads Archive API error for page ${pageId}:`, errJson)
              throw new Error(errJson.error?.message || `Meta Ad Library HTTP error ${apiRes.status}`)
            }
          }
        } else if (searchTerms) {
          const url = `https://graph.facebook.com/v19.0/ads_archive?fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,page_id,page_name,publisher_platforms,snapshot_url&search_terms=${encodeURIComponent(searchTerms)}&ad_reached_countries=['${country}']&ad_type=ALL&ad_active_status=ACTIVE&access_token=${token}`
          const apiRes = await fetch(url)
          if (apiRes.ok) {
            const json = await apiRes.json()
            const data = json.data || []
            data.forEach((ad: any) => {
              const body = ad.ad_creative_bodies?.[0] || 'ERP Training Ad'
              activeAds.push({
                id: ad.id,
                pageId: ad.page_id,
                pageName: ad.page_name || 'Competitor',
                adCreationTime: ad.ad_creation_time || new Date().toISOString(),
                body,
                platforms: ad.publisher_platforms || ['facebook', 'instagram'],
                linkTitle: ad.ad_creative_link_titles?.[0] || undefined,
                angleDetected: detectAngle(body, ad.page_id),
                snapshotUrl: ad.snapshot_url || undefined,
                imageUrl: getAdPreviewImage(body, ad.ad_creative_link_titles?.[0])
              })
            })
          } else {
            const errJson = await apiRes.json().catch(() => ({}))
            console.error(`Meta Ads Archive API error for terms "${searchTerms}":`, errJson)
            throw new Error(errJson.error?.message || `Meta Ad Library HTTP error ${apiRes.status}`)
          }
        } else {
          // Scan competitor page IDs
          const ids = (process.env.META_COMPETITOR_PAGE_IDS || KNOWN_COMPETITORS.map(c => c.pageId).join(',')).split(',')

          for (const pageId of ids) {
            const url = `https://graph.facebook.com/v19.0/ads_archive?fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,page_id,page_name,publisher_platforms,snapshot_url&search_page_ids=${pageId}&ad_reached_countries=['${country}']&ad_type=ALL&ad_active_status=ACTIVE&access_token=${token}`
            const apiRes = await fetch(url)
            if (apiRes.ok) {
              const json = await apiRes.json()
              const data = json.data || []
              data.forEach((ad: any) => {
                const body = ad.ad_creative_bodies?.[0] || 'ERP Training Ad'
                activeAds.push({
                  id: ad.id,
                  pageId: ad.page_id,
                  pageName: ad.page_name || 'Competitor',
                  adCreationTime: ad.ad_creation_time || new Date().toISOString(),
                  body,
                  platforms: ad.publisher_platforms || ['facebook', 'instagram'],
                  linkTitle: ad.ad_creative_link_titles?.[0] || undefined,
                  angleDetected: detectAngle(body, pageId),
                  snapshotUrl: ad.snapshot_url || undefined,
                  imageUrl: getAdPreviewImage(body, ad.ad_creative_link_titles?.[0])
                })
              })
            } else {
              const errJson = await apiRes.json().catch(() => ({}))
              console.error(`Meta Ads Archive API error for page ${pageId}:`, errJson)
              throw new Error(errJson.error?.message || `Meta Ad Library HTTP error ${apiRes.status}`)
            }
          }
        }

        // Map competitor metrics
        let competitors = []
        if (pageIds) {
          const ids = pageIds.split(',')
          const pagesMap: Record<string, { name: string; ads: CompetitorAd[] }> = {}
          ids.forEach(id => {
            const known = KNOWN_COMPETITORS.find(c => c.pageId === id)
            pagesMap[id] = { name: known ? known.name : `Competitor ${id}`, ads: [] }
          })

          activeAds.forEach(ad => {
            if (pagesMap[ad.pageId]) {
              pagesMap[ad.pageId].ads.push(ad)
              if (ad.pageName && ad.pageName !== 'Competitor') {
                pagesMap[ad.pageId].name = ad.pageName
              }
            }
          })

          competitors = Object.entries(pagesMap).map(([pageId, val]) => {
            const cAds = val.ads
            const latestAd = cAds[0]
            const known = KNOWN_COMPETITORS.find(c => c.pageId === pageId)
            const threatLevel = known ? known.threat : (cAds.length > 5 ? 'high' : cAds.length > 2 ? 'medium' : 'low')
            
            return {
              name: val.name,
              pageId,
              threatLevel,
              activeAdsCount: cAds.length,
              angles: cAds.map(a => a.angleDetected).filter(Boolean).length > 0 
                ? Array.from(new Set(cAds.map(a => a.angleDetected).filter(Boolean))) as string[]
                : ['ERP Cloud Course'],
              runningSince: latestAd ? new Date(latestAd.adCreationTime).toLocaleDateString() : 'Active'
            }
          }).sort((a, b) => b.activeAdsCount - a.activeAdsCount)
        } else if (searchTerms) {
          // Group ads by page ID dynamically
          const pagesMap: Record<string, { name: string; ads: CompetitorAd[] }> = {}
          activeAds.forEach(ad => {
            if (!pagesMap[ad.pageId]) {
              pagesMap[ad.pageId] = { name: ad.pageName, ads: [] }
            }
            pagesMap[ad.pageId].ads.push(ad)
          })

          competitors = Object.entries(pagesMap).map(([pageId, val]) => {
            const count = val.ads.length
            const threatLevel: 'high' | 'medium' | 'low' = count > 5 ? 'high' : count > 2 ? 'medium' : 'low'
            const angles = Array.from(new Set(val.ads.map(a => a.angleDetected).filter(Boolean))) as string[]
            const latestAd = val.ads[0]

            return {
              name: val.name,
              pageId,
              threatLevel,
              activeAdsCount: count,
              angles: angles.length > 0 ? angles : ['ERP Training'],
              runningSince: latestAd ? new Date(latestAd.adCreationTime).toLocaleDateString() : 'Active'
            }
          }).sort((a, b) => b.activeAdsCount - a.activeAdsCount)
        } else {
          competitors = KNOWN_COMPETITORS.map(c => {
            const cAds = activeAds.filter(a => a.pageId === c.pageId)
            const latestAd = cAds[0]
            return {
              name: c.name,
              pageId: c.pageId,
              threatLevel: c.threat,
              activeAdsCount: cAds.length,
              angles: COMPETITOR_ANGLES_DETECTED[c.pageId] || ['Placement Support'],
              runningSince: latestAd ? new Date(latestAd.adCreationTime).toLocaleDateString() : '8 days ago'
            }
          })
        }

        return {
          competitors,
          gaps: ANGLE_GAPS,
          activeAds: activeAds.slice(0, 30),
          scannedAt: new Date().toISOString(),
          isReal: true
        }
      } catch (err) {
        console.error('Failed to query live Meta Ads Archive, falling back to mock competitor report:', err)
        return generateMockCompetitorReport(searchTerms, pageIds)
      }
    },
    bypassCache,
    ttl
  )

  return res.data
}

function detectAngle(body: string, pageId: string): string {
  const angles = COMPETITOR_ANGLES_DETECTED[pageId] || []
  const text = body.toLowerCase()
  for (const angle of angles) {
    if (text.includes(angle.toLowerCase()) || text.includes('coding') || text.includes('guarantee')) {
      return angle
    }
  }
  return angles[0] || 'Job Support ERP'
}

function getAdPreviewImage(body: string, title?: string): string {
  const text = `${body} ${title || ''}`.toLowerCase()
  if (
    text.includes('scm') || text.includes('supply chain') || text.includes('logistics') || 
    text.includes('wms') || text.includes('manufacturing') || text.includes('ppm') || 
    text.includes('otm') || text.includes('warehouse') || text.includes('tms') || text.includes('procurement')
  ) {
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
  }
  if (text.includes('hcm') || text.includes('human capital') || text.includes('payroll') || text.includes('talent') || text.includes('hr ')) {
    return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'
  }
  if (
    text.includes('financial') || text.includes('finance') || text.includes('accounting') || 
    text.includes('gl') || text.includes('ap') || text.includes('ar') || text.includes('tax') || 
    text.includes('ledger') || text.includes('financials')
  ) {
    return 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
  }
  if (
    text.includes('technical') || text.includes('oic') || text.includes('integration') || 
    text.includes('apex') || text.includes('db') || text.includes('sql') || text.includes('developer') || text.includes('admin')
  ) {
    return 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80'
  }
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
}

function generateMockCompetitorReport(searchTerms?: string, pageIds?: string): CompetitorReport {
  const activeAds: CompetitorAd[] = []
  
  if (pageIds) {
    const ids = pageIds.split(',')
    
    // Check if these are custom page IDs (not part of KNOWN_COMPETITORS)
    const isCustom = ids.some(id => !KNOWN_COMPETITORS.some(c => c.pageId === id))
    
    if (isCustom) {
      ids.forEach((pageId, idx) => {
        const name = `Preset Rival ${idx + 1}`
        const count = idx === 0 ? 5 : idx === 1 ? 3 : 1
        for (let i = 0; i < count; i++) {
          const title = `ERP Expert Cloud Certification Training`
          const body = `Get certified in Cloud Consulting. Learn real practical implementations, setups, and operations. Batch starts soon. 100% career support track.`
          activeAds.push({
            id: `comp-ad-mock-custom-${pageId}-${i}`,
            pageId,
            pageName: name,
            adCreationTime: new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000).toISOString(),
            body,
            platforms: ['facebook', 'instagram'],
            linkTitle: title,
            angleDetected: 'Placement Support',
            snapshotUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${pageId}`,
            imageUrl: getAdPreviewImage(body, title)
          })
        }
      })

      const competitors = ids.map((pageId, idx) => {
        const cAds = activeAds.filter(a => a.pageId === pageId)
        return {
          name: `Preset Rival ${idx + 1}`,
          pageId,
          threatLevel: idx === 0 ? 'high' as const : idx === 1 ? 'medium' as const : 'low' as const,
          activeAdsCount: cAds.length,
          angles: ['Placement Support', 'ERP Career Track'],
          runningSince: `${idx + 1} days ago`
        }
      })

      return {
        competitors,
        gaps: ['Proof layouts', 'Alumni salary logs'],
        activeAds,
        scannedAt: new Date().toISOString(),
        isReal: false
      }
    }
  }

  if (searchTerms) {
    const termClean = searchTerms.trim()
    const competitorNames = [`${termClean} Hub`, `Prime ${termClean} Academy`, `Global ERP Group`]
    const pageIds = ['mock_p_term_1', 'mock_p_term_2', 'mock_p_term_3']
    
    competitorNames.forEach((name, idx) => {
      const pageId = pageIds[idx]
      const count = idx === 0 ? 5 : idx === 1 ? 3 : 1
      for (let i = 0; i < count; i++) {
        const title = `${termClean} Practical Training Course`
        const body = `Master ${termClean} Cloud setups in 60 days. Become a certified consultant with our expert guidance. Job placement support, resume reviews, and practice sessions included.`
        activeAds.push({
          id: `comp-ad-mock-${idx}-${i}`,
          pageId,
          pageName: name,
          adCreationTime: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000).toISOString(),
          body,
          platforms: ['facebook', 'instagram'],
          linkTitle: title,
          angleDetected: 'Placement Support',
          snapshotUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&q=${encodeURIComponent(termClean)}`,
          imageUrl: getAdPreviewImage(body, title)
        })
      }
    })

    const competitors = competitorNames.map((name, idx) => {
      const pageId = pageIds[idx]
      const count = idx === 0 ? 5 : idx === 1 ? 3 : 1
      return {
        name,
        pageId,
        threatLevel: idx === 0 ? 'high' as const : idx === 1 ? 'medium' as const : 'low' as const,
        activeAdsCount: count,
        angles: ['Placement Support', 'ERP Career Track'],
        runningSince: `${idx + 1} days ago`
      }
    })

    return {
      competitors,
      gaps: ['Proof layouts', 'Alumni salary logs'],
      activeAds,
      scannedAt: new Date().toISOString(),
      isReal: false
    }
  }

  const mockAdsMeta = [
    // Cloudshine - 12 ads
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion SCM 3-Month Training', body: 'Become a certified Oracle SCM Cloud Consultant in 90 days. We guarantee job placements with 5500+ graduates hired. No previous tech experience required!' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion HCM Fasttrack', body: 'Master Core HR, Payroll, and Security Modules. Complete course with real-time project practice. Job guarantee program starting next week.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion Financials Cloud Course', body: 'Stuck in low-paying finance jobs? Move to high-paying Oracle Fusion Financials Cloud. Join our certified financial consultant program today.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion Technical OIC Training', body: 'Learn OIC, VBCS, and Integration modules from senior ERP consultants. High-salary IT careers without traditional coding requirements.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion SCM - Warehouse Management', body: 'Become an expert in Oracle WMS and Inventory modules. Complete practical hands-on training sessions with real client sandbox environments.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion HCM Talent Management', body: 'Deep dive into Oracle HR Security, Compensation, and Performance Management. Batch starting Monday. We guarantee interviews with top MNC partners.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion General Ledger Masterclass', body: 'Master General Ledger, Accounts Payable, and Accounts Receivable modules. Real-time project simulations included in our premium ERP training.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion Technical Apex Guide', body: 'Learn Oracle APEX and Cloud Database Management. Complete step-by-step developer tutorial guides designed by industry veterans.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Supply Chain Logistics Certification', body: 'Get certified in Oracle Fusion Supply Chain Management (SCM). Register today to receive 20% early-bird discounts on module fees.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle HCM Core HR Training', body: 'Earn your Oracle HCM certification. Gain expertise in Payroll setups, global HR rules, and workforce structures in 8 weeks.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Fusion AP/AR Invoice Setups', body: 'Practical setups of sub-ledger accounting, invoices, tax processing, and assets in Oracle Financials Cloud. Enroll now to secure your seat.' },
    { pageId: '519383907933319', name: 'Cloudshine', title: 'Oracle Integration Cloud (OIC) Certification', body: 'Learn advanced OIC adapters, integrations, and connection rules. Top high-paying tech consultant career paths without software engineering degrees.' },

    // GrowMore Technologies - 3 ads
    { pageId: '374798099056166', name: 'GrowMore Technologies', title: 'Oracle Cloud Financials Placement Support', body: 'Oracle Cloud Financials training with placement support. Learn GL, AP, AR modules. Zero coding experience needed. Get placed in leading consultancies.' },
    { pageId: '374798099056166', name: 'GrowMore Technologies', title: 'Oracle Fusion HCM Online Course', body: 'Grow your career with Oracle HCM Cloud training. Interactive live classes, placement preparation sessions, and custom resume writing assistance.' },
    { pageId: '374798099056166', name: 'GrowMore Technologies', title: 'Oracle Fusion SCM Procurement setups', body: 'Learn complete inventory configurations and procurement lifecycles in Oracle SCM. No technical background necessary to get hired.' },

    // Erptree Job Guarantee - 3 ads
    { pageId: '408185105700768', name: 'Erptree Job Guarantee', title: 'High Salary in IT without Coding', body: 'High-paying jobs are waiting for you in Oracle Cloud ERP. We teach SCM and HCM modules with placement support. Skills that get you hired immediately!' },
    { pageId: '408185105700768', name: 'Erptree Job Guarantee', title: 'Oracle Fusion SCM Certification Prep', body: 'Get ready for your Oracle SCM certification exam. Extensive question bank sessions, real project walkthroughs, and guaranteed interview scheduling.' },
    { pageId: '408185105700768', name: 'Erptree Job Guarantee', title: 'Oracle HCM Career Transition Guide', body: 'Move from generic HR to high-salary Oracle HCM consulting. Placement support, live project practice, and mock interviews from senior trainers.' },

    // Cloud Finance Guru - 1 ad
    { pageId: '1110304798838787', name: 'Cloud Finance Guru', title: 'Oracle Cloud Finance Training', body: 'Oracle Cloud Finance online training course. Learn subledger setups, assets management, cash management, and taxes. Become a certified ERP financial consultant.' },

    // Applstar Technologies - 1 ad
    { pageId: '945066105345619', name: 'Applstar Technologies', title: 'Learn Fusion Technical', body: 'Detailed guide to Oracle Integration Cloud (OIC) and Fusion technical setups. Learn adapters, file transfers, scheduling, and custom lookups.' },

    // MJ Adworks - 1 ad
    { pageId: '440615765813122', name: 'MJ Adworks', title: 'ERP Cloud Career Support', body: 'Looking for ERP job opportunities? We provide Oracle Fusion SCM and Financials training with career mentoring support. Batch sizes limited to 15 students.' }
  ]

  // Filter ads by pageIds if provided
  const targetAds = pageIds 
    ? mockAdsMeta.filter(m => pageIds.split(',').includes(m.pageId))
    : mockAdsMeta

  targetAds.forEach((m, idx) => {
    activeAds.push({
      id: `comp-ad-${idx}-${m.pageId}`,
      pageId: m.pageId,
      pageName: m.name,
      adCreationTime: new Date(Date.now() - ((idx % 5) + 1) * 24 * 60 * 60 * 1000).toISOString(),
      body: m.body,
      platforms: ['facebook', 'instagram', 'messenger'],
      linkTitle: m.title,
      angleDetected: detectAngle(m.body, m.pageId),
      snapshotUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&view_all_page_id=${m.pageId}`,
      imageUrl: getAdPreviewImage(m.body, m.title)
    })
  })

  // Filter competitors list by pageIds if provided
  const filterIds = pageIds ? pageIds.split(',') : null
  const competitorsList = filterIds 
    ? KNOWN_COMPETITORS.filter(c => filterIds.includes(c.pageId))
    : KNOWN_COMPETITORS

  const competitors = competitorsList.map((c, idx) => {
    const countsMap: Record<string, number> = {
      '519383907933319': 12,
      '374798099056166': 3,
      '408185105700768': 3,
      '1110304798838787': 1,
      '945066105345619': 1,
      '440615765813122': 1
    }
    const daysSinceMap: Record<string, string> = {
      '519383907933319': '3 days ago',
      '374798099056166': '8 days ago',
      '408185105700768': '15 days ago',
      '1110304798838787': '2 days ago',
      '945066105345619': '1 day ago',
      '440615765813122': '8 days ago'
    }
    const cAds = activeAds.filter(a => a.pageId === c.pageId)
    return {
      name: c.name,
      pageId: c.pageId,
      threatLevel: c.threat,
      activeAdsCount: cAds.length || countsMap[c.pageId] || 1,
      angles: COMPETITOR_ANGLES_DETECTED[c.pageId] || ['Placement Support'],
      runningSince: daysSinceMap[c.pageId] || '8 days ago'
    }
  })

  return {
    competitors,
    gaps: ANGLE_GAPS,
    activeAds,
    scannedAt: new Date().toISOString(),
    isReal: false
  }
}
