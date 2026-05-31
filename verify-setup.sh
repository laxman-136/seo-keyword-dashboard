#!/bin/bash
# Setup Verification Script - Verifies all components are configured correctly

echo "🔍 SEO Dashboard Setup Verification"
echo "===================================="
echo ""

errors=0

# Check 1: Node/npm installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not installed"
  echo "   → Install from https://nodejs.org"
  ((errors++))
else
  echo "✅ Node.js $(node -v)"
fi

# Check 2: .env.local exists
if [ -f .env.local ]; then
  echo "✅ .env.local exists"
else
  echo "❌ .env.local not found"
  echo "   → Run: cp .env.local.example .env.local"
  ((errors++))
fi

# Check 3: Supabase credentials
if [ -f .env.local ]; then
  if grep -q "SUPABASE_URL=" .env.local && ! grep -q "SUPABASE_URL=https://your-project" .env.local; then
    echo "✅ SUPABASE_URL configured"
  else
    echo "⚠️  SUPABASE_URL not configured"
    ((errors++))
  fi

  if grep -q "SUPABASE_ANON_KEY=" .env.local && ! grep -q "SUPABASE_ANON_KEY=eyJ" .env.local; then
    echo "✅ SUPABASE_ANON_KEY configured"
  else
    echo "⚠️  SUPABASE_ANON_KEY not configured"
    ((errors++))
  fi

  if grep -q "JWT_SECRET=" .env.local; then
    echo "✅ JWT_SECRET configured"
  else
    echo "⚠️  JWT_SECRET not configured"
    ((errors++))
  fi
fi

# Check 4: Dependencies
if [ -d node_modules ]; then
  echo "✅ Dependencies installed"
else
  echo "⚠️  Dependencies not installed"
  echo "   → Run: npm install"
fi

# Check 5: Git initialized
if [ -d .git ]; then
  echo "✅ Git repository initialized"
else
  echo "⚠️  Git not initialized"
  echo "   → Run: git init"
fi

# Check 6: Supabase schema
echo ""
echo "📋 Configuration Files:"
if [ -f supabase-schema.sql ]; then
  echo "✅ supabase-schema.sql (ready to import)"
else
  echo "❌ supabase-schema.sql not found"
fi

if [ -f QUICKSTART.md ]; then
  echo "✅ QUICKSTART.md (setup guide)"
fi

if [ -f DEPLOYMENT_GUIDE.md ]; then
  echo "✅ DEPLOYMENT_GUIDE.md (detailed guide)"
fi

if [ -f ARCHITECTURE.md ]; then
  echo "✅ ARCHITECTURE.md (technical details)"
fi

# Summary
echo ""
echo "===================================="
if [ $errors -eq 0 ]; then
  echo "✅ All checks passed! Ready to develop"
  echo ""
  echo "Next: npm run dev"
else
  echo "⚠️  $errors issues found"
  echo ""
  echo "Fix the issues above and run this script again"
fi
