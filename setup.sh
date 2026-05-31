#!/bin/bash
# Quick Setup Script for SEO Dashboard with Supabase

echo "🚀 SEO Dashboard Setup"
echo "====================="

# Step 1: Copy env file
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from template..."
  cp .env.local.example .env.local
  echo "✅ Created .env.local"
  echo ""
  echo "⚠️  IMPORTANT: Edit .env.local and add your Supabase credentials:"
  echo "  1. Go to https://supabase.com and create a project"
  echo "  2. Copy Project URL → SUPABASE_URL"
  echo "  3. Copy Anon Key → SUPABASE_ANON_KEY"
  echo "  4. Copy Service Role Key → SUPABASE_SERVICE_ROLE_KEY"
  echo "  5. Generate JWT_SECRET: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo ""
  exit 1
fi

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Set up Supabase schema: https://supabase.com → SQL Editor → Copy supabase-schema.sql"
echo "  2. Start dev server: npm run dev"
echo "  3. Open http://localhost:3000"
echo "  4. Login with:"
echo "     - Email: laxmansubramanyam@gmail.com"
echo "     - Password: Admin@123"
echo ""
echo "🔗 See DEPLOYMENT_GUIDE.md for full setup instructions"
