/**
 * Privacy Policy page.
 *
 * NOTE: This is a beta-stage template that reflects the data RideAI actually
 * collects today (phone, name, city, bookings, search history, device info).
 * Before public launch, have a lawyer in India review it against:
 *  - DPDP Act 2023 (India)
 *  - Apple App Store Review Guidelines §5.1 (privacy)
 *  - Google Play Developer Program Policies (data safety)
 */
import type { Metadata } from 'next';
import { LegalLayout, Section } from '../../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy · RideAI',
  description:
    'How RideAI collects, uses, and protects your data. India-specific policy aligned with DPDP Act 2023.',
};

const EFFECTIVE_DATE = '01 June 2026';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <p>
        RideAI (&quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, or &quot;
        <strong>our</strong>&quot;) is an aggregator that helps you compare rides, food
        delivery, and quick-commerce prices across third-party platforms operating in
        India. This Privacy Policy explains what personal data we collect, how we use it,
        who we share it with, and the choices you have. It applies to the RideAI mobile
        app, web app, and any related services we operate.
      </p>
      <p>
        By using RideAI you confirm that you have read and agree to this Policy. If you
        do not agree, please do not use the service.
      </p>

      <Section id="data" title="1 · What we collect">
        <p>We collect the minimum data needed to operate the service:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account data:</strong> phone number (required for signup via SMS
            OTP), and optionally your name, email, and city.
          </li>
          <li>
            <strong>Usage data:</strong> the natural-language prompts you type
            (&quot;Rajiv Chowk to India Gate&quot;), the ranked results we show you, the
            options you select, and the bookings you complete.
          </li>
          <li>
            <strong>Coupon-eligibility signals:</strong> the third-party platforms you
            self-report having used (e.g. Uber, Zomato), and your booking activity inside
            RideAI. We use these to match coupons to your profile.
          </li>
          <li>
            <strong>Device data:</strong> device model, OS version, app version, language,
            crash logs (via Sentry). Used only for diagnostics.
          </li>
          <li>
            <strong>Location (optional):</strong> when you grant permission, we use your
            approximate location to pre-fill ride pickup. You can deny or revoke this in
            your OS settings — the rest of the app still works.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect your contacts, photos, microphone audio,
          payment-card details, government IDs, or precise background location.
        </p>
      </Section>

      <Section id="use" title="2 · How we use your data">
        <ul className="list-disc space-y-2 pl-6">
          <li>To provide the comparison + booking service you requested.</li>
          <li>
            To match coupons you are eligible for (new-user, win-back, etc.) and to apply
            the best one automatically.
          </li>
          <li>To send booking confirmations and (with consent) product updates.</li>
          <li>
            To improve the product — analysing aggregated, de-identified search prompts
            to understand which features are useful.
          </li>
          <li>To investigate bugs and abuse, and to enforce our Terms of Service.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </Section>

      <Section id="sharing" title="3 · Who we share with">
        <p>
          We do <strong>not</strong> sell your personal data. We share only what is
          necessary, with these categories of recipients:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Infrastructure providers</strong> who process data on our behalf
            under contracts that require them to safeguard it:
            <ul className="mt-1 list-[circle] space-y-1 pl-5 text-sm">
              <li>Supabase — authentication, database hosting (region: ap-south-1, Mumbai)</li>
              <li>Render — backend API hosting</li>
              <li>Vercel — web hosting (this site)</li>
              <li>Anthropic — AI intent parsing (your prompt is sent to Claude)</li>
              <li>Sentry — crash + error reports (no PII; we redact before send)</li>
              <li>Google Maps — geocoding addresses you query</li>
            </ul>
          </li>
          <li>
            <strong>Third-party platforms</strong> (Uber, Ola, Rapido, Zomato, Swiggy,
            Zepto, Blinkit) — when you tap &quot;Book Now&quot;, we deep-link you into
            their app or site with the pickup/drop you specified. We do NOT pass them
            your RideAI account info. Once you complete a booking on their platform,
            their privacy policy applies.
          </li>
          <li>
            <strong>Legal authorities</strong> only when required by valid Indian law
            (e.g. a court order under DPDP Act 2023).
          </li>
        </ul>
      </Section>

      <Section id="retention" title="4 · How long we keep your data">
        <p>
          We keep your account data as long as your account is active. If you delete your
          account (Profile → coming soon, or email{' '}
          <a href="mailto:privacy@rideai.in" className="text-primary hover:underline">
            privacy@rideai.in
          </a>
          ), we delete your personal data within 30 days, except for:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Booking records we are required to retain under Indian tax / consumer
            protection law (up to 7 years), stored separately and access-restricted.
          </li>
          <li>
            Anonymised, aggregated usage analytics we may keep indefinitely (e.g. &quot;X
            users in Delhi searched for biryani last month&quot;).
          </li>
        </ul>
      </Section>

      <Section id="rights" title="5 · Your rights">
        <p>Under India&apos;s DPDP Act 2023, you have the right to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Correct</strong> any inaccurate or incomplete data.</li>
          <li><strong>Delete</strong> your account and associated data.</li>
          <li><strong>Withdraw consent</strong> at any time (this won&apos;t affect processing already done).</li>
          <li><strong>File a grievance</strong> via the contact below.</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href="mailto:privacy@rideai.in" className="text-primary hover:underline">
            privacy@rideai.in
          </a>{' '}
          from the address linked to your account. We will respond within 30 days.
        </p>
      </Section>

      <Section id="security" title="6 · How we protect your data">
        <ul className="list-disc space-y-2 pl-6">
          <li>All traffic uses HTTPS (TLS 1.2+).</li>
          <li>Passwords are not used — we authenticate via SMS OTP.</li>
          <li>Backend connections to the database are SSL-encrypted.</li>
          <li>
            Access to production systems is limited to authorised RideAI staff and is
            audited.
          </li>
          <li>
            No system is perfectly secure — if we discover a breach affecting your data,
            we will notify you and the Data Protection Board of India as required.
          </li>
        </ul>
      </Section>

      <Section id="children" title="7 · Children">
        <p>
          RideAI is not directed at children under 18. We do not knowingly collect data
          from users under 18. If you believe a minor has signed up, please contact us
          and we will delete the account.
        </p>
      </Section>

      <Section id="international" title="8 · Where your data is stored">
        <p>
          Your data is primarily stored in India (Supabase Mumbai region, Render
          Singapore region). Crash reports may transit to Sentry (USA/EU). By using
          RideAI you consent to this limited cross-border transfer for technical support
          purposes.
        </p>
      </Section>

      <Section id="changes" title="9 · Changes to this policy">
        <p>
          We may update this policy as the product evolves. Material changes will be
          notified in the app (banner on next open) and by email. The &quot;Effective&quot;
          date at the top is updated each revision.
        </p>
      </Section>

      <Section id="contact" title="10 · Grievance officer">
        <p>
          As required under DPDP Act 2023 and the IT Rules 2021:
          <br />
          <br />
          <strong>Grievance Officer</strong>
          <br />
          RideAI (a unit of [Your Legal Entity Name])
          <br />
          Email:{' '}
          <a href="mailto:grievance@rideai.in" className="text-primary hover:underline">
            grievance@rideai.in
          </a>
          <br />
          [Postal address — fill in before public launch]
        </p>
        <p className="text-sm text-muted">
          We aim to respond within 24 hours for grievance contacts and within 30 days
          for substantive resolution.
        </p>
      </Section>
    </LegalLayout>
  );
}
