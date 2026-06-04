// scripts/test-require-libs.js
// We'll test importing the TypeScript modules by registering ts-node or simply checking
// if we can compile them without errors.
const { execSync } = require('child_process');

console.log('Running typescript compilation check on route files...');
try {
  const meRouteResult = execSync('npx tsc --noEmit app/api/auth/me/route.ts app/api/auth/login/route.ts', { encoding: 'utf8' });
  console.log('TS Compilation Output:', meRouteResult || 'Clean compile!');
} catch (err) {
  console.error('TS Compilation Error:', err.stdout || err.message);
}
