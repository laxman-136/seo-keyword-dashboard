const http = require('http');

const data = JSON.stringify({
  email: 'laxmansubramanyam@gmail.com',
  password: 'Admin@2024!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Sending POST to http://localhost:3000/api/auth/login...');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('\n--- Body (first 1000 chars) ---');
    console.log(body.slice(0, 1000));
    console.log('------------------------------');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
