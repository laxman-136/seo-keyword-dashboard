// scratch/test-course-filter.js
const http = require('http');

function postJSON(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJSON(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Logging in to get session cookie...');
    const loginRes = await postJSON('/api/auth/login', {
      email: 'laxmansubramanyam@gmail.com',
      password: 'Admin@2024!'
    });

    console.log(`Login Status: ${loginRes.statusCode}`);
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies || cookies.length === 0) {
      throw new Error('No set-cookie header returned during login');
    }

    const cookie = cookies[0].split(';')[0];
    console.log(`Auth Cookie: ${cookie.slice(0, 30)}...`);

    const headers = { 'Cookie': cookie };

    console.log('\n2. Testing /api/leads without filter...');
    const resAll = await getJSON('/api/leads?from=2026-05-31&to=2026-06-06&refresh=true', headers);
    console.log(`Status: ${resAll.statusCode}`);
    const dataAll = JSON.parse(resAll.body);
    const totalAll = dataAll.kpi.totalLeads;
    console.log(`Total Leads (All Courses): ${totalAll}`);

    console.log('\n3. Testing /api/leads with filter: Oracle Fusion SCM...');
    const resSCM = await getJSON('/api/leads?from=2026-05-31&to=2026-06-06&course=Oracle%20Fusion%20SCM', headers);
    console.log(`Status: ${resSCM.statusCode}`);
    const dataSCM = JSON.parse(resSCM.body);
    const totalSCM = dataSCM.kpi.totalLeads;
    console.log(`Total Leads (SCM Course Group): ${totalSCM}`);

    if (totalSCM > totalAll) {
      throw new Error(`Assertion failed: SCM leads count (${totalSCM}) cannot exceed total leads count (${totalAll})`);
    }
    console.log('Assertion Passed: SCM leads count is <= Total leads count.');

    console.log('\n4. Testing /api/leads/courses with filter: Oracle Fusion SCM...');
    const resCourses = await getJSON('/api/leads/courses?from=2026-05-31&to=2026-06-06&course=Oracle%20Fusion%20SCM', headers);
    console.log(`Status: ${resCourses.statusCode}`);
    const coursesData = JSON.parse(resCourses.body);
    console.log('Course Breakdown Response:');
    coursesData.forEach(c => {
      console.log(`- ${c.courseName}: ${c.total} leads`);
      if (c.courseName !== 'Oracle Fusion SCM' && c.total > 0) {
        throw new Error(`Assertion failed: Found leads for another course group ${c.courseName} (${c.total}) when filtered by SCM!`);
      }
    });
    console.log('Assertion Passed: Only SCM course group contains leads.');

    console.log('\n5. Testing /api/leads/funnel with filter: Oracle Fusion SCM...');
    const resFunnel = await getJSON('/api/leads/funnel?from=2026-05-31&to=2026-06-06&course=Oracle%20Fusion%20SCM', headers);
    console.log(`Status: ${resFunnel.statusCode}`);
    const funnelData = JSON.parse(resFunnel.body);
    console.log(`Funnel Total Leads (SCM): ${funnelData.total}`);
    if (funnelData.total !== totalSCM) {
      throw new Error(`Assertion failed: Funnel total leads (${funnelData.total}) does not match general KPI total leads (${totalSCM})`);
    }
    console.log('Assertion Passed: Funnel total leads matches SCM leads count.');

    console.log('\n6. Testing /api/leads/pipeline-value with filter: Oracle Fusion SCM...');
    const resPipeline = await getJSON('/api/leads/pipeline-value?course=Oracle%20Fusion%20SCM', headers);
    console.log(`Status: ${resPipeline.statusCode}`);
    const pipelineData = JSON.parse(resPipeline.body);
    console.log(`Pipeline Theoretical Value (SCM): ${pipelineData.kpis?.totalPipelineValue}`);
    console.log(`Pipeline Realistic Expected Value (SCM): ${pipelineData.kpis?.realisticExpectedValue}`);

    console.log('\nAll course-wise filtering integration assertions passed successfully! ✅');
  } catch (err) {
    console.error('Test verification failed: ❌', err);
    process.exit(1);
  }
}

run();
