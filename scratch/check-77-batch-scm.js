const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const rawManualData = `
77th Batch	Sri Nandhini	vedamnandhini@gmail.com	9347839948
77th Batch	Suresh babu	sureshbabusureshbabu53276@gmail.com	+91 70131 27170
77th Batch	Abhishek pillai	abhipillai95@gmail.com	+91 96011 25788
77th Batch	Piyush jain	Piyush857.pj@gmail.com	+91 99876 43342
77th Batch	Arunachalam Angusamy	Arunachalam.angusamy@gmail.com	1 (309) 585-7810
77th Batch	Surya Arempula	suryaarempula17@gmail.com	+91 88861 31346
77th Batch	Naresh kumar	nareshkumar.mitnyala@gmail.com	+91 991 223 1803
77th Batch	Rhitam Biswas	Biswasrhitam@gmail.com	91 90513 32490
77th Batch	Siddharth	moreddysiddharth@gmail.com	+91 73965 65117
77th Batch	Santosh g	Santoshgurujula@gmail.com	9160077979
77th Batch	Nagarjuna Kamma	Nagarjun.kamma@outlook.com	8867672555
77th Batch	Rashmin Patel	patelrashmin84@rediffmail.com	9890936663
77th Batch	Kathiresh	kathirvanan1312@gmail.com	95141 90850
77th Batch	Kishore	Work.kishore29@gmail.com	95668 33208
77th Batch	Akshay Ghosh	aksh.ag.ghosh@gmail.com	6294679160
77th Batch	Girish Desh Pande	gr.deshpande@gmail.com	8408800223
77th Batch	Himani Singh	himanijsscs10@gmail.com	9971319899
77th Batch	Amit Thawkar	amitthawkar92@yahoo.in	9404355770
77th Batch	Yogesh Parashar	Yogesh81pa@gmail.com	9873153460
77th Batch	Surekha sunkara	surekha18.sk@gmail.com	7569296547
77th Batch	Subhani	Subhanisiddiqua25@gmail.com	91211 66099
77th Batch	Karthik	karthikoracle.27@gmail.com	93981 30193
77th Batch	Vidya	vidyapathak15@gmail.com	70045 15018
77th Batch	Vaishnavi	vaishnavichaudhari.865@gmail.com	7385434589
77th Batch	Mandar rajurkar	mandar_rajurkar@yahoo.co.in	95610 96145
77th Batch	Tarunsai	tarunsai.talapaneni@gmail.com	7815986598
77th Batch	RaviRaj	ravirajbulbule1111@gmail.com	9604773754
77th Batch	Ch Ravishankar Reddy	rschravi@gmail.com	8008002574
77th Batch	Sai Kumar Reddy	saireddygona@gmail.com	7095010616
77th Batch	Satish Kummarikunta	chefsatti@gmail.com	9676936242
77th Batch	Udhya Ram	d.udhyaram@gmail.com	9952605151
77th Batch	Pradeep	pradeepkumar.saikam@gmail.com	72074 09741
77th Batch	Ajeesh	ajeeshca88@gmail.com	8123040636
77th Batch	Bhavya	palli.bhavya@gmail.com	9703990744
77th Batch	Sudarshan	sudarsanreddyofficial@gmail.com	9642245231
77th Batch	Nikhil Minmule	nikhilminmule@gmail.com	8983322707
77th Batch	Rama chowdary	ramaa.app@gmail.com	7093000199
77th Batch	sivarao	siva.nani4@gmail.com	8125742471
77th Batch	praveen Nallapaneni	praveen.nk73@gmail.com	7013603056
77th Batch 	Shahid Ahmed	Shahidahmed910@gmail.com	7674873367
77th Batch	Daniyal Mujawar	daniyalmujawar4321@gmail.com	9029732473
77th Batch	Korne Sudheer	kornesudheer@gmail.com	9642979601
77th Batch	venkata krishina	venkatakrishnan.m@gmail.com	6106157084
77th Batch	Divya	kundadivyasri@gmail.com	8074341509
77th Batch	Akshay More	akshay110794@outlook.com	8390130623
77th Batch	Akhila	akhilaraja2991@gmail.com	917396902991
77th Batch	Santosh Vishali	gskscmconsultant@gmail.com	9160077979
77th Batch	Rajasekhar Allam	arr.kpl@gmail.com	4372394990
77th Batch	Vishwa Kumbh	vishwakumbh@gmail.com	85010066626
77th Batch	Manikandan S	manisai26596@gmail.com	919791543360
77th Batch	naresh nagabhairu	naresh5ora@gmail.com	19722144434
77th Batch	Abdul Salman	abdulsalman4545@gmail.com	919059922914
77th Batch	Priyanka P Londhe	londhepriyanka466@gmail.com	918108982197
77th Batch	Kartheek	itha.kartheek@gmail.com	919030544279
77th Batch	anandsahadevan	anandsahadevan.tn@outlook.com	918124016791
77th Batch	Vignesh	vignesh.newtech@gmail.com	919095943458
77th Batch	Sritha Ikkurthy	ikkurthys@gmail.com	919945290736
77th Batch	Vamsi Suraiah	vamsisuraiah284@gmail.com	918885105501
77th Batch	Ramesh	kayiramesh21@gmail.com	919008108165
77th Batch	Pradeep	pradeeplpatil26@gmail.com	919964344750
77th Batch	Purnima	sampadask028@gmail.com	916360226292
77th Batch	Sridhar	sridher.ch2129@gmail.com	9392713925
77th Batch	R Piyush	rpiyush@gmail.com	12482249990
77th Batch	Srnivas Gangula	s.gangala91@gmail.com	9182406181
77th Batch	Sudhas Ruban	sadhasruban.p@gmail.com	9443161898
77th Batch	Srinivas N	nsrinivas106@gmail.com	98859 42030
`;

const envPath = path.join(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEquals = trimmed.indexOf('=');
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const val = trimmed.substring(firstEquals + 1).trim().replace(/^['"]|['"]$/g, '');
    envVars[key] = val;
  });
}

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanEmail(e) {
  if (!e) return '';
  return e.trim().toLowerCase();
}

function getLast10Digits(p) {
  if (!p) return '';
  const digits = p.replace(/[^0-9]/g, '');
  return digits.substring(Math.max(0, digits.length - 10));
}

async function run() {
  try {
    const manualLeads = [];
    rawManualData.trim().split('\n').forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        manualLeads.push({
          batch: parts[0].trim(),
          name: parts[1].trim(),
          email: parts[2].trim(),
          phone: parts[3] ? parts[3].trim() : ''
        });
      }
    });

    const { data: config } = await supabase.from('configurations').select('*').eq('is_active', true).maybeSingle();
    const token = config.telecrm_api_token;
    const enterpriseId = config.telecrm_enterprise_id;

    // Search for ALL leads in CRM
    const testSearch = async (filters, limit = 100, skip = 0) => {
      const url = `https://next.telecrm.in/autoupdate/v2/enterprise/${enterpriseId}/lead/search?limit=${limit}&skip=${skip}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: filters })
      });
      return response.json();
    };

    console.log(`Searching TeleCRM for the 66 leads in the manual list...`);
    
    // We will query in chunks to avoid rate limit or payload limits, or we can just fetch all enrolled leads and match
    let enrolledLeads = [];
    for (let skip = 0; skip < 1000; skip += 100) {
      const res = await testSearch({ status: 'Enrolled' }, 100, skip);
      if (res.data && res.data.length > 0) {
        enrolledLeads.push(...res.data);
        if (res.data.length < 100) break;
      } else {
        break;
      }
    }

    console.log(`Loaded ${enrolledLeads.length} enrolled leads from TeleCRM.`);

    const report = [];
    manualLeads.forEach(m => {
      const match = enrolledLeads.find(t => 
        cleanEmail(t.fields?.email) === cleanEmail(m.email) ||
        (getLast10Digits(t.fields?.phone) && getLast10Digits(t.fields?.phone) === getLast10Digits(m.phone))
      );

      if (match) {
        report.push({
          manualName: m.name,
          manualEmail: m.email,
          crmName: match.fields?.name,
          crmEmail: match.fields?.email,
          crmCourse: match.fields?.course,
          crmStatus: match.status,
          crmEnrollmentDate: match.fields?.course_enrollment_date 
            ? new Date(match.fields.course_enrollment_date).toLocaleDateString('en-IN')
            : 'N/A',
          crmBatch: match.fields?.batch_number
        });
      } else {
        report.push({
          manualName: m.name,
          manualEmail: m.email,
          crmName: 'NOT FOUND IN ENROLLED',
          crmCourse: 'N/A',
          crmStatus: 'N/A',
          crmEnrollmentDate: 'N/A',
          crmBatch: 'N/A'
        });
      }
    });

    // Write report details
    console.log(`\nReconciliation of the 66 manual leads for 77th Batch:`);
    console.log(`=======================================================`);
    let countSCM = 0;
    let countOther = 0;
    let countNotFound = 0;

    report.forEach((r, idx) => {
      const isSCM = r.crmCourse && r.crmCourse.toLowerCase().includes('scm');
      if (r.crmStatus === 'N/A') {
        countNotFound++;
      } else if (isSCM) {
        countSCM++;
      } else {
        countOther++;
      }
      
      console.log(`[${idx+1}] Manual Name: ${r.manualName} -> CRM Name: ${r.crmName} | CRM Course: ${r.crmCourse} | CRM Batch: ${r.crmBatch} | Enroll Date: ${r.crmEnrollmentDate}`);
    });

    console.log(`\nReconciliation Summary:`);
    console.log(`- Total Manual Leads checked: ${manualLeads.length}`);
    console.log(`- Matched & marked as SCM in CRM: ${countSCM}`);
    console.log(`- Matched but marked as non-SCM in CRM (e.g. Financials): ${countOther}`);
    console.log(`- Not found under "Enrolled" status: ${countNotFound}`);

  } catch (err) {
    console.error(err);
  }
}

run();
