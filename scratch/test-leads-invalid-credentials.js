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
    
    // Pass invalid credentials
    const headers = { 
      'Cookie': cookie,
      'x-telecrm-api-token': 'invalid_token_test_123',
      'x-telecrm-enterprise-id': 'invalid_id_test_456'
    };

    console.log('\n2. Testing /api/leads with invalid credentials...');
    const resMain = await getJSON('/api/leads?from=2026-05-31&to=2026-06-06&refresh=true', headers);
    console.log(`Status: ${resMain.statusCode}`);
    console.log(`Body: ${resMain.body}`);

    console.log('\n3. Testing /api/leads/courses with invalid credentials...');
    const resCourses = await getJSON('/api/leads/courses?from=2026-05-31&to=2026-06-06&refresh=true', headers);
    console.log(`Status: ${resCourses.statusCode}`);
    console.log(`Body: ${resCourses.body}`);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
