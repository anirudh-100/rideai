# RideAI — Beta Deployment Runbook

End-to-end checklist for going from local dev → live beta-testable app.
Follow top-to-bottom. Each step has a "you" action (account creation, credentials)
and a "me" action (code wiring).

---

## 1 · Hosted database & auth — Supabase

**You:**

1. [Sign up at supabase.com](https://supabase.com), click **New project**.
2. Org: personal · Name: `rideai-prod` · Region: **ap-south-1 (Mumbai)** · Plan: Free.
3. Set a **strong database password** — save it in a password manager.
4. Wait ~2 minutes for provisioning.
5. From Project Settings → grab these and send them to me:
   - **Project URL** (`https://xxxxx.supabase.co`) — Settings → API → Project URL
   - **anon (public) key** — Settings → API
   - **service_role key** — Settings → API (server-only, never expose in client)
   - **Connection string** — Settings → Database → Connection String → **URI** (use the *Transaction* pooler on port 6543 for serverless; *Session* pooler on 5432 for long-lived backends)

**Me, after you provide credentials:**

- Add to `.env`:
  ```
  DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  ```
- Run `npm run db:migrate` to push the Prisma schema to Supabase.
- Run `npm run db:seed` to seed the demo coupons + demo-user.
- Verify in Supabase Studio (Table Editor) that the 7 tables exist.

---

## 2 · Hosted backend — Render

**You:**

1. [Sign up at render.com](https://render.com) — pick "Sign up with GitHub" so deploys auto-connect to your repo.
2. After pushing the repo to GitHub (step 3 below), go to Render → **New +** → **Blueprint** → select the `zygoai` repo. Render reads `render.yaml` and provisions the backend.
3. In the Render dashboard for `rideai-backend`, click **Environment** and paste these:
   - `DATABASE_URL` — from Supabase step
   - `ANTHROPIC_API_KEY` — your Claude key
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — from Supabase
   - `ALLOWED_ORIGINS` — leave blank for now, add Vercel URL after step 4
   - `GOOGLE_MAPS_API_KEY` — optional, get from Google Cloud Console → APIs & Services → Credentials
4. First deploy starts automatically. Watch the logs — should see `🚀 RideAI backend listening on http://localhost:10000` and `Build succeeded`.
5. Your live backend URL appears at the top: `https://rideai-backend.onrender.com`.

**Test it:**
```bash
curl https://rideai-backend.onrender.com/health
# → {"ok":true}
curl https://rideai-backend.onrender.com/ready
# → {"ok":true,"db":"up"}
```

> ⚠️ Free Render plan **sleeps after 15 min idle** and takes ~30s to wake. Fine for beta; upgrade to Starter ($7/mo) when you need always-on.

---

## 3 · GitHub repo

**You:** [Create a new GitHub repo](https://github.com/new) named `rideai` (private). **Don't** initialize with README/gitignore (we already have them).

**Me:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/rideai.git
git branch -M main
git push -u origin main
```

---

## 4 · Hosted web/admin — Vercel

**You:** [Sign up at vercel.com](https://vercel.com) with GitHub.

**Me, for each of `apps/web` and `apps/admin`:**

1. Vercel dashboard → **Add New Project** → import the GitHub repo.
2. **Root Directory:** `apps/web` (or `apps/admin`).
3. Build settings auto-detected from `vercel.json`.
4. Environment Variables: add what each app needs (NEXT_PUBLIC_API_URL, Supabase keys).
5. Deploy. URLs come back as `https://rideai.vercel.app` and `https://rideai-admin.vercel.app`.
6. **Back in Render:** set `ALLOWED_ORIGINS=https://rideai.vercel.app,https://rideai-admin.vercel.app`. Redeploy backend (auto-triggers on env change).

---

## 5 · Supabase Auth — phone OTP signup

**You:**

- Supabase Dashboard → **Authentication** → **Providers** → enable **Phone** (uses Twilio under the hood; Supabase has a built-in messaging credit for testing).
- For production phone OTP at scale, you'll need a Twilio account; for beta, Supabase's built-in is enough.

**Me:**

- Mobile app: add signup screen using `@supabase/supabase-js` `signInWithOtp({ phone })`.
- Backend: middleware to verify Supabase JWT on protected routes (Bookings, Profile).
- Replace hardcoded `session.userId = 'demo-user'` with the authenticated user's Supabase UUID.

---

## 6 · Error tracking — Sentry

**You:** [Sign up at sentry.io](https://sentry.io), create two projects:
- `rideai-backend` (Node)
- `rideai-mobile` (React Native)

Send me the two DSN URLs.

**Me:**
- Backend: `Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV })` + Hono middleware.
- Mobile: `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })` in `app/_layout.tsx`.

---

## 7 · App icons + splash

**You:** Send me a 1024×1024 PNG of the RideAI logo (or I can generate a placeholder).

**Me:**
- Generate iOS + Android + favicon + splash variants with `npx expo-cli generate:icon` (or `expo-asset` tooling).
- Place in `apps/mobile/assets/`.
- Reference in `app.json`.

---

## 8 · Privacy Policy + Terms of Service

**Me:** Generate Vercel-hosted templates at:
- `https://rideai.vercel.app/privacy`
- `https://rideai.vercel.app/terms`

These are required for app store submissions.

---

## 9 · Mobile builds — Expo EAS

**You:**

1. `npm install -g eas-cli` then `eas login` (uses your Expo account).
2. **Apple Developer enrollment:** [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) — start now, takes 24–48 hrs to verify. $99/yr. Send me your **Apple ID email** + **Apple Team ID** (from developer.apple.com → Membership) when ready.
3. **Google Play Console:** [play.google.com/console/signup](https://play.google.com/console/signup) — $25 one-time. Verification can take a day.

**Me:**
- `apps/mobile/eas.json` with `internal`, `preview`, `production` build profiles.
- `eas build --platform ios --profile preview` produces a `.ipa` you can install on testers' iPhones via TestFlight.
- `eas build --platform android --profile preview` produces an `.apk` for Android Internal Testing.

---

## 10 · Distribute beta

**Me:**
- `eas submit --platform ios` → uploads to App Store Connect → enable for TestFlight.
- `eas submit --platform android --track internal` → uploads to Google Play Console Internal Testing.

**You:**
- TestFlight: invite testers by email; they get a link to install via the TestFlight app.
- Android Internal Testing: share the opt-in URL; testers click and install via Google Play.

---

## Live monitoring during beta

- **Logs:** Render dashboard → `rideai-backend` → Logs tab (live tail).
- **Errors:** Sentry dashboard.
- **DB queries:** Supabase Dashboard → Logs → Postgres.
- **API uptime:** [UptimeRobot](https://uptimerobot.com) free monitor on `/health`.

---

## What this DOES vs DOESN'T cover

✅ Real users can sign up, make queries, see ranked options, "book" (deep-link out).
✅ Beta testers on iOS, Android, and web all hit the same backend.
✅ Bookings persist per-user.
✅ Coupons auto-apply per user's eligibility.

❌ Real platform pricing — still using the mock fare model. Replace with Uber/Ola/Rapido APIs (requires partnerships) or keep mock with clear "estimated" labelling.
❌ Actual ride booking — we deep-link to the platforms; they handle the booking.
❌ Razorpay payments — currently a no-op; wire if you want to charge for premium features.
