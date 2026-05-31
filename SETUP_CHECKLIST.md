# 📋 COMPLETE SETUP CHECKLIST - Copy & Paste This!

Use this checklist to track your progress through the deployment.

---

## Phase 1: Supabase Setup ⚙️

### 1.1 Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Click "Start your project" → "Sign up"
- [ ] Create account (use email or GitHub)
- [ ] Verify email

### 1.2 Create Project
- [ ] Click "New Project"
- [ ] Choose organization (or create new one)
- [ ] Enter project name: `seo-keyword-dashboard`
- [ ] Choose region closest to users
- [ ] Set database password (save this!)
- [ ] Click "Create new project"
- [ ] ⏳ Wait 1-2 minutes for initialization

### 1.3 Get Credentials
In Supabase Dashboard:
- [ ] Click **Settings** → **API** (left sidebar)
- [ ] Copy "Project URL" → Save as `SUPABASE_URL`
  - Example: `https://abcd1234.supabase.co`
- [ ] Copy "Anon public key" → Save as `SUPABASE_ANON_KEY`
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Copy "Service role secret" → Save as `SUPABASE_SERVICE_ROLE_KEY`
  - ⚠️ KEEP THIS SECRET! Don't share or commit to git
- [ ] Generate JWT_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Copy output → Save as `JWT_SECRET`

### 1.4 Create Database Schema
- [ ] Go to Supabase Dashboard → **SQL Editor**
- [ ] Click **New Query**
- [ ] Open the file `supabase-schema.sql` in this project
- [ ] Copy ALL the SQL code
- [ ] Paste into Supabase SQL Editor
- [ ] Click the **▶️ Run** button (or Ctrl+Enter)
- [ ] ✅ Check Table Editor → `users` table should appear

---

## Phase 2: Local Development Setup 🛠️

### 2.1 Prepare Environment
- [ ] Open terminal in project directory
- [ ] Run: `npm install`
- [ ] Wait for dependencies to install
- [ ] ✅ Should complete without errors

### 2.2 Create Environment File
- [ ] Run: `cp .env.local.example .env.local`
- [ ] Open `.env.local` in editor
- [ ] Replace placeholders with your values:
  ```
  SUPABASE_URL=<your-supabase-url>
  SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
  JWT_SECRET=<your-generated-secret>
  ```
- [ ] Save `.env.local`
- [ ] ⚠️ Never commit this file (git will ignore it)

### 2.3 Start Development Server
- [ ] Run: `npm run dev`
- [ ] ✅ Should say: "compiled successfully" 
- [ ] Open browser: http://localhost:3000
- [ ] ✅ Dashboard loads (you'll be redirected to login)

### 2.4 Test Login (Admin Account)
- [ ] Email: `laxmansubramanyam@gmail.com`
- [ ] Password: `Admin@123`
- [ ] Click **Login**
- [ ] ✅ Should see dashboard

### 2.5 Test Registration Workflow
- [ ] Click **Logout**
- [ ] Click **Register**
- [ ] Fill form with test data:
  - Name: `Test User`
  - Email: `test@example.com`
  - Password: `TestPass123`
- [ ] Click **Register**
- [ ] ✅ Should show "pending approval" message

### 2.6 Test Admin Approval
- [ ] Login again: `laxmansubramanyam@gmail.com` / `Admin@123`
- [ ] Go to `/admin` (or click Admin in menu if shown)
- [ ] ✅ Should see test user with "Pending" status
- [ ] Click **Approve**
- [ ] ✅ Status changes to "Approved"
- [ ] Logout

### 2.7 Test New User Login
- [ ] Click **Login**
- [ ] Email: `test@example.com`
- [ ] Password: `TestPass123`
- [ ] Click **Login**
- [ ] ✅ Should successfully login!

---

## Phase 3: GitHub Setup 📦

### 3.1 Initialize Git Locally
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Initial commit: SEO Dashboard with Supabase"`
- [ ] ✅ Should show files added

### 3.2 Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Fill in:
  - [ ] Repository name: `seo-keyword-dashboard`
  - [ ] Description: `SEO Keyword & Traffic Analytics Dashboard`
  - [ ] Choose **Public** (required for free Vercel)
  - [ ] Leave other options unchecked
- [ ] Click **Create repository**
- [ ] ✅ You'll see commands to run

### 3.3 Connect Local to GitHub
Copy the commands from GitHub and run them:
```bash
git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-dashboard.git
git branch -M main
git push -u origin main
```
- [ ] Run all three commands above (with YOUR_USERNAME)
- [ ] ✅ Check GitHub website → should show your code

---

## Phase 4: Vercel Deployment 🚀

### 4.1 Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Click **Sign Up**
- [ ] Choose **Sign up with GitHub** (easiest)
- [ ] Authorize Vercel to access GitHub
- [ ] ✅ Account created

### 4.2 Import Project
- [ ] Click **Add New...** → **Project**
- [ ] Search for `seo-keyword-dashboard`
- [ ] Click to select it
- [ ] Click **Import**
- [ ] ✅ Vercel detects Next.js project

### 4.3 Add Environment Variables
In the "Configure Project" step:
- [ ] Click **Environment Variables**
- [ ] Add each variable (one by one):

  **Variable 1:**
  - [ ] Name: `SUPABASE_URL`
  - [ ] Value: `https://your-project.supabase.co` (from Supabase)
  - [ ] Click **Add**

  **Variable 2:**
  - [ ] Name: `SUPABASE_ANON_KEY`
  - [ ] Value: `eyJhbGciOi...` (your anon key)
  - [ ] Click **Add**

  **Variable 3:**
  - [ ] Name: `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] Value: `eyJhbGciOi...` (your service role key)
  - [ ] Click **Add**

  **Variable 4:**
  - [ ] Name: `JWT_SECRET`
  - [ ] Value: `<your-generated-secret>`
  - [ ] Click **Add**

- [ ] ✅ All 4 variables should be listed

### 4.4 Deploy
- [ ] Click the **Deploy** button
- [ ] ⏳ Wait 2-3 minutes for build
- [ ] ✅ Should show "Congratulations! Your site is live"
- [ ] Copy your live URL (like `https://seo-keyword-dashboard-xyz.vercel.app`)

---

## Phase 5: Test Live Deployment 🎉

### 5.1 Visit Your Live Site
- [ ] Open your Vercel URL in browser
- [ ] ✅ Dashboard loads

### 5.2 Test Login on Live Site
- [ ] Email: `laxmansubramanyam@gmail.com`
- [ ] Password: `Admin@123`
- [ ] Click **Login**
- [ ] ✅ Successfully logged in on live site!

### 5.3 Test Registration on Live
- [ ] Click **Logout**
- [ ] Click **Register**
- [ ] Create another test account (different email)
- [ ] Submit
- [ ] ✅ Shows "pending approval"

### 5.4 Approve from Live Admin
- [ ] Login as superadmin again
- [ ] Go to `/admin`
- [ ] Find the new pending user
- [ ] Click **Approve**
- [ ] ✅ Status updates in real-time

### 5.5 Verify Database Persistence
- [ ] Go to Supabase Dashboard → **Table Editor**
- [ ] Click `users` table
- [ ] ✅ Should see all registered users here
- [ ] Verify the test accounts from live site are here

---

## 🎊 YOU'RE DONE!

If all checkboxes above are checked, your setup is complete:

✅ **Local Dev Working**
- Users stored in Supabase
- Login/registration workflow tested
- Admin approval system working

✅ **Code on GitHub**
- Repository created
- All files pushed
- Ready for version control

✅ **Live on Vercel**
- Accessible from anywhere
- Auto-deploys on git push
- Database connected and working

✅ **Production Ready**
- Free tier covers up to 5000+ users
- Automatic backups enabled
- Secure password hashing
- Role-based access control

---

## 📚 Next Steps

### Share Your Dashboard
- Send your Vercel URL to users
- Users can register and request access
- You approve from `/admin`

### Make Changes
```bash
# After editing files locally:
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically redeploys in 30 seconds!
```

### Add More Admins
1. User registers on `/register`
2. You approve from `/admin`
3. You change their role to "admin"
4. They can now approve other users

### Documentation
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute overview
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed steps
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details

---

## ❓ Something Went Wrong?

### Check These First
1. **Can't login locally?**
   - Verify `.env.local` has correct Supabase URL
   - Check Supabase schema was imported (Table Editor)
   - Try: `npm install` then `npm run dev` again

2. **Vercel deploy failed?**
   - Check all 4 environment variables are set
   - No typos in variable names
   - Redeploy: Click "Redeploy" on Vercel dashboard

3. **Registration not working?**
   - Verify SUPABASE_SERVICE_ROLE_KEY is set (for API)
   - Check Supabase Table Editor → users table exists
   - Check browser console for errors

4. **Still stuck?**
   - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
   - Check Vercel logs: Deployments → Logs
   - Check browser DevTools: F12 → Console/Network tabs

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **GitHub Docs:** https://docs.github.com

---

**Last Updated:** May 31, 2026
**Status:** ✅ Production Ready
