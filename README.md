# FinTrack ??

> **Mobile-first Personal Finance & Credit Card Installment Manager**
> Built as a Progressive Web App (PWA) — installable on iPhone via Safari.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)](https://vitejs.dev)

---

## ? Features (Implemented)

| Feature | Status |
|---|---|
| Dashboard with current balance, monthly expenses, card due | ? Done |
| Smart "Safe to Spend" forecasting engine | ? Done |
| Bottom tab navigation (Home / Transactions / Cards / Settings) | ? Done |
| iOS safe-area insets + `viewport-fit=cover` | ? Done |
| PWA manifest + Workbox service worker | ? Done |
| Light-mode modern UI (Tailwind CSS) | ? Done |
| Supabase schema with Row Level Security (RLS) | ? Done |
| Transaction list with filter & search | ? Done |
| Credit card visual tiles + installment progress bars | ? Done |
| Settings: update monthly income & liquid cash | ? Done |

---

## ?? What Still Needs to Be Done

### ?? High Priority (Core Functionality)

- [ ] **Authentication UI** — Sign-up / Sign-in screen (Email + Password or Google OAuth via Supabase Auth)
- [ ] **Add Transaction Modal** — Form to create income/expense entries (tap the `+` button in Transactions)
- [ ] **Add Credit Card Modal** — Form to add a new card (card name, bank, statement day, due day, color picker)
- [ ] **Add Installment Modal** — Form to record a new installment under a specific card (linked to `credit_card_id`)
- [ ] **Edit / Delete Transaction** — Swipe-to-delete or edit modal for existing entries
- [ ] **Update Liquid Cash** — Quick-edit widget on Dashboard to update `profiles.liquid_cash` without going to Settings

### ?? Medium Priority (UX Improvements)

- [ ] **Date Picker** — Replace plain date input with a mobile-friendly date picker for transactions
- [ ] **Category Icon Map** — Display proper SVG/Lucide icons instead of emoji per category
- [ ] **Monthly Navigation** — Let users scroll back to previous months on the Transactions page
- [ ] **Installment "Mark as Paid"** — Button on each installment card to increment `paid_months` by 1
- [ ] **Card Color Picker** — Visual swatch grid when adding/editing a credit card
- [ ] **Empty States** — Better illustrated empty states for Cards and Transactions pages
- [ ] **Pull-to-Refresh** — Touch gesture on mobile to trigger data refresh
- [ ] **Toast Notifications** — Feedback on successful create/delete/update actions
- [ ] **Loading Skeleton Polish** — Match skeleton shape to actual card layout

### ?? Low Priority (Polish & Extras)

- [ ] **Bill Reminder Notifications** — Push notification when a card due date is approaching (Web Push API + Supabase Edge Function)
- [ ] **Monthly Comparison Chart** — Bar chart (Recharts or Chart.js) for income vs expense trends
- [ ] **Export to CSV** — Let users download their transactions as a spreadsheet
- [ ] **Multiple Currencies** — Currency selector in Settings (currently hardcoded to THB)
- [ ] **Biometric Lock** — Lock the app with Face ID / Touch ID via the Web Authentication API
- [ ] **Dark Mode Toggle** — System-aware dark/light mode switch in Settings
- [ ] **Onboarding Flow** — Welcome screen for new users to set income, cash balance, and first card
- [ ] **Unit Tests** — Vitest + React Testing Library coverage for hooks and utility functions
- [ ] **E2E Tests** — Playwright test suite for critical flows (auth, add transaction, forecast)

---

## ??? Project Structure

```
FinTrack/
+-- public/
¦   +-- manifest.json              # PWA manifest (icons, theme, display mode)
+-- supabase/
¦   +-- schema.sql                 # Full PostgreSQL schema + RLS policies
+-- src/
¦   +-- types/
¦   ¦   +-- index.ts               # All TypeScript domain types & enums
¦   +-- lib/
¦   ¦   +-- supabase.ts            # Supabase client singleton
¦   ¦   +-- utils.ts               # formatCurrency, date helpers, clsx
¦   +-- hooks/
¦   ¦   +-- useProfile.ts          # Logged-in user profile CRUD
¦   ¦   +-- useTransactions.ts     # Transaction CRUD + monthly totals
¦   ¦   +-- useCreditCards.ts      # Credit card CRUD (soft-delete)
¦   ¦   +-- useInstallments.ts     # Installment CRUD + markPaid
¦   ¦   +-- useForecasting.ts      # "Safe to Spend" calculation (pure)
¦   +-- components/
¦   ¦   +-- layout/
¦   ¦   ¦   +-- Layout.tsx         # Root wrapper — safe-area, bg, min-h-screen
¦   ¦   ¦   +-- Header.tsx         # Sticky iOS-style page header
¦   ¦   ¦   +-- BottomNav.tsx      # Fixed 4-tab bottom navigation bar
¦   ¦   +-- ui/
¦   ¦       +-- Card.tsx           # Card + StatCard reusable primitives
¦   ¦       +-- Badge.tsx          # Semantic color badges (income/expense/info…)
¦   ¦       +-- Button.tsx         # Button with size & variant system
¦   +-- pages/
¦   ¦   +-- Dashboard.tsx          # Home: balance hero, stats, forecast, recent txns
¦   ¦   +-- Transactions.tsx       # Filterable + searchable transaction list
¦   ¦   +-- Cards.tsx              # Credit card tiles + installment progress
¦   ¦   +-- Settings.tsx           # Profile edit, income/cash update, sign-out
¦   +-- App.tsx                    # React Router v6 route definitions
¦   +-- main.tsx                   # React 19 createRoot entry point
¦   +-- index.css                  # Tailwind directives + safe-area utilities
+-- index.html                     # viewport-fit=cover, apple-mobile-web-app meta
+-- vite.config.ts                 # Vite + vite-plugin-pwa config
+-- tailwind.config.js             # Custom surface/brand color tokens
+-- tsconfig.json
+-- package.json
```

---

## ??? Database Schema (Supabase PostgreSQL)

### Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | `id`, `display_name`, `currency`, `monthly_income`, `liquid_cash` | Auto-created on `auth.users` insert |
| `transactions` | `type` (income/expense), `category`, `amount`, `txn_date` | 13 category enum values |
| `credit_cards` | `card_name`, `bank`, `statement_day`, `due_day`, `color`, `last_four` | Soft-deleted via `is_active` |
| `installments` | `credit_card_id`, `monthly_amount`, `total_months`, `paid_months`, `start_date` | Tracks repayment progress |

### Views

| View | Purpose |
|---|---|
| `monthly_summary` | Income vs expense totals grouped by user and month |
| `active_installments_view` | Active installments joined with their card info |
| `upcoming_card_bills` | Per-card sum of installment charges due next cycle |

### Row Level Security

All four tables have RLS enabled. Every policy uses `auth.uid() = user_id` — users can only read and write their own rows.

---

## ?? Forecasting Engine

```
Safe to Spend =
  ( Liquid Cash + Expected Monthly Income )
  -
  ( This Month's Expenses + Total Active Installment Charges )
```

Implemented in `src/hooks/useForecasting.ts` — purely client-side, no extra DB calls.

---

## ?? Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/mootheera00-cmd/FinTrack.git
cd FinTrack

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
```

Edit `.env` and fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

```bash
# 4. Apply the database schema
#    Go to Supabase Dashboard ? SQL Editor ? paste supabase/schema.sql ? Run

# 5. Start the dev server
npm run dev
# ? http://localhost:5173
```

---

## ??? Supabase Setup (Step by Step)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Project Settings ? API** and copy:
   - **Project URL** ? `VITE_SUPABASE_URL`
   - **anon / public key** ? `VITE_SUPABASE_ANON_KEY`
3. Go to **SQL Editor** ? paste the full contents of `supabase/schema.sql` ? click **Run**
4. Go to **Authentication ? Providers** ? enable **Email** (and optionally **Google**)
5. Go to **Authentication ? URL Configuration** ? add `http://localhost:5173` to allowed redirect URLs

---

## ?? Deployment (Vercel)

```bash
# Verify build locally first
npm run build
```

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) ? **New Project** ? import the repo
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy** — PWA assets (manifest + service worker) are built automatically by `vite-plugin-pwa`
5. In Supabase ? **Authentication ? URL Configuration** ? add your Vercel production URL

---

## ?? Install as iPhone PWA

1. Open the deployed URL in **Safari** on iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down ? tap **"Add to Home Screen"**
4. Confirm — the app icon appears on your home screen
5. Launch it — runs in **standalone mode** (no browser chrome) with correct safe-area insets

---

## ??? Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript 5.3 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3.4 |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend / Database | Supabase (PostgreSQL + Auth + RLS) |
| PWA | vite-plugin-pwa + Workbox |
| Deployment | Vercel |

---

## ?? License

MIT — free to use, modify, and distribute.
