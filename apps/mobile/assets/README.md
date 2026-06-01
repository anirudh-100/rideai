# Mobile assets

Source SVGs for the RideAI brand. Expo and the app stores need **PNG**
exports of these at specific sizes — Expo's CLI generates everything from a
single 1024×1024 PNG, so the simplest workflow is:

## One-time generation (after you have a real logo)

If you have your own production logo, drop a **1024×1024 PNG** at:

- `assets/icon.png` — main app icon (no alpha, no rounded corners — stores reject those)
- `assets/adaptive-icon.png` — Android adaptive-icon foreground (transparent background, art within the inner 66% safe zone)
- `assets/splash.png` — splash screen art (centred on `#0A0A14` background)
- `assets/favicon.png` — small 48×48 PNG used by the web bundle

Then update `app.json` to reference them:

```json
"icon": "./assets/icon.png",
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0A0A14"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#0A0A14"
  }
},
"web": {
  "favicon": "./assets/favicon.png"
}
```

## Until then — converting the SVGs

The `.svg` files in this folder are placeholder brand artwork (deep indigo
background, white ✦ mark). To generate the PNG variants from them:

### Option A — online (fastest)

1. Open [cloudconvert.com/svg-to-png](https://cloudconvert.com/svg-to-png) (or any SVG→PNG converter)
2. Upload `icon.svg` · set output 1024×1024 · download as `icon.png`
3. Upload `adaptive-icon.svg` · set output 1024×1024 · download as `adaptive-icon.png`
4. Upload `splash.svg` · set output 2048×2048 · download as `splash.png`
5. Drop the PNGs in this folder, uncomment the references in `app.json` above.

### Option B — local CLI (one-shot)

```bash
npm install -g svgexport
cd apps/mobile/assets
svgexport icon.svg icon.png 1024:1024
svgexport adaptive-icon.svg adaptive-icon.png 1024:1024
svgexport splash.svg splash.png 2048:2048
svgexport icon.svg favicon.png 48:48
```

### Option C — design tool

Open the SVGs in Figma / Illustrator / Sketch / Affinity, replace the
placeholder ✦ with your actual logo, export at the sizes above.

## App-store rules to remember

- **iOS**: 1024×1024 PNG, no alpha channel, no rounded corners (Apple rounds them).
- **Android adaptive**: 1024×1024 PNG, foreground transparent, art inside inner 66%.
- **Google Play feature graphic** (for store listing): 1024×500 PNG/JPG.
- **App Store screenshots**: 1290×2796 (iPhone 15 Pro Max) — captured from a real build later.

These rules will trip up your first EAS submission if you skip them — get the PNGs right first.
