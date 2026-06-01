# RideAI — Project Context for Claude / AI agents

RideAI is an **AI-powered aggregator for India** that compares **rides** (Ola,
Uber, Rapido), **food delivery** (Zomato, Swiggy) and **quick commerce** (Zepto,
Blinkit) behind a single natural-language interface. The user types a prompt
("I want to go from Rajiv Chowk to India Gate"), and the app parses intent,
fetches comparable prices, auto-applies the best coupon the user is eligible for,
and deep-links into the cheapest platform.

## Tech stack (authoritative)

| Concern        | Choice                                                            |
| -------------- | ----------------------------------------------------------------- |
| Monorepo       | Turborepo + **npm workspaces** (never yarn/pnpm)                  |
| Language       | **TypeScript only**, `strict: true`, no plain JS                  |
| Mobile         | React Native + Expo (SDK 51+), Expo Router, NativeWind            |
| Web / Admin    | Next.js 14 (App Router)                                           |
| Backend        | Node.js + **Hono** (never Express)                               |
| Database       | PostgreSQL (Supabase) + **Prisma**                               |
| Cache          | Redis via **ioredis**                                            |
| Job queue      | **BullMQ**                                                       |
| AI             | Claude API (`@anthropic-ai/sdk`), model `claude-sonnet-4-20250514`|
| Maps           | `@googlemaps/google-maps-services-js`                            |
| Payments       | Razorpay                                                          |
| Scraping       | Playwright + playwright-extra + stealth plugin                   |
| Auth           | Supabase Auth (`@supabase/supabase-js`)                          |
| Validation     | **Zod** everywhere at boundaries                                 |
| Testing        | **Vitest**                                                       |

## Folder structure

```
rideai/
  apps/
    mobile/     Expo Router app (5 screens + tab nav + services)
    web/        Next.js 14 landing page
    admin/      Next.js 14 internal dashboard
    backend/    Hono API + BullMQ jobs
  packages/
    ai-core/    Claude intent parser, ranker, coupon picker
    scrapers/   Playwright bots per platform + coupon scraper/validator
    db/         Prisma schema, migrations, seed, exported client
    shared/     enums, types, utils, constants (imported as @rideai/shared)
  infra/
    docker/     docker-compose.yml (Postgres + Redis)
```

## Imports & package names

Every package is published in the workspace as `@rideai/<name>`:
`@rideai/shared`, `@rideai/db`, `@rideai/ai-core`, `@rideai/scrapers`.
Library packages expose TypeScript **source** via `main: ./src/index.ts`, so the
backend (tsx), Next.js (`transpilePackages`) and Expo (Metro monorepo config) all
consume source directly — no separate build step needed for local dev.

## Build / run commands

```bash
npm install                 # install all workspaces
npm run db:generate         # prisma generate (run after install & schema edits)
npm run db:migrate          # prisma migrate dev
npm run db:seed             # seed sample users + coupons
npm run db:studio           # open Prisma Studio

npm run dev                 # turbo dev (all apps)
npm run build               # turbo build (^build ordering: db -> backend)
npm run test                # vitest across workspaces
npm run typecheck           # tsc --noEmit across workspaces

# Per app
cd apps/backend && npm run dev      # Hono on :3000
cd apps/mobile  && npx expo start   # Expo dev server / QR
docker compose -f infra/docker/docker-compose.yml up -d   # Postgres + Redis
```

## Code conventions

- **TypeScript strict**; no `any` unless justified with a comment. Prefer `unknown`
  + Zod parsing at every external boundary (HTTP body, Claude output, scraper output).
- Shared domain types and enums live ONLY in `@rideai/shared`. Do not redefine them.
- Every exported function: explicit return type, `try/catch` around I/O, and
  thrown/returned errors must carry a meaningful message.
- AI calls go through `@rideai/ai-core`; never call the Anthropic SDK directly
  from apps. Intent parsing uses Claude **tool_use** to force structured output.
- HTTP handlers validate input with Zod and return typed JSON.
- Money is stored/handled in rupees as numbers; format for display only via
  `formatPrice` from `@rideai/shared`.

## Bot / scraper rules

- All scrapers use `playwright-extra` + `puppeteer-extra-plugin-stealth`.
- Insert **randomised 2000–4000 ms** human-like delays between actions (`humanDelay`).
- Rotate among 3 test accounts per platform via `*_TEST_ACCOUNT_{1,2,3}_*` env vars.
- Route through Bright Data residential proxies when `BRIGHT_DATA_*` is set.
- Scrapers are isolated in `@rideai/scrapers`; they return typed `PlatformPrice[]`
  / `CouponData[]` and never touch the DB directly (the backend persists results).
- ⚠️ **Legal note:** automated scraping and account rotation may violate the target
  platforms' Terms of Service and local law. The committed scrapers are structural
  stubs with `TODO` selectors. Before enabling against any real platform, confirm
  you have the legal right to do so (official API, partnership, or written consent).

## Caching & jobs

- Price cache key: `prices:{platform}:{from_lat},{from_lng}:{to_lat},{to_lng}`,
  TTL **180s**.
- `validateCoupons.job` runs every 6h; `scrapeCoupons.job` runs daily at 02:00.
- Queues are defined in `apps/backend/src/queues/index.ts`.

## Don'ts

- Don't add Express, yarn, or plain `.js` source files.
- Don't hardcode secrets — everything comes from `.env` (see `.env.example`).
- Don't duplicate enums/types outside `@rideai/shared`.
- Don't call scrapers from the request path synchronously without the Redis cache check.
