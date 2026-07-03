import Link from 'next/link';
import type { Metadata } from 'next';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { NavLink } from '@/app/components/ui/NavLink';
import { MiniFooter } from '@/app/components/ui/MiniFooter';
import { SectionHeading } from '@/app/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'Privacy Policy — VisaScout',
  description: 'VisaScout Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }} className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] z-0" style={{ background: 'var(--bloom-app-bg)' }} />
      {/* Nav */}
      <nav
        className="relative z-10 border-b px-6 py-4"
        style={{ borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Wordmark />
          <NavLink href="/">Home</NavLink>
        </div>
      </nav>

      <main className="relative z-10 max-w-[760px] mx-auto px-6 py-16">
        <SectionHeading as="h1" size="md" className="mb-2">Privacy Policy</SectionHeading>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Last updated: July 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>1. Information We Collect</h2>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Account information:</strong> Email address provided during sign-up. We store your email to manage your account and send service-related communications. Our authentication provider also collects IP address, device type, and browser information as part of the sign-in process.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Report data:</strong> Nationality, destination country, visa type, and your freeform situation description — used to generate your visa brief.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Usage data:</strong> Pages visited and report generation events, collected anonymously. This data is not tied to your identity.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Error and performance data:</strong> When errors occur, diagnostic information (stack traces, request context, browser version, OS version) is collected for debugging. Server-side operational logs may include anonymized request metadata.</p>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>Payment information:</strong> Payment is processed by Stripe. We do not store card numbers or full payment details. Stripe may collect billing name and payment method metadata per their privacy policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>2. What We Do Not Collect</h2>
            <p>We do not collect passport numbers, date of birth, physical address, or any government-issued identification numbers. We do not store payment card numbers — those are handled entirely by Stripe.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>3. How We Use Your Information</h2>
            <ul className="space-y-2 list-none">
              <li>• Generate your visa intelligence brief</li>
              <li>• Send transactional emails (report confirmation, account-related notices)</li>
              <li>• Improve the accuracy and quality of our reports</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>4. Data Storage</h2>
            <p>Your data is stored on US-based servers. We use reputable third-party providers for authentication, payments, and data storage — each operating under their own security standards and privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>5. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with service providers necessary to operate VisaScout. These providers process data under their own privacy policies and are not permitted to use your data for other purposes.</p>
            <ul className="space-y-1 list-none">
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Anthropic</strong> — AI processing (your report data is sent to generate briefs)</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Clerk</strong> — authentication (email, device info, IP address)</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Stripe</strong> — payment processing</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Supabase</strong> — database storage (report data and account records)</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Web search services</strong> — destination and visa type are passed to search queries to gather immigration data</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Error monitoring services</strong> — anonymized error context and stack traces for debugging</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Server logging services</strong> — operational logs and request metadata</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Anonymous analytics</strong> — page-view counts with no personal identifiers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>6. Your Rights (GDPR / EEA Users)</h2>
            <p className="mb-3">If you are located in the EU or EEA, you have the following rights under the GDPR:</p>
            <ul className="space-y-2 list-none mb-3">
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Access</strong> — request a copy of the personal data we hold about you</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Rectification</strong> — request correction of inaccurate data</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Erasure</strong> — request deletion of your account and associated data</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Portability</strong> — request your data in a machine-readable format</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Restriction</strong> — request that we limit processing of your data</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Object</strong> — object to processing based on legitimate interests</li>
            </ul>
            <p>To exercise any of these rights, contact us via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a>. We will respond within 30 days. Anonymized aggregate usage data may be retained after deletion for service improvement.</p>
            <p className="mt-3">We retain your data as long as your account is active, plus 30 days after a deletion request is processed.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>7. Cookies</h2>
            <p>We use session cookies required for authentication and anonymous analytics. We do not use advertising cookies or third-party tracking cookies.</p>
            <p className="mt-3">We use strictly necessary cookies to manage your authenticated session (Clerk) and protect against automated abuse (Cloudflare). No tracking or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>8. Security</h2>
            <p>All data is encrypted in transit. Access to stored data is restricted and access-controlled. We do not expose user data to the client beyond what is necessary to render your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>9. Children</h2>
            <p>VisaScout is not directed at children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>10. Changes to This Policy</h2>
            <p>We will notify registered users of material changes to this policy via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>11. California Privacy Rights (CCPA)</h2>
            <p className="mb-3">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="space-y-2 list-none mb-3">
              <li>• The right to know what personal information is collected about you</li>
              <li>• The right to request deletion of your personal information</li>
              <li>• The right to opt out of the sale of your personal information</li>
            </ul>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>We do not sell your personal information.</strong> We do not share your data with third parties for their direct marketing purposes. To exercise your rights, contact us via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>12. Contact</h2>
            <p>
              Privacy questions?{' '}
              <Link href="/contact" style={{ color: 'var(--color-secondary-light)' }}>
                Contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <MiniFooter exclude="/privacy" />
    </div>
  );
}
