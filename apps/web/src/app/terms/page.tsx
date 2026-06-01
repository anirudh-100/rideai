/**
 * Terms of Service page.
 *
 * NOTE: This is a beta-stage template. Before public launch, have a lawyer in
 * India review it against the Consumer Protection Act 2019, the Information
 * Technology Act 2000, app-store legal requirements, and your incorporation
 * structure (sole prop / LLP / Pvt Ltd).
 */
import type { Metadata } from 'next';
import { LegalLayout, Section } from '../../components/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service · RideAI',
  description:
    'The rules for using RideAI. Plain-language terms covering eligibility, pricing accuracy, third-party platforms, and liability.',
};

const EFFECTIVE_DATE = '01 June 2026';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
      <p>
        Welcome to RideAI. These Terms of Service (&quot;<strong>Terms</strong>&quot;)
        govern your use of the RideAI mobile app, web app, and related services
        (collectively, the &quot;<strong>Service</strong>&quot;). By creating an account
        or using the Service, you agree to be bound by these Terms. If you do not agree,
        please do not use the Service.
      </p>

      <Section id="what" title="1 · What RideAI does (and doesn't do)">
        <p>
          RideAI is an <strong>aggregator and comparison tool</strong>. We help you
          compare prices, ETAs, and coupons across third-party ride, food-delivery, and
          quick-commerce platforms in India, then deep-link you into the platform of
          your choice to complete the booking.
        </p>
        <p>
          We are <strong>not</strong>:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>A ride-hailing, food-delivery, or grocery-delivery service ourselves.</li>
          <li>An affiliate or agent of Uber, Ola, Rapido, Zomato, Swiggy, Zepto, Blinkit, or any other platform we display.</li>
          <li>A processor of your payment for the actual ride / food / groceries — that happens on the platform you booked with.</li>
        </ul>
      </Section>

      <Section id="eligibility" title="2 · Eligibility">
        <p>You may use RideAI only if you are:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>At least 18 years old.</li>
          <li>A resident of India (the Service is currently India-only).</li>
          <li>Legally able to enter into a binding contract under Indian law.</li>
        </ul>
        <p>
          If you are using the Service on behalf of an organisation, you confirm you
          have authority to bind that organisation to these Terms.
        </p>
      </Section>

      <Section id="account" title="3 · Your account">
        <ul className="list-disc space-y-2 pl-6">
          <li>You sign in with your phone number via SMS OTP. Keep your phone secure.</li>
          <li>You are responsible for all activity under your account.</li>
          <li>
            Do not impersonate someone else, create accounts using fake numbers, or
            share access with others.
          </li>
          <li>
            We may suspend or terminate your account if you violate these Terms or use
            the Service in a way that harms us, other users, or any third-party platform.
          </li>
        </ul>
      </Section>

      <Section id="prices" title="4 · Pricing accuracy">
        <p>
          <strong>Prices shown in RideAI are estimates.</strong> We display fares based
          on the best information available to us at the time of your search, which may
          be:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Direct quotes from the underlying platform (where supported).</li>
          <li>
            Model-based estimates derived from distance, time of day, and historical
            data when direct quotes are unavailable.
          </li>
        </ul>
        <p>
          The <strong>final fare</strong> you pay is set by the platform you book with
          (Uber, Ola, etc.) and may differ from our estimate due to surge pricing, route
          changes, waiting time, tolls, or platform-side promotions. RideAI is not
          liable for these differences.
        </p>
      </Section>

      <Section id="coupons" title="5 · Coupon auto-apply">
        <p>
          We attempt to apply the best coupon you are eligible for. Coupons are scraped
          and validated periodically, but:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>A coupon may have expired or been changed by the platform between our last validation and your booking.</li>
          <li>Platforms may decline a coupon for reasons specific to your account that we cannot foresee (geo restrictions, internal flags, etc.).</li>
          <li>
            Coupon savings shown in RideAI are <strong>indicative</strong>. The actual
            discount is applied on the platform&apos;s side and is subject to their
            terms.
          </li>
        </ul>
      </Section>

      <Section id="thirdparty" title="6 · Third-party platforms">
        <p>
          When you tap &quot;Book Now&quot;, RideAI hands you off to a third-party app or
          website. From that moment, your interaction is governed by{' '}
          <strong>that platform&apos;s own terms and privacy policy</strong>. RideAI is
          not responsible for:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>The actual ride, delivery, or fulfilment service.</li>
          <li>Driver / delivery-partner conduct.</li>
          <li>Refunds, cancellations, or disputes on the platform side.</li>
          <li>Payments processed by the platform.</li>
        </ul>
        <p>
          For issues with a completed booking, please contact the platform directly.
        </p>
      </Section>

      <Section id="acceptable" title="7 · Acceptable use">
        <p>You agree NOT to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the Service for any unlawful purpose or in violation of any third-party platform&apos;s terms.</li>
          <li>Reverse-engineer, decompile, or scrape RideAI&apos;s app or APIs.</li>
          <li>Resell access to RideAI, or use it to build a competing aggregator.</li>
          <li>Spam, abuse, or harass other users / RideAI staff.</li>
          <li>Probe, scan, or test for vulnerabilities without our written permission.</li>
        </ul>
      </Section>

      <Section id="ip" title="8 · Intellectual property">
        <p>
          The RideAI name, logo, app, website, and all related content are owned by
          RideAI (or its licensors) and protected by Indian and international copyright,
          trademark, and other laws. Platform logos and trade names shown in RideAI
          (Uber, Ola, etc.) belong to their respective owners and are used for
          identification purposes only.
        </p>
      </Section>

      <Section id="liability" title="9 · Limitation of liability">
        <p>
          To the maximum extent permitted by Indian law:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            The Service is provided <strong>&quot;as is&quot;</strong> and{' '}
            <strong>&quot;as available&quot;</strong>, without warranties of any kind.
          </li>
          <li>
            RideAI&apos;s total liability for any claim arising from the Service is
            capped at <strong>INR 1,000</strong> or the amount you paid us in the prior
            three months (whichever is greater). Most users pay us nothing.
          </li>
          <li>
            We are not liable for indirect, incidental, or consequential losses (lost
            time, missed appointments, etc.).
          </li>
        </ul>
        <p>
          Nothing in these Terms excludes liability that cannot be excluded under Indian
          law (e.g. liability for gross negligence or fraud).
        </p>
      </Section>

      <Section id="changes" title="10 · Changes to the Service or Terms">
        <p>
          We may update the Service or these Terms at any time. Material changes will be
          notified in the app and by email. Your continued use after the change date
          means you accept the updated Terms.
        </p>
      </Section>

      <Section id="termination" title="11 · Termination">
        <p>
          You may stop using RideAI and delete your account at any time. We may suspend
          or terminate your access if you violate these Terms or if we discontinue the
          Service. On termination, sections 4–9 and 12–13 survive.
        </p>
      </Section>

      <Section id="law" title="12 · Governing law and disputes">
        <p>
          These Terms are governed by the laws of India. Any dispute arising from these
          Terms or the Service shall be subject to the exclusive jurisdiction of the
          courts in [Bengaluru / Mumbai / Delhi — choose your principal place of
          business].
        </p>
        <p>
          Before initiating any legal proceeding, please contact us at{' '}
          <a href="mailto:legal@rideai.in" className="text-primary hover:underline">
            legal@rideai.in
          </a>{' '}
          — most issues can be resolved informally.
        </p>
      </Section>

      <Section id="contact" title="13 · Contact">
        <p>
          For questions about these Terms, email{' '}
          <a href="mailto:legal@rideai.in" className="text-primary hover:underline">
            legal@rideai.in
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
