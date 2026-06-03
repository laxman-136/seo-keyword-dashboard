// lib/mockLeadsData.ts

export function getMockLeadsMonthlyResponse(): { values: string[][] } {
  return {
    values: [
      [
        "Month", "Total Leads", "Website Leads", "Organic Leads", 
        "SCM Leads", "HCM Leads", "Financials Leads", "Tech OIC Leads", 
        "PPM Leads", "SAP EBS Others Leads", "Enrolled", "High Potential", 
        "Medium Potential", "Fresh Unqualified", "Low Cold", "Conv Rate"
      ],
      // Jan 2026
      ["Jan 2026", "210", "150", "60", "75", "25", "30", "40", "10", "30", "10", "65", "55", "45", "35", "4.8"],
      // Feb 2026
      ["Feb 2026", "220", "160", "60", "80", "26", "32", "42", "8", "32", "11", "70", "60", "40", "39", "5.0"],
      // Mar 2026
      ["Mar 2026", "235", "170", "65", "85", "28", "35", "44", "7", "36", "12", "75", "62", "48", "38", "5.1"],
      // Apr 2026
      ["Apr 2026", "245", "178", "67", "90", "27", "36", "45", "9", "38", "13", "80", "65", "45", "42", "5.3"],
      // May 2026 (exact values requested by user)
      ["May 2026", "252", "182", "70", "92", "29", "37", "47", "8", "39", "14", "82", "69", "46", "41", "5.6"]
    ]
  }
}

export function getMockLeadsDetailResponse(): { values: string[][] } {
  return {
    values: [
      [
        "Month", "Course Name", "Enrolled", "High Potential", "Medium Potential", 
        "Fresh Unqualified", "Low Cold", "Total", "Organic", "Website"
      ],
      // Jan 2026
      ["Jan 2026", "Oracle Fusion SCM", "2", "25", "25", "15", "8", "75", "20", "55"],
      ["Jan 2026", "Oracle Fusion Tech + OIC", "3", "12", "12", "7", "6", "40", "12", "28"],
      ["Jan 2026", "Oracle Fusion Financials", "1", "12", "8", "6", "3", "30", "12", "18"],
      ["Jan 2026", "Oracle Fusion HCM", "2", "8", "8", "4", "3", "25", "7", "18"],
      ["Jan 2026", "Oracle Fusion PPM", "1", "3", "3", "2", "1", "10", "4", "6"],
      ["Jan 2026", "SAP / EBS / Others", "1", "5", "1", "11", "12", "30", "5", "25"],
      
      // Feb 2026
      ["Feb 2026", "Oracle Fusion SCM", "2", "27", "28", "14", "9", "80", "22", "58"],
      ["Feb 2026", "Oracle Fusion Tech + OIC", "4", "13", "11", "6", "8", "42", "10", "32"],
      ["Feb 2026", "Oracle Fusion Financials", "1", "13", "8", "5", "5", "32", "13", "19"],
      ["Feb 2026", "Oracle Fusion HCM", "2", "8", "10", "4", "2", "26", "8", "18"],
      ["Feb 2026", "Oracle Fusion PPM", "1", "2", "2", "2", "1", "8", "3", "5"],
      ["Feb 2026", "SAP / EBS / Others", "1", "7", "1", "9", "14", "32", "4", "28"],
      
      // Mar 2026
      ["Mar 2026", "Oracle Fusion SCM", "3", "28", "29", "16", "9", "85", "23", "62"],
      ["Mar 2026", "Oracle Fusion Tech + OIC", "4", "14", "13", "8", "5", "44", "13", "31"],
      ["Mar 2026", "Oracle Fusion Financials", "1", "15", "8", "7", "4", "35", "14", "21"],
      ["Mar 2026", "Oracle Fusion HCM", "2", "9", "10", "4", "3", "28", "8", "20"],
      ["Mar 2026", "Oracle Fusion PPM", "1", "2", "1", "2", "1", "7", "2", "5"],
      ["Mar 2026", "SAP / EBS / Others", "1", "7", "1", "11", "16", "36", "5", "31"],
      
      // Apr 2026
      ["Apr 2026", "Oracle Fusion SCM", "3", "29", "30", "18", "10", "90", "24", "66"],
      ["Apr 2026", "Oracle Fusion Tech + OIC", "4", "15", "13", "7", "6", "45", "13", "32"],
      ["Apr 2026", "Oracle Fusion Financials", "1", "16", "8", "6", "5", "36", "14", "22"],
      ["Apr 2026", "Oracle Fusion HCM", "2", "10", "10", "3", "2", "27", "8", "19"],
      ["Apr 2026", "Oracle Fusion PPM", "1", "2", "3", "2", "1", "9", "3", "6"],
      ["Apr 2026", "SAP / EBS / Others", "2", "8", "1", "9", "18", "38", "5", "33"],
      
      // May 2026 (exact values requested by user)
      ["May 2026", "Oracle Fusion SCM", "3", "30", "32", "17", "10", "92", "25", "67"],
      ["May 2026", "Oracle Fusion Tech + OIC", "5", "15", "14", "7", "6", "47", "14", "33"],
      ["May 2026", "Oracle Fusion Financials", "1", "16", "8", "7", "5", "37", "15", "22"],
      ["May 2026", "Oracle Fusion HCM", "2", "10", "11", "4", "2", "29", "8", "21"],
      ["May 2026", "Oracle Fusion PPM", "1", "2", "3", "1", "1", "8", "3", "5"],
      ["May 2026", "SAP / EBS / Others", "2", "9", "1", "10", "17", "39", "5", "34"]
    ]
  }
}
