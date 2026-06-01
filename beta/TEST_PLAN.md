# RideAI Beta — Test Plan

**For testers:** thanks for joining 🙏. Below are the things to try and what to report.
You don't need to do all of them — even one screenshot of something confusing is gold.

**Time commitment:** ~10 minutes of active testing, spread over the week.

---

## Setup (one-time, ~2 min)

1. Install via the TestFlight / Google Play link, or open the web URL on your phone's browser.
2. **Sign up with your real phone number.** You'll get a 6-digit SMS OTP. Enter it.
3. You should land on the home screen with a pulsing ✦ and a prompt input.

✅ **What to report at this stage:**
- Did OTP arrive within 30 seconds?
- Did the app feel premium/cheap/broken on first open? One word is fine.

---

## Test scenarios

### 🚗 Scenario 1: Ride comparison (the headline feature)

1. Tap the prompt input.
2. Type: **"I want to go from Rajiv Chowk to India Gate"** — exactly like that.
3. Tap **Compare now**.
4. Wait ~1-2 seconds. You should see 8-12 ranked options (Uber Moto, Uber Auto, Rapido Bike, Ola, etc.) sorted by price.
5. The cheapest option should have a pulsing **BEST DEAL** badge with a green halo.
6. Tap a non-cheapest option — bottom bar should update.
7. Tap **Book Now**.
8. Confirm price breakdown shows base fare + coupon discount + total.
9. Pick a payment method, tap **Confirm & Book**.
10. You should see an animated confetti burst, "Booking confirmed", and a new tab opens to the actual ride platform (Uber/Ola/Rapido).

✅ **What to report:**
- Were the prices believable? (Yes/No/Roughly)
- Did the coupon savings make sense?
- Did the booking flow feel fast or slow?
- Did anything visually jank, lag, or feel off?

### 🍕 Scenario 2: Food intent

1. Go back to home (tab bar → Home).
2. Type: **"Biryani under 250 rupees, deliver fast"**.
3. Tap Compare.
4. (Note: food platforms currently route to platform homepages — we're rolling out food/groceries comparison in v1.1. Just confirm the AI correctly understood "biryani", "<250", "fast".)

✅ **What to report:**
- Did the recommendation banner mention biryani / your budget?

### 🛒 Scenario 3: Quick commerce intent

1. Type: **"Milk eggs bread delivered now"**.
2. Should classify as Quick Commerce; items should be parsed.

✅ **What to report:** Same as above.

### 🗣️ Scenario 4: Free-form prompts (the real test)

Type whatever you'd actually say if a friend asked "where are you going?" — slang, abbreviations, multi-line, anything. Examples:
- "need to reach airport by 5pm cheap"
- "auto from HSR to Indiranagar"
- "samosa under 100"
- "groceries — 1L milk, dosa batter, atta"

✅ **What to report:** Any prompt RideAI got embarrassingly wrong. Screenshot it.

### 📋 Scenario 5: Bookings tab

1. Tap the **Bookings** tab.
2. The booking you made in Scenario 1 should appear at the top.
3. Pull down to refresh.

✅ **What to report:** Is the history layout clear? Anything missing you'd want to see?

### 👤 Scenario 6: Profile tab

1. Tap the **Profile** tab.
2. Tap the pencil icon → change your name → save. It should persist on reopen.
3. Tap **Platforms you use** → Edit → select 2-3 platforms → Continue.
4. Verify the chips on Profile reflect the change.
5. Tap **Log out**. You should land back at the login screen.
6. Log in again with the same phone — your name, city, bookings should all still be there.

✅ **What to report:** Anything that didn't persist as expected.

---

## Stress tests (optional, for the brave)

- **Bad network:** turn on Airplane mode, type a prompt, hit Compare. Does the app degrade gracefully or hang?
- **Old phone:** if you have a 3+ year old Android, does the home screen scroll smoothly?
- **Other language:** try a Hindi/Hinglish prompt — "Connaught Place se IGI Airport jaana hai".
- **Edge case:** very long prompt (>100 chars), very short prompt (one word), only numbers, only emoji.
- **Back button:** mash it. Anywhere weird crash?

---

## How to send feedback

**Three channels, in order of preference:**

### 1. Inside the app (easiest)
Profile tab → **Send feedback** → opens your email pre-filled with device info. Just type what happened and send.

### 2. WhatsApp / DM (fastest)
Send a screenshot + one line — that's enough. "Burger button didn't work" tells me 90% of what I need.

### 3. GitHub Issue (structured)
For confirmed bugs or feature requests: open an issue on the repo. Templates pre-fill the right fields.

---

## What we WON'T fix during beta

To stay focused, we're explicitly **not** scoping these in beta:
- Real platform pricing (currently estimated — labelled as such)
- Razorpay payments inside the app (you complete payment on the platform)
- Scheduled bookings (only "now" supported)
- Multiple saved addresses (only auto-pickup + free-text destination)
- Dark/light theme toggle (dark only for now)

If you find any of these are blocking for you, **that itself is feedback** — please tell us.

---

Thanks again for testing. Genuine ask: **be honest, especially when something feels cheap or broken**. That's the whole point.
