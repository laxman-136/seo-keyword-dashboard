# 🚀 Production Deployment Guide (Supabase + Vercel + GitHub)

## Prerequisites
- GitHub account (free)
- Vercel account (free - sign in with GitHub)
- Supabase account (free - https://supabase.com)

---

## Phase 1: Supabase Setup (5 mins)

### Step 1: Create Supabase Project
1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `seo-keyword-dashboard`
   - **Region**: Choose closest to you (e.g., US East, Europe)
   - **Password**: Strong password (save this!)
4. Wait for project to initialize (~2 mins)
5. Go to **Settings** → **API** tab → Copy:
   - `Project URL` → Save as `SUPABASE_URL`
   - `API Key` (anon public) → Save as `SUPABASE_ANON_KEY`

### Step 2: Create Database Schema
1. In Supabase, go to **SQL Editor** → **New Query**
2. Copy the SQL from `supabase-schema.sql` in this repo
3. Run the query
4. Verify tables created: Go to **Table Editor** → You should see `users` table

---

## Phase 2: Environment Setup (2 mins)

### Step 1: Create `.env.local`
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

### Step 2: Add Supabase Credentials
Edit `.env.local`:
```env
# Supabase
SUPABASE_URL=your-project-url-here
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Secret (strong random string)
JWT_SECRET=your-super-strong-random-jwt-secret-here

# Google Sheets (optional)
GOOGLE_SHEETS_API_KEY=your_api_key_here
```

**To get `SUPABASE_SERVICE_ROLE_KEY`:**
- Supabase Dashboard → Settings → API → Copy "Service role" key

---

## Phase 3: Local Testing (5 mins)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

### Step 3: Test Registration Flow
1. Go to `/register` → Register new user
2. In Supabase **Table Editor** → `users` table → See new user with `status: 'pending'`
3. Go to `/admin` (login as superadmin)
   - Email: `laxmansubramanyam@gmail.com`
   - Password: `Admin@123` (from data/users.json migrated)
4. Approve the pending user
5. Logout, try logging in as new user → Should work!

---

## Phase 4: GitHub Setup (3 mins)

### Step 1: Initialize Local Git
```bash
git init
git add .
git commit -m "Initial commit: SEO Dashboard with Supabase"
```

### Step 2: Create GitHub Repository
1. Go to **https://github.com/new**
2. Name: `seo-keyword-dashboard`
3. Description: `SEO Keyword & Traffic Analytics Dashboard`
4. **Public** (Vercel free tier works with public repos)
5. Click **Create repository**
6. Copy the commands shown (like `git remote add origin ...`)

### Step 3: Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-dashboard.git
git branch -M main
git push -u origin main
```

---

## Phase 5: Vercel Deployment (2 mins)

### Step 1: Connect Vercel to GitHub
1. Go to **https://vercel.com** → Sign in with GitHub
2. Click **"New Project"**
3. Search for `seo-keyword-dashboard` repository
4. Click **"Import"**

### Step 2: Configure Environment Variables
In Vercel's Environment Variables section, add:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-strong-jwt-secret
NEXT_PUBLIC_DASHBOARD_PASSWORD=(optional)
```

### Step 3: Deploy
1. Click **"Deploy"** → Wait 2-3 mins
2. You'll get a URL like: `https://seo-keyword-dashboard-xyz.vercel.app`

### Step 4: Test Live
1. Visit your Vercel URL
2. Register new user
3. Approve in admin panel
4. Login and see dashboard

---

## ✅ You're Live!

Your dashboard is now:
- ✅ Running on Vercel (CDN globally distributed)
- ✅ Using Supabase PostgreSQL (durable user data)
- ✅ Connected to GitHub (auto-deploy on push)
- ✅ Has full user registration workflow
- ✅ Role-based access control

---

## 🔧 Maintenance

### Add New Users Manually (SQL)
```sql
INSERT INTO users (email, name, password_hash, role, status, created_at)
VALUES ('user@example.com', 'User Name', 'hashed_password', 'user', 'approved', NOW());
```

### Reset User Password
```bash
node scripts/reset-password.js
```

### View Logs
- Vercel: Dashboard → Deployments → Logs
- Supabase: Logs → Postgres Logs

### Auto-Deploy on Push
```bash
git push origin main  # Vercel automatically builds and deploys
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "SUPABASE_URL not found" | Check `.env.local` / Vercel env vars |
| Users can't register | Check Supabase schema created correctly |
| Can't login | JWT_SECRET might not match between local/prod |
| 500 errors on /api/* | Check Supabase Service Role key is correct |

