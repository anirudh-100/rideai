# RideAI 🛺🍔🛒

> AI-powered aggregator for India — compare **rides** (Ola, Uber, Rapido),
> **food** (Zomato, Swiggy) and **quick commerce** (Zepto, Blinkit) from one
> natural-language prompt. RideAI parses intent with Claude, compares live
> prices, auto-applies the best coupon you're eligible for, and deep-links you
> into the cheapest platform.

```
"I want to go from Rajiv Chowk to India Gate"
   → parse intent → fetch prices (Uber/Ola/Rapido) → pick best coupon → deep link
```

## Monorepo layout

```
rideai/
├── apps/
│   ├── mobile/    Expo Router app (onboarding, home, results, booking, profile)
│   ├── web/       Next.js 14 landing page
│   ├── admin/     Next.js 14 internal dashboard
│   └── backend/   Hono API + BullMQ jobs
├── packages/
│   ├── ai-core/   Claude intent parser, coupon picker, result ranker
│   ├── scrapers/  Playwright (stealth) bots + coupon scraper/validator
│   ├── db/        Prisma schema, seed, generated client (@rideai/db)
│   └── shared/    Enums, types, utils, constants (@rideai/shared)
└── infra/
    └── docker/    docker-compose.yml (Postgres + Redis)
```

## Prerequisites

- **Node.js ≥ 20** (tested on 24) and **npm ≥ 10**
- **Docker Desktop** (for local Postgres + Redis)
- API keys: Anthropic, Google Maps, Supabase, Razorpay (see `.env.example`)

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env          # then fill in the values

# 3. Start local infra (Postgres + Redis)
docker compose -f infra/docker/docker-compose.yml up -d

# 4. Database
npm run db:generate           # generate the Prisma client
npm run db:migrate            # create the schema
npm run db:seed               # seed sample users + coupons

# 5. Run everything (Turborepo)
npm run dev
```

### Run individual apps

```bash
cd apps/backend && npm run dev      # Hono API on http://localhost:3000
cd apps/mobile  && npx expo start   # Expo dev server (scan QR with Expo Go)
cd apps/web     && npm run dev       # landing page on http://localhost:3001
cd apps/admin   && npm run dev       # admin dashboard on http://localhost:3002
```

## Root scripts

| Script               | What it does                                |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | `turbo dev` — runs all apps                  |
| `npm run build`      | `turbo build` (db builds before backend)     |
| `npm run test`       | Vitest across all workspaces                 |
| `npm run typecheck`  | `tsc --noEmit` across all workspaces         |
| `npm run db:generate`| `prisma generate`                            |
| `npm run db:migrate` | `prisma migrate dev`                         |
| `npm run db:studio`  | open Prisma Studio                           |
| `npm run db:seed`    | seed the database                            |

## Backend API

| Method | Route                          | Purpose                                       |
| ------ | ------------------------------ | --------------------------------------------- |
| POST   | `/api/intent`                  | Parse a raw prompt → `IntentParseResult`      |
| POST   | `/api/prices`                  | Compare platform prices (Redis-cached 180s)   |
| POST   | `/api/coupons`                 | Rank coupons the user is eligible for         |
| POST   | `/api/bookings`                | Persist a booking + coupon usage              |
| GET    | `/api/users/:id/profile`       | Profile + platform history + eligibility flags|
| POST   | `/api/users/:id/onboarding`    | Save self-reported platforms                  |

## Background jobs (BullMQ)

- **validateCoupons** — every 6h, re-checks active coupons, updates DB + Redis.
- **scrapeCoupons** — daily at 02:00, scrapes new coupons into the DB.

## ⚠️ Scraping & legal note

The scrapers in `@rideai/scrapers` are **structural stubs** with `TODO` selectors
and stealth/delay/account-rotation scaffolding. Automated scraping, stealth
evasion and account rotation may violate the target platforms' Terms of Service
and applicable law. **Do not enable them against any real platform unless you have
the legal right to do so** (an official API, a partnership, or written consent).
Prefer official partner APIs in production.

## License

Private / proprietary — internal project scaffold.
