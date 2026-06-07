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

    console.log('\n2. Testing /api/leads...');
    const resMain = await getJSON('/api/leads?from=2026-05-31&to=2026-06-06&refresh=true', { 'Cookie': cookie });
    console.log(`Leads main status: ${resMain.statusCode}`);

    console.log('\n3. Testing /api/leads/courses...');
    const resCourses = await getJSON('/api/leads/courses?from=2026-05-31&to=2026-06-06&refresh=true', { 'Cookie': cookie });
    console.log(`Leads courses status: ${resCourses.statusCode}`);

    console.log('\n4. Testing /api/leads/trend...');
    const resTrend = await getJSON('/api/leads/trend?months=6&refresh=true', { 'Cookie': cookie });
    console.log(`Leads trend status: ${resTrend.statusCode}`);

    console.log('\n--- Summary ---');
    console.log(`resMain OK: ${resMain.statusCode === 200}`);
    console.log(`resCourses OK: ${resCourses.statusCode === 200}`);
    console.log(`resTrend OK: ${resTrend.statusCode === 200}`);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
