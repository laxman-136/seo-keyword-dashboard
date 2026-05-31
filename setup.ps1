# Quick Setup Script for SEO Dashboard with Supabase (Windows)

Write-Host "🚀 SEO Dashboard Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy env file
if (-not (Test-Path ".env.local")) {
  Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "✅ Created .env.local" -ForegroundColor Green
  Write-Host ""
  Write-Host "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials:" -ForegroundColor Red
  Write-Host "  1. Go to https://supabase.com and create a project" -ForegroundColor White
  Write-Host "  2. Copy Project URL → SUPABASE_URL" -ForegroundColor White
  Write-Host "  3. Copy Anon Key → SUPABASE_ANON_KEY" -ForegroundColor White
  Write-Host "  4. Copy Service Role Key → SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
  Write-Host "  5. Generate JWT_SECRET:" -ForegroundColor White
  Write-Host "     node -e ""console.log(require('crypto').randomBytes(32).toString('hex'))""" -ForegroundColor Gray
  Write-Host ""
  exit 1
}

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set up Supabase schema:" -ForegroundColor White
Write-Host "     - Go to https://supabase.com → Your Project → SQL Editor" -ForegroundColor Gray
Write-Host "     - Open supabase-schema.sql file" -ForegroundColor Gray
Write-Host "     - Copy and paste the SQL, then run it" -ForegroundColor Gray
Write-Host "  2. Start dev server: npm run dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000" -ForegroundColor White
Write-Host "  4. Login with:" -ForegroundColor White
Write-Host "     - Email: laxmansubramanyam@gmail.com" -ForegroundColor Gray
Write-Host "     - Password: Admin@123" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 See DEPLOYMENT_GUIDE.md for full setup instructions" -ForegroundColor Cyan
