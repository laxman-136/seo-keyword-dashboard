# 🚀 Quick Start Guide - Vercel + Supabase Deployment

## 5-Minute Setup Overview

This dashboard is now configured for **Vercel** (hosting) + **Supabase** (database) + **GitHub** (version control).

**What you need:**
- ✅ GitHub account (free)
- ✅ Vercel account (free - login with GitHub)
- ✅ Supabase account (free - signup at https://supabase.com)

---

## Phase 1️⃣: Supabase Setup (5 minutes)

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click **"New Project"**
3. Choose any region (closest to users is best)
4. Set a strong database password
5. Wait 1-2 minutes for project to initialize

### 2. Get Your Credentials
In your Supabase Dashboard:
1. Click **Settings** → **API**
2. Copy these values:
   - **Project URL** → Save as `SUPABASE_URL`
   - **Anon Public Key** → Save as `SUPABASE_ANON_KEY`
   - **Service Role Secret** → Save as `SUPABASE_SERVICE_ROLE_KEY` (KEEP SECRET!)

### 3. Create Database Schema
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open the file `supabase-schema.sql` in this project
4. Copy all the SQL code
5. Paste it into Supabase SQL Editor
6. Click **Run** (green play button)
7. Verify in **Table Editor** → You should see `users` table

✅ **Database ready!**

---

## Phase 2️⃣: Local Development & Testing (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env.local`
```bash
# Copy the template
cp .env.local.example .env.local

# Edit .env.local and add:
SUPABASE_URL=<your-project-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Generate a strong JWT secret:
# On Windows (PowerShell):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add the output to .env.local as JWT_SECRET
JWT_SECRET=<generated-secret>
```

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 4. Test Login
- **Email:** `laxmansubramanyam@gmail.com`
- **Password:** `Admin@123`

### 5. Test Registration Workflow
1. Click **Register**
2. Create a test account
3. Go to `/admin` (login as superadmin)
4. Find the pending user and click **Approve**
5. Logout and login with the new account

✅ **Everything works locally!**

---

## Phase 3️⃣: GitHub Setup (3 minutes)

### 1. Initialize Git Locally
```bash
git init
git add .
git commit -m "Initial commit: SEO Dashboard with Supabase"
```

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Name: `seo-keyword-dashboard`
3. Description: `SEO Keyword & Traffic Analytics Dashboard`
4. Choose **Public** (required for free Vercel)
5. Click **Create repository**
6. Copy the commands shown (like `git remote add origin ...`)

### 3. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-dashboard.git
git branch -M main
git push -u origin main
```

✅ **Code on GitHub!**

---

## Phase 4️⃣: Deploy to Vercel (2 minutes)

### 1. Import Project to Vercel
1. Go to https://vercel.com
2. Click **"New Project"**
3. Connect your GitHub account (if not already)
4. Search for `seo-keyword-dashboard`
5. Click **Import**

### 2. Add Environment Variables
In Vercel's "Environment Variables" section, add:

```
SUPABASE_URL = <your-supabase-url>
SUPABASE_ANON_KEY = <your-anon-key>
SUPABASE_SERVICE_ROLE_KEY = <your-service-role-key>
JWT_SECRET = <your-jwt-secret>
```

⚠️ **Important:** 
- `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET` are secrets - Vercel will encrypt them
- These same variables are in your `.env.local` for local dev

### 3. Deploy
1. Click the **"Deploy"** button
2. Wait 2-3 minutes
3. You'll get a live URL like: `https://seo-keyword-dashboard-xyz.vercel.app`

✅ **Your app is live!**

---

## Phase 5️⃣: Test Live Deployment (2 minutes)

### 1. Visit Your Live App
1. Go to the Vercel URL provided
2. Login with: `laxmansubramanyam@gmail.com` / `Admin@123`
3. Register a new test user
4. Go to `/admin` and approve it
5. Login with the new user

### 2. Verify Features
- ✅ Login works
- ✅ Registration works
- ✅ Admin approval workflow works
- ✅ Data persists in Supabase (check Supabase Table Editor)

✅ **You're live and ready to use!**

---

## 🔄 Workflow After Deployment

### Push Updates
```bash
# After making changes locally:
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys within 30 seconds!
```

### Add New Users (Admin)
1. Login to `/admin`
2. Wait for user to register
3. Click **Approve**
4. User can now login

### Manage Logins
All user accounts and passwords are stored in **Supabase PostgreSQL**
- Secure: Passwords hashed with PBKDF2-SHA512
- Scalable: No file system limits
- Persistent: Data survives deployments

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't login locally | Check `.env.local` has Supabase credentials |
| Users can't register | Verify `users` table exists in Supabase |
| 500 error on /admin | Check `SUPABASE_SERVICE_ROLE_KEY` is set |
| Vercel deploy fails | Check all env vars are set correctly |
| "Database not configured" | Verify credentials on Vercel Environment Variables |

---

## 📚 Full Documentation

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup steps and troubleshooting.

---

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] `.env.local` configured
- [ ] Local dev server runs (`npm run dev`)
- [ ] Can login with admin account
- [ ] User registration workflow tested
- [ ] GitHub repo created & pushed
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] Live app deployed and tested
- [ ] Can login from live URL

**All done? 🎊 Your dashboard is ready for the world!**
