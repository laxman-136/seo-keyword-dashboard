// lib/mockData.ts
import { KeywordRow } from './types';

// Let's create a realistic dataset of 76 keywords mapping directly to the 13 training categories
export const MOCK_KEYWORDS: KeywordRow[] = [
  // 1. Oracle Fusion SCM (9 keywords)
  {
    keyword: 'Oracle Fusion SCM online training',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 5 },
      'Apr-26': { page: 1, position: 3 },
      'May-26': { page: 1, position: 2 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Primary high-intent keyword.'
  },
  {
    keyword: 'Oracle Cloud SCM certification course',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 8 },
      'Apr-26': { page: 1, position: 7 },
      'May-26': { page: 1, position: 5 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Moved up to P1 Good.'
  },
  {
    keyword: 'Oracle Fusion Inventory training tutorial',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 3 },
      'Apr-26': { page: 2, position: 1 },
      'May-26': { page: 1, position: 9 }
    },
    status: 'Ranking Well',
    priority: 'Medium',
    notes: 'Entered page 1 this month!'
  },
  {
    keyword: 'Oracle Fusion Order Management course fee',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 3, position: 4 },
      'Apr-26': { page: 2, position: 8 },
      'May-26': { page: 2, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Slowly climbing.'
  },
  {
    keyword: 'Oracle Fusion SCM training institute',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 3 },
      'Apr-26': { page: 1, position: 4 },
      'May-26': { page: 1, position: 3 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Stable on page 1.'
  },
  {
    keyword: 'best Oracle Fusion SCM course online',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 5 },
      'Apr-26': { page: 2, position: 5 },
      'May-26': { page: 2, position: 6 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Fluctuating slightly on Page 2.'
  },
  {
    keyword: 'Oracle SCM Cloud functional consultant training',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 4, position: 2 },
      'May-26': { page: 3, position: 8 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Climbing from page 4.'
  },
  {
    keyword: 'Oracle Fusion Pricing tutorial guide',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 4, position: 3 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'New ranking entry this month.'
  },
  {
    keyword: 'learn Oracle Fusion Supply Chain management',
    group: 'Oracle Fusion SCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 3, position: 2 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'Lost ranking this month.'
  },

  // 2. Oracle Fusion Financials (9 keywords)
  {
    keyword: 'Oracle Fusion Financials certification online',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 1, position: 4 },
      'Apr-26': { page: 1, position: 2 },
      'May-26': { page: 1, position: 1 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Ranks #1 now!'
  },
  {
    keyword: 'Oracle Cloud Financials training classes',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 1, position: 7 },
      'Apr-26': { page: 1, position: 8 },
      'May-26': { page: 1, position: 6 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Strong search volume keyword.'
  },
  {
    keyword: 'Oracle General Ledger Cloud training',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 2, position: 1 },
      'Apr-26': { page: 1, position: 10 },
      'May-26': { page: 1, position: 8 }
    },
    status: 'Ranking Well',
    priority: 'Medium',
    notes: 'Solid position on P1.'
  },
  {
    keyword: 'Oracle Fusion Accounts Payable course',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 2, position: 6 },
      'Apr-26': { page: 2, position: 4 },
      'May-26': { page: 2, position: 2 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Close to page 1.'
  },
  {
    keyword: 'Oracle Fusion Receivables certification syllabus',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 3, position: 2 },
      'Apr-26': { page: 3, position: 1 },
      'May-26': { page: 2, position: 9 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Climbed to page 2.'
  },
  {
    keyword: 'Oracle Fusion Financials institute in India',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 1, position: 3 },
      'Apr-26': { page: 1, position: 5 },
      'May-26': { page: 1, position: 7 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Slight drop but still page 1.'
  },
  {
    keyword: 'best Oracle Cloud Financials training',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 2, position: 4 },
      'Apr-26': { page: 2, position: 6 },
      'May-26': { page: 2, position: 8 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Slightly sliding down.'
  },
  {
    keyword: 'Oracle Fusion Assets training tutorial',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'New entry.'
  },
  {
    keyword: 'learn Oracle Cash Management Cloud online',
    group: 'Oracle Fusion Financials',
    monthlyData: {
      'Mar-26': { page: 3, position: 8 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'Dropped out of rankings.'
  },

  // 3. Oracle Fusion HCM (10 keywords)
  {
    keyword: 'Oracle Fusion HCM online training course',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 6 },
      'Apr-26': { page: 1, position: 4 },
      'May-26': { page: 1, position: 3 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Top 3 position secured.'
  },
  {
    keyword: 'Oracle Cloud Human Capital Management course',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 10 },
      'Apr-26': { page: 1, position: 8 },
      'May-26': { page: 1, position: 5 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Strong upward momentum.'
  },
  {
    keyword: 'Oracle Fusion Global HR training certification',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 2 },
      'Apr-26': { page: 1, position: 9 },
      'May-26': { page: 1, position: 8 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Held solid on Page 1.'
  },
  {
    keyword: 'Oracle Cloud Payroll certification syllabus',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 2, position: 5 },
      'May-26': { page: 2, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Improving position on Page 2.'
  },
  {
    keyword: 'Oracle Fusion Absence Management training',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 3, position: 1 },
      'Apr-26': { page: 2, position: 9 },
      'May-26': { page: 2, position: 7 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Steady gains.'
  },
  {
    keyword: 'Oracle Fusion Talent Management course online',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 4, position: 5 },
      'Apr-26': { page: 3, position: 2 },
      'May-26': { page: 3, position: 1 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Approaching Page 2.'
  },
  {
    keyword: 'Oracle HCM Cloud security profile tutorial',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 2, position: 4 },
      'Apr-26': { page: 2, position: 6 },
      'May-26': { page: 2, position: 9 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Slightly dropped.'
  },
  {
    keyword: 'best online institute for Oracle Fusion HCM',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 1, position: 4 },
      'Apr-26': { page: 1, position: 5 },
      'May-26': { page: 1, position: 6 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Stable on page 1.'
  },
  {
    keyword: 'Oracle Fusion Fast Formulas training tutorial',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 4, position: 8 },
      'May-26': { page: 3, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'New interest area climbing.'
  },
  {
    keyword: 'Oracle Cloud HCM consultant career training',
    group: 'Oracle Fusion HCM',
    monthlyData: {
      'Mar-26': { page: 3, position: 5 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'Inactive keyword.'
  },

  // 4. Oracle Fusion Technical (4 keywords)
  {
    keyword: 'Oracle Fusion Technical online training',
    group: 'Oracle Fusion Technical',
    monthlyData: {
      'Mar-26': { page: 1, position: 3 },
      'Apr-26': { page: 1, position: 2 },
      'May-26': { page: 1, position: 2 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Strong #2 ranking.'
  },
  {
    keyword: 'Oracle Cloud BIP and OTBI reports training',
    group: 'Oracle Fusion Technical',
    monthlyData: {
      'Mar-26': { page: 2, position: 5 },
      'Apr-26': { page: 1, position: 9 },
      'May-26': { page: 1, position: 8 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Secured page 1.'
  },
  {
    keyword: 'Oracle Fusion HDL and HCM Extract course',
    group: 'Oracle Fusion Technical',
    monthlyData: {
      'Mar-26': { page: 2, position: 9 },
      'Apr-26': { page: 2, position: 7 },
      'May-26': { page: 2, position: 3 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Ready for Page 1 push.'
  },
  {
    keyword: 'learn Oracle Fusion Sandbox customization',
    group: 'Oracle Fusion Technical',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 3, position: 8 },
      'May-26': { page: 3, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Steady climb.'
  },

  // 5. Oracle Fusion Procurement (4 keywords)
  {
    keyword: 'Oracle Fusion Procurement training course',
    group: 'Oracle Fusion Procurement',
    monthlyData: {
      'Mar-26': { page: 1, position: 5 },
      'Apr-26': { page: 1, position: 4 },
      'May-26': { page: 1, position: 3 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Main keyword performing well.'
  },
  {
    keyword: 'Oracle Cloud Purchasing online classes',
    group: 'Oracle Fusion Procurement',
    monthlyData: {
      'Mar-26': { page: 2, position: 3 },
      'Apr-26': { page: 2, position: 1 },
      'May-26': { page: 1, position: 10 }
    },
    status: 'Ranking Well',
    priority: 'Medium',
    notes: 'Entered page 1.'
  },
  {
    keyword: 'Oracle Supplier Portal Cloud training tutorial',
    group: 'Oracle Fusion Procurement',
    monthlyData: {
      'Mar-26': { page: 3, position: 2 },
      'Apr-26': { page: 2, position: 8 },
      'May-26': { page: 2, position: 6 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Climbing page 2.'
  },
  {
    keyword: 'Oracle Fusion Self Service Procurement course',
    group: 'Oracle Fusion Procurement',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 4, position: 1 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'New entry this month.'
  },

  // 6. Oracle Recruiting & WMS (6 keywords)
  {
    keyword: 'Oracle Recruiting Cloud training ORC course',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 1, position: 2 },
      'Apr-26': { page: 1, position: 3 },
      'May-26': { page: 1, position: 1 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Ranked #1!'
  },
  {
    keyword: 'Oracle Fusion WMS Cloud online training',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 2, position: 4 },
      'Apr-26': { page: 1, position: 10 },
      'May-26': { page: 1, position: 8 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Sustaining page 1.'
  },
  {
    keyword: 'Logfire WMS certification training classes',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 2, position: 6 },
      'May-26': { page: 2, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Improving.'
  },
  {
    keyword: 'Oracle ORC consultant functional course',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 3, position: 5 },
      'Apr-26': { page: 3, position: 3 },
      'May-26': { page: 3, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Flat in Page 3.'
  },
  {
    keyword: 'Oracle Cloud WMS warehousing tutorial',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 4, position: 5 },
      'May-26': { page: 3, position: 9 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Climbing up.'
  },
  {
    keyword: 'Oracle Recruiting Cloud setup guide training',
    group: 'Oracle Recruiting & WMS',
    monthlyData: {
      'Mar-26': { page: 4, position: 2 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'No current rank.'
  },

  // 7. Oracle Integration & GTM (4 keywords)
  {
    keyword: 'Oracle Integration Cloud OIC training',
    group: 'Oracle Integration & GTM',
    monthlyData: {
      'Mar-26': { page: 1, position: 4 },
      'Apr-26': { page: 1, position: 2 },
      'May-26': { page: 1, position: 2 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Main product keyword solid at #2.'
  },
  {
    keyword: 'Oracle Global Trade Management GTM course',
    group: 'Oracle Integration & GTM',
    monthlyData: {
      'Mar-26': { page: 2, position: 3 },
      'Apr-26': { page: 2, position: 1 },
      'May-26': { page: 1, position: 9 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Entered page 1.'
  },
  {
    keyword: 'Oracle OIC certification online guide',
    group: 'Oracle Integration & GTM',
    monthlyData: {
      'Mar-26': { page: 2, position: 7 },
      'Apr-26': { page: 2, position: 5 },
      'May-26': { page: 2, position: 3 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Rising OIC keyword.'
  },
  {
    keyword: 'learn Oracle OIC integration agent setup',
    group: 'Oracle Integration & GTM',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 4, position: 6 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'New entry.'
  },

  // 8. Oracle Fusion Manufacturing (3 keywords)
  {
    keyword: 'Oracle Fusion Manufacturing training course',
    group: 'Oracle Fusion Manufacturing',
    monthlyData: {
      'Mar-26': { page: 1, position: 6 },
      'Apr-26': { page: 1, position: 5 },
      'May-26': { page: 1, position: 4 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Now in P1 Top.'
  },
  {
    keyword: 'Oracle Cloud Work Execution tutorial training',
    group: 'Oracle Fusion Manufacturing',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 2, position: 6 },
      'May-26': { page: 2, position: 3 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Moving up.'
  },
  {
    keyword: 'Oracle Manufacturing Cloud certification cost',
    group: 'Oracle Fusion Manufacturing',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 2 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'New entry.'
  },

  // 9. Oracle Fusion PPM (7 keywords)
  {
    keyword: 'Oracle Fusion PPM training online course',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 1, position: 4 },
      'Apr-26': { page: 1, position: 3 },
      'May-26': { page: 1, position: 3 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Stable at #3.'
  },
  {
    keyword: 'Oracle Cloud Project Portfolio Management course',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 1, position: 9 },
      'Apr-26': { page: 1, position: 8 },
      'May-26': { page: 1, position: 7 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Solid search volume.'
  },
  {
    keyword: 'Oracle Project Costing Cloud training classes',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 2, position: 2 },
      'Apr-26': { page: 2, position: 1 },
      'May-26': { page: 1, position: 9 }
    },
    status: 'Ranking Well',
    priority: 'Medium',
    notes: 'Broke into page 1.'
  },
  {
    keyword: 'Oracle Project Billing Cloud functional course',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 3, position: 4 },
      'Apr-26': { page: 2, position: 7 },
      'May-26': { page: 2, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Advancing.'
  },
  {
    keyword: 'Oracle Fusion PPM contract management tutorial',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 2, position: 9 },
      'May-26': { page: 2, position: 8 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'Slightly up.'
  },
  {
    keyword: 'best training provider for Oracle Fusion PPM',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 3, position: 7 },
      'May-26': { page: 3, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Gradually improving.'
  },
  {
    keyword: 'Oracle Fusion PPM setup steps certification',
    group: 'Oracle Fusion PPM',
    monthlyData: {
      'Mar-26': { page: 4, position: 1 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'No current rank.'
  },

  // 10. SAP (6 keywords)
  {
    keyword: 'SAP S/4HANA simple finance training',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 1, position: 8 },
      'Apr-26': { page: 1, position: 7 },
      'May-26': { page: 1, position: 4 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Entered Top 4 page 1.'
  },
  {
    keyword: 'best SAP SuccessFactors online training',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 2, position: 3 },
      'Apr-26': { page: 2, position: 2 },
      'May-26': { page: 1, position: 10 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Broke into page 1.'
  },
  {
    keyword: 'SAP Ariba functional training classes',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 2, position: 9 },
      'Apr-26': { page: 2, position: 7 },
      'May-26': { page: 2, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Rising steadily.'
  },
  {
    keyword: 'SAP ABAP on HANA certification cost',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 3, position: 2 },
      'Apr-26': { page: 3, position: 5 },
      'May-26': { page: 3, position: 7 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Minor decline.'
  },
  {
    keyword: 'learn SAP FICO online functional consultant',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 2 }
    },
    status: 'Needs Work',
    priority: 'High',
    notes: 'Important new entry.'
  },
  {
    keyword: 'SAP MM warehousing custom tutorial training',
    group: 'SAP',
    monthlyData: {
      'Mar-26': { page: 2, position: 8 },
      'Apr-26': { page: 3, position: 2 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'Lost ranking.'
  },

  // 11. Salesforce & Others (6 keywords)
  {
    keyword: 'Salesforce Admin and Developer online training',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 1, position: 5 },
      'Apr-26': { page: 1, position: 3 },
      'May-26': { page: 1, position: 2 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Aesthetic #2 place.'
  },
  {
    keyword: 'Salesforce CPQ certification training classes',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 2, position: 2 },
      'Apr-26': { page: 1, position: 10 },
      'May-26': { page: 1, position: 9 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Keeps page 1.'
  },
  {
    keyword: 'Salesforce Commerce Cloud training syllabus',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 2, position: 9 },
      'Apr-26': { page: 2, position: 8 },
      'May-26': { page: 2, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Growing slowly.'
  },
  {
    keyword: 'MuleSoft integration developer course online',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 3, position: 5 },
      'Apr-26': { page: 3, position: 4 },
      'May-26': { page: 2, position: 8 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Entered page 2.'
  },
  {
    keyword: 'Workday HCM training online fees',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 4 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'New entry.'
  },
  {
    keyword: 'learn ServiceNow developer administration',
    group: 'Salesforce & Others',
    monthlyData: {
      'Mar-26': { page: 3, position: 9 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 0, position: 0 }
    },
    status: 'Not Ranking',
    priority: 'Low',
    notes: 'Lost ranking.'
  },

  // 12. DevOps & Cloud (4 keywords)
  {
    keyword: 'best AWS Certified Solutions Architect course',
    group: 'DevOps & Cloud',
    monthlyData: {
      'Mar-26': { page: 1, position: 6 },
      'Apr-26': { page: 1, position: 4 },
      'May-26': { page: 1, position: 3 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Top 3 placement.'
  },
  {
    keyword: 'DevOps Masterclass online training with Jenkins',
    group: 'DevOps & Cloud',
    monthlyData: {
      'Mar-26': { page: 2, position: 4 },
      'Apr-26': { page: 2, position: 2 },
      'May-26': { page: 1, position: 10 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Entered page 1.'
  },
  {
    keyword: 'Docker and Kubernetes training certification',
    group: 'DevOps & Cloud',
    monthlyData: {
      'Mar-26': { page: 3, position: 2 },
      'Apr-26': { page: 2, position: 8 },
      'May-26': { page: 2, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Upward page 2.'
  },
  {
    keyword: 'Terraform cloud infrastructure training tutorial',
    group: 'DevOps & Cloud',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 1 }
    },
    status: 'Needs Work',
    priority: 'Low',
    notes: 'New entry.'
  },

  // 13. Data & Azure (4 keywords)
  {
    keyword: 'Microsoft Azure Cloud administration course',
    group: 'Data & Azure',
    monthlyData: {
      'Mar-26': { page: 1, position: 4 },
      'Apr-26': { page: 1, position: 3 },
      'May-26': { page: 1, position: 2 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'Premium ranking.'
  },
  {
    keyword: 'Power BI online training and certification',
    group: 'Data & Azure',
    monthlyData: {
      'Mar-26': { page: 2, position: 3 },
      'Apr-26': { page: 2, position: 1 },
      'May-26': { page: 1, position: 9 }
    },
    status: 'Ranking Well',
    priority: 'High',
    notes: 'P1 entry.'
  },
  {
    keyword: 'Azure Data Factory ADF developer course',
    group: 'Data & Azure',
    monthlyData: {
      'Mar-26': { page: 3, position: 1 },
      'Apr-26': { page: 2, position: 6 },
      'May-26': { page: 2, position: 5 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'Improving.'
  },
  {
    keyword: 'learn Snowflake cloud data warehouse online',
    group: 'Data & Azure',
    monthlyData: {
      'Mar-26': { page: 0, position: 0 },
      'Apr-26': { page: 0, position: 0 },
      'May-26': { page: 3, position: 3 }
    },
    status: 'Needs Work',
    priority: 'Medium',
    notes: 'New entry Snowflake.'
  }
];

// Helper to convert MOCK_KEYWORDS to Google Sheet Values Grid matching Sheets API structure
// Row 0 = headers, Rows 1.. = data
export function getMockSheetsResponse(): { values: string[][] } {
  const headers = [
    'Keyword',
    'Group',
    'Mar-26 Page',
    'Mar-26 Position',
    'Apr-26 Page',
    'Apr-26 Position',
    'May-26 Page',
    'May-26 Position',
    'Status',
    'Priority',
    'Notes'
  ];

  const values: string[][] = [headers];

  MOCK_KEYWORDS.forEach(kw => {
    const row = [
      kw.keyword,
      kw.group,
      String(kw.monthlyData['Mar-26']?.page ?? 0),
      String(kw.monthlyData['Mar-26']?.position ?? 0),
      String(kw.monthlyData['Apr-26']?.page ?? 0),
      String(kw.monthlyData['Apr-26']?.position ?? 0),
      String(kw.monthlyData['May-26']?.page ?? 0),
      String(kw.monthlyData['May-26']?.position ?? 0),
      kw.status,
      kw.priority,
      kw.notes
    ];
    values.push(row);
  });

  return { values };
}
