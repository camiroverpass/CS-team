# RoverPass CS Team Dashboard

Internal dashboard for the RoverPass Customer Success team. Next.js 14 (App Router), Tailwind, deployed on Vercel.

## Tabs

| Route | Page | Source |
|---|---|---|
| `/customer-success` | Zoho Desk support ticket analytics (KPIs, charts, open tickets) | Supabase + Zoho Desk (via `/api/metrics`) |
| `/onboarding` | Onboarding pipeline — active tickets, closed-won statuses, live listings trend | Zoho Desk (via `lib/zoho.ts`) |
| `/ptos` | Team PTO calendar | Google Sheet ([source](https://docs.google.com/spreadsheets/d/1Rq2YgaysqVKGs7O9nlh-jNclDV16eqptbfX6xgbDuig/edit?gid=808696531)) |
| `/wellness-score` | Customer wellness / health score | TBD — placeholder |

## Setup

```bash
npm install
cp .env.example .env.local   # fill in secrets
npm run dev                  # http://localhost:3000
```

## Environment variables

See `.env.example`. The app is gated by Basic Auth via `DASHBOARD_PASSWORD` (middleware in `middleware.js`).

## Deploy

The repo is set up for Vercel. The Customer Success dashboard runs a daily Zoho Desk sync via the cron in `vercel.json` (`/api/cron/sync` at 06:00 UTC).

## Structure

```
app/
  layout.js              Sidebar + body wrapper for every page
  page.js                Redirects to /customer-success
  customer-success/      CS dashboard (from paula-roverpass/CS-Team)
  onboarding/            Onboarding dashboard (from camiroverpass/dashboard-example)
  ptos/                  Google Sheet PTO viewer
  wellness-score/        Placeholder for wellness score
  components/
    Sidebar.js           Branded nav with 4 tabs
    Dashboard.js         CS support tickets
    DateRangePicker.js
    OnboardingDashboardView.tsx
  api/
    metrics/             Support tickets aggregate (from Supabase)
    cron/sync/           Daily Zoho → Supabase sync
    onboarding/debug/    Zoho Desk debug endpoints
lib/
  supabase.js
  zoho-desk.js           Lightweight Zoho Desk client for support tickets
  zoho.ts                Full Zoho Desk client used by onboarding
  sheets.js              Google Sheet CSV fetch + parser
supabase/schema.sql      Support tickets table schema
middleware.js            Basic-auth gate
vercel.json              Daily cron config
```
