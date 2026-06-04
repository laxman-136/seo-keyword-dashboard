// scripts/test-dev-server.js
const { spawn } = require('child_process');
const path = require('path');

const projectDir = path.join(__dirname, '..');

console.log('Starting dev server on port 3005...');
const child = spawn('npx', ['next', 'dev', '-p', '3005'], {
  cwd: projectDir,
  shell: true,
  env: { ...process.env, PORT: '3005' }
});

let serverOutput = '';
child.stdout.on('data', data => {
  const text = data.toString();
  serverOutput += text;
  console.log(`[Server STDOUT] ${text.trim()}`);
});

child.stderr.on('data', data => {
  const text = data.toString();
  serverOutput += text;
  console.error(`[Server STDERR] ${text.trim()}`);
});

// Wait 12 seconds for server to start and build, then make requests
setTimeout(async () => {
  console.log('\n--- Making requests ---');
  try {
    const resMe = await fetch('http://localhost:3005/api/auth/me');
    console.log('/api/auth/me Status:', resMe.status);
    const htmlMe = await resMe.text();
    console.log('/api/auth/me output:', htmlMe);
  } catch (err) {
    console.error('/api/auth/me failed:', err);
  }

  try {
    const resLogin = await fetch('http://localhost:3005/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'laxmansubramanyam@gmail.com', password: 'Admin@2024!' })
    });
    console.log('/api/auth/login Status:', resLogin.status);
    const htmlLogin = await resLogin.text();
    console.log('/api/auth/login output:', htmlLogin);
  } catch (err) {
    console.error('/api/auth/login failed:', err);
  }

  console.log('\nStopping dev server...');
  child.kill();
  process.exit(0);
}, 12000);
