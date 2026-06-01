# RideAI Beta Launch Kit

Everything you need to invite, onboard, and collect feedback from beta testers.

| File | When to use it |
|---|---|
| [INVITE_TEMPLATES.md](INVITE_TEMPLATES.md) | Send to potential testers — multi-channel (WhatsApp, email, LinkedIn, SMS) |
| [WELCOME_EMAIL.html](WELCOME_EMAIL.html) | Auto-send when a tester is added to TestFlight / Internal Testing |
| [TEST_PLAN.md](TEST_PLAN.md) | Share with each tester — what to try, what to report |
| [FEEDBACK_FORM.md](FEEDBACK_FORM.md) | Copy questions into a Google Form for structured collection |
| [`.github/ISSUE_TEMPLATE/`](../.github/ISSUE_TEMPLATE/) | Auto-applied when testers file issues on GitHub |

## Recommended beta sequence

1. **Pre-launch (day 0):** Send `INVITE_TEMPLATES.md` → "Beta announcement" version to your warm circle (15-30 people). Goal: 5-15 commit to test.
2. **Onboarding (day 1):** When each tester confirms, add them to:
   - TestFlight: `App Store Connect → TestFlight → External Testers → invite by email`
   - Google Play Internal Testing: add their Gmail to your internal testers list
   - Web preview: just send them the URL
3. **Welcome (day 1, automated by TestFlight/Play):** Apple/Google auto-send install instructions. Follow up with `WELCOME_EMAIL.html` ~30 min later — warmer, more human.
4. **Active testing (days 2-10):** Each tester gets `TEST_PLAN.md`. Set up a private WhatsApp group or Slack channel for live questions.
5. **Feedback collection (continuous):**
   - **In-app:** "Send feedback" button in Profile tab opens email pre-filled with debug info.
   - **Structured:** Google Form (built from `FEEDBACK_FORM.md`) — send link on day 3 and day 8.
   - **Bug reports:** GitHub Issues (templates pre-fill required fields).
6. **Beta wrap (day 14):** Thank-you message + quick 5-question survey + ask for app-store-ready testimonials.

## Tracking what you need

| Metric | Tool | Target |
|---|---|---|
| Installs / opens | TestFlight / Play Console / Vercel Analytics | 70%+ of invitees install |
| Crash-free sessions | Sentry | 99%+ |
| Time to first compare | Custom event (PostHog) | <30s from app open |
| Booking funnel conversion | Custom events | >40% prompt → results → book |
| NPS / satisfaction | Google Form on day 8 | NPS >30 |

## Don'ts

- **Don't ship to public App Store yet.** Beta is `internal testing` track only.
- **Don't share Supabase/Render dashboards.** Tester access is via the app only.
- **Don't promise launch dates.** Beta is for learning, not roadmap.
- **Don't ignore early dropoffs.** If 3+ testers install but never sign up, your auth/welcome flow has friction — fix before more invites.
