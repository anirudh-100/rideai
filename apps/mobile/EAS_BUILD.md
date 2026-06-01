# EAS Build cheatsheet

End-to-end commands for building + submitting the RideAI mobile app via Expo
Application Services (EAS). Read [DEPLOY.md](../../DEPLOY.md) for the wider
context first.

## One-time setup

```bash
# 1. Install + login
npm install -g eas-cli
eas login              # use your Expo account credentials

# 2. Link this app to your Expo project (creates app on expo.dev)
cd apps/mobile
eas init               # picks a project ID, writes it back to app.json
```

After `eas init`, an `extra.eas.projectId` UUID lands in `app.json` — commit it.

## Generate the icon PNGs first

EAS will refuse to build until `assets/icon.png`, `splash.png` and
`adaptive-icon.png` exist. Follow [assets/README.md](assets/README.md) to
convert the placeholder SVGs (or replace with your real brand artwork).

## Pre-flight checks

```bash
# Surface every config issue EAS would hit during a build
npx expo-doctor

# Check the .env vars used at build time are set
cat .env  # confirm EXPO_PUBLIC_API_URL, SUPABASE_URL, SUPABASE_ANON_KEY are real
```

## Build profiles (defined in eas.json)

| Profile | Distribution | iOS | Android | Use when |
|---|---|---|---|---|
| `development` | internal | simulator | dev client | Local dev with native modules; rarely needed for this app |
| `preview` | internal | real device IPA | APK (sideloadable) | TestFlight + Google Play Internal Testing |
| `production` | store | App Store | AAB | Public release |

## Build commands

### iOS preview (TestFlight)

```bash
eas build --platform ios --profile preview --non-interactive
```

First run will ask:
- Apple ID + password (uses 2FA — keep your phone close)
- "Generate a new Apple Distribution Certificate?" → **yes**
- "Generate a new Provisioning Profile?" → **yes** (links to your `com.rideai.app` bundle ID)

Build runs on EAS servers (~10–20 min). When done, you get a `.ipa` URL.

### Android preview (APK for Internal Testing)

```bash
eas build --platform android --profile preview --non-interactive
```

First run will ask:
- "Generate a new Android Keystore?" → **yes** (EAS stores it for you)

Build produces a `.apk` URL — direct-share for sideloading or upload to Play Console Internal Testing.

### Build BOTH platforms in parallel

```bash
eas build --platform all --profile preview --non-interactive
```

## Submit commands

### iOS → TestFlight

Fill in your Apple credentials in `eas.json` first under `submit.production.ios`:

```jsonc
"appleId": "you@example.com",
"ascAppId": "1234567890",      // App Store Connect app ID
"appleTeamId": "ABC123DEFG"    // from developer.apple.com → Membership
```

Then:

```bash
eas submit --platform ios --profile production --latest
```

This uploads the latest production build to App Store Connect → TestFlight.
First submit creates the app in App Store Connect (needs name, SKU, primary
language — answer the prompts).

### Android → Internal Testing

You need a Google Cloud service account JSON for automated submits:

1. [console.cloud.google.com](https://console.cloud.google.com) → create project (or reuse)
2. APIs & Services → Library → enable **Google Play Android Developer API**
3. IAM & Admin → Service Accounts → New → grant **Service Account User** role
4. Keys → Add Key → JSON → download → save as `apps/mobile/google-play-service-account.json` (gitignored — add to `.gitignore`)
5. Google Play Console → Setup → API access → link the service account, grant **Release manager** role

Then:

```bash
eas submit --platform android --profile production --latest
```

Track is `internal` per `eas.json` — testers added via Play Console opt-in URL.

## Updating env vars in a build profile

The `EXPO_PUBLIC_*` vars in `eas.json` are baked into the JS bundle at
build time. When you change the Render backend URL or Supabase keys:

1. Edit `eas.json` → corresponding profile's `env` block
2. Trigger a new build — old TestFlight builds will keep pointing at the old URL

For non-public vars (Sentry DSN, etc.) you can put them in EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://..." --type string
```

## OTA updates (no rebuild needed)

For JS-only changes (UI tweaks, copy edits) you can push an OTA update without
a new app-store build:

```bash
eas update --branch preview --message "Fix profile crash"
```

Users get it on next app launch. Native changes (new npm modules with native
code) still require a full rebuild.

## When something breaks

```bash
# See recent builds + their status
eas build:list

# View the full build log
eas build:view <build-id>

# Cancel a stuck build
eas build:cancel
```

Most first-build failures are:
- Missing icon PNGs → fix in `assets/`
- Wrong bundle ID vs Apple cert → reset cert (`eas credentials`)
- Out-of-sync dependencies → `rm -rf node_modules && npm install` at repo root
