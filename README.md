# SEO Keyword & Traffic Dashboard

A premium **SEO Keyword Rankings + Traffic Analytics dashboard** built with Next.js 14, powered by **Supabase PostgreSQL** for scalable user management and authentication.

## 🚀 Features

- 📊 **Keyword Rankings** — Track keyword positions across months with group summaries
- 📈 **Traffic Analytics** — Acquisition sources, country breakdown, trend charts
- 👥 **User Management** — Role-based access (superadmin/admin/user), registration workflow
- ✅ **Admin Approval System** — Users register → admins approve → login enabled
- 🔒 **Secure Authentication** — JWT tokens, PBKDF2-SHA512 password hashing
- 🌓 **Collapsible Sidebar** — Persistent collapse state via localStorage
- 📱 **Responsive** — All tables scroll on smaller screens

---

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [Lucide React Icons](https://lucide.dev/)
- [Supabase](https://supabase.com) PostgreSQL (User Database)

---

## 📋 Quick Start

### ⚡ New to this project? Start here:

1. **Read [READY_TO_DEPLOY.md](./READY_TO_DEPLOY.md)** — 5-minute overview (⭐ START HERE)
2. **Follow [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** — Step-by-step checklist (checkboxes included)
3. **Reference [QUICKSTART.md](./QUICKSTART.md)** — 15-minute setup guide

### For Technical Details:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — Comprehensive deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture & migration details

---

## 🔧 Local Development (Quick Setup)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/seo-keyword-dashboard.git
cd seo-keyword-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env.local` with Supabase credentials

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-strong-random-secret-here
```

**Don't have Supabase credentials?** See [SETUP_CHECKLIST.md - Phase 1](./SETUP_CHECKLIST.md)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the app

- **Login with:** `laxmansubramanyam@gmail.com` / `Admin@123`
- **Or register** a new account and request admin approval

---

## 🌐 Deploy to Vercel (Free - 2 minutes)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/seo-keyword-dashboard.git
   git push -u origin main
   ```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up free (use GitHub login)
2. Click **"Add New Project"** → Import your `seo-keyword-dashboard` repo
3. Under **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_DASHBOARD_PASSWORD` | `admin` (or any password you want) |
   | `GOOGLE_SHEETS_API_KEY` | Your API key (or leave empty for demo mode) |
   | `GOOGLE_SHEET_ID` | Your Sheet ID (or leave empty for demo mode) |
4. Click **Deploy** — Done! 🎉

Your app will be live at: `https://seo-keyword-dashboard.vercel.app` (or your custom domain)

---

## 📊 Google Sheets Setup

### Sheet Structure Required

Your Google Sheet needs **two tabs**:

#### Tab 1: `Keywords`
| Keyword | Group | Status | Priority | Notes | Jan-2026 Page | Jan-2026 Position | Feb-2026 Page | ... |
|---|---|---|---|---|---|---|---|---|

#### Tab 2: `Traffic`
| Month | Total Users | New Users | Organic | Direct | Paid Search | Social | Referral | Video | Cross Network | Display | Email | Unassigned | India | USA | UAE | ... |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

### Make Sheet Public
In Google Sheets: **Share → Anyone with the link → Viewer**

### Get API Key
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Google Sheets API**
3. Create an **API Key** under Credentials
4. Restrict it to "Google Sheets API" only

#### Tab 3: `Leads Monthly` (Required)
Defines the high-level monthly metrics.
Row 1 headers:
`Month | Total Leads | Website Leads | Organic Leads | SCM Leads | HCM Leads | Financials Leads | Tech OIC Leads | PPM Leads | SAP EBS Others Leads | Enrolled | High Potential | Medium Potential | Fresh Unqualified | Low Cold | Conv Rate`

#### Tab 4: `Leads Detail` (Optional, for Course and Channel split aggregates)
Defines the leads classification metrics split per course per month.
Row 1 headers:
`Month | Course Name | Enrolled | High Potential | Medium Potential | Fresh Unqualified | Low Cold | Total | Organic | Website`

> [!IMPORTANT]
> The `Leads Detail` sheet must contain ONLY aggregated counts per course and month. To preserve privacy and protect personal data, **do NOT include raw lead records, customer names, phone numbers, or email addresses**.

#### Tab 5: `Revenue Monthly` (Required)
Defines monthly financial aggregates, channel conversion metrics, and advertising investments.
Row 1 headers:
`Month | Total Conversions | Total Revenue | Avg Revenue Per Student | Organic Conversions | Organic Revenue | Website Conversions | Website Revenue | Referral Conversions | Referral Revenue | Google Ads Conversions | Google Ads Revenue | Meta Ads Conversions | Meta Ads Revenue | Direct Conversions | Direct Revenue | Total Ad Spend | Meta Ad Spend | Google Ad Spend | Paid Revenue | Overall ROAS`

#### Tab 6: `Revenue Courses` (Optional, for detailed course breakdowns and demos)
Defines financial results, batch, faculty, campaign details, and demo performance metrics.
Row 1 headers:
`Month | Course Name | Conversions | Revenue | Avg Fee | Revenue Share % | Meta Spend | Google Spend | Total Ad Spend | Google Ads Revenue | Meta Ads Revenue | Paid Revenue | ROAS | Organic Revenue | Website Revenue | Total Demo Attended | Demo Google | Demo Meta | Batch No | Faculty`

---


## 🔑 Multi-Company Setup

You can manage **multiple Google Sheet configs** directly from the dashboard UI:

1. Go to `/settings` (click "Data Sources" in the sidebar)
2. Add a config: company name + Sheet URL + API Key
3. Test the connection live
4. Click Activate to switch the entire dashboard to that company's data

No redeploy or code changes needed!

---

## 🔌 TeleCRM Live Sync Setup

The **Leads Report** is powered by a live, real-time sync with TeleCRM. You can configure it dynamically:
1. Go to `/settings` (click "Data Sources" in the sidebar)
2. Enter your **TeleCRM Enterprise ID** and **API Sync Token** under the "TeleCRM Live Sync Integration" section.
3. Save the configuration.

The leads dashboard will now fetch live lead counts, conversion funnels, channels, and courses directly from TeleCRM with a 15-minute caching layer. If no live data is found for a given month, it will gracefully fall back to your Google Sheets historical logs.


---

## 🔐 Changing the Password

Update `NEXT_PUBLIC_DASHBOARD_PASSWORD` in your Vercel environment variables → Redeploy.

---

## 📄 License

MIT — Free to use and modify.
