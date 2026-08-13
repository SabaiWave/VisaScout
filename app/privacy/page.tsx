import Link from 'next/link';
import type { Metadata } from 'next';
import { UtilityPageShell } from '@/app/components/ui/UtilityPageShell';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { LegalPageShell } from '@/app/components/LegalPageShell';

const TOC_ITEMS = [
  { id: 's1',  label: '1. Information We Collect' },
  { id: 's2',  label: '2. What We Do Not Collect' },
  { id: 's3',  label: '3. How We Use Your Information' },
  { id: 's4',  label: '4. Data Storage' },
  { id: 's5',  label: '5. Data Sharing' },
  { id: 's6',  label: '6. Your Rights (GDPR)' },
  { id: 's7',  label: '7. Cookies' },
  { id: 's8',  label: '8. Brief Generation and Sharing' },
  { id: 's9',  label: '9. Security' },
  { id: 's10', label: '10. Children' },
  { id: 's11', label: '11. Changes to This Policy' },
  { id: 's12', label: '12. CCPA' },
  { id: 's13', label: '13. Contact' },
];

export const metadata: Metadata = {
  title: 'Privacy Policy — VisaScout',
  description: 'VisaScout Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <UtilityPageShell maxWidth="1080px" excludeFooterLink="/privacy">
      <LegalPageShell tocItems={TOC_ITEMS}>
        <SectionHeading as="h1" size="md" className="mb-2">Privacy Policy</SectionHeading>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Last updated: August 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section id="s1">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>1. Information We Collect</h2>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Account information:</strong> Email address provided during sign-up. We store your email to manage your account and send service-related communications. Our authentication provider also collects IP address, device type, and browser information as part of the sign-in process.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Report data:</strong> Nationality, destination country, visa type, and your situation description — used to generate your visa brief. Generated briefs store only generic visa intelligence (nationality, destination, visa type, duration, entry pattern) and do not include names, contact details, or other personal identifiers.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Usage data:</strong> Pages visited and report generation events, collected anonymously. This data is not tied to your identity.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Error and performance data:</strong> When errors occur, diagnostic information (stack traces, request context, browser version, OS version) is collected for debugging. Server-side operational logs may include anonymized request metadata.</p>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>Payment information:</strong> Payment is processed by Stripe. We do not store card numbers or full payment details. Stripe may collect billing name and payment method metadata per their privacy policy.</p>
          </section>

          <section id="s2">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>2. What We Do Not Collect</h2>
            <p>We do not collect passport numbers, date of birth, physical address, or any government-issued identification numbers. We do not store payment card numbers — those are handled entirely by Stripe.</p>
          </section>

          <section id="s3">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>3. How We Use Your Information</h2>
            <ul className="space-y-2 list-none">
              <li>• Generate your visa intelligence brief</li>
              <li>• Send transactional emails (report confirmation, account-related notices)</li>
              <li>• Improve the accuracy and quality of our reports</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section id="s4">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>4. Data Storage</h2>
            <p>Your data is stored on US-based servers. We use reputable third-party providers for authentication, payments, and data storage — each operating under their own security standards and privacy policies.</p>
          </section>

          <section id="s5">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>5. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with service providers necessary to operate VisaScout. These providers process data under their own privacy policies and are not permitted to use your data for other purposes.</p>
            <ul className="space-y-1 list-none">
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>AI model provider</strong> — your report data (nationality, destination, situation) is sent to generate briefs</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Authentication provider</strong> — email address, device info, and IP address as part of sign-in</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Stripe</strong> — payment processing (card data handled entirely by Stripe)</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Database provider</strong> — report data and account records</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Web search provider</strong> — destination and visa type are passed to search queries to gather immigration data</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Error monitoring</strong> — anonymized error context for debugging</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Server logging</strong> — operational logs and anonymized request metadata</li>
              <li>• <strong style={{ color: 'var(--color-text-primary)' }}>Anonymous analytics</strong> — page-view counts with no personal identifiers</li>
            </ul>
          </section>

          <section id="s6">
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

          <section id="s7">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>7. Cookies</h2>
            <p>We use strictly necessary cookies to manage your authenticated session and protect against automated abuse. We do not use advertising cookies or third-party tracking cookies.</p>
          </section>

          <section id="s8">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>8. Brief Generation and Sharing</h2>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>How we use your input:</strong> Your situation description is processed to extract the visa-relevant context needed to generate your brief. Generated briefs describe situations in generic terms — nationality, destination, visa type, duration, and entry pattern — and do not include names, contact details, or other personal identifiers.</p>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>Shared briefs:</strong> Briefs can be shared via a unique link. Anyone with the link can view the visa intelligence it contains. The link provides access to the generated brief only — it does not expose your account, email address, or the text you entered.</p>
          </section>

          <section id="s9">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>9. Security</h2>
            <p>All data is encrypted in transit. Access to stored data is restricted and access-controlled. We do not expose user data to the client beyond what is necessary to render your account.</p>
          </section>

          <section id="s10">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>10. Children</h2>
            <p>VisaScout is not directed at children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, contact us immediately.</p>
          </section>

          <section id="s11">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>11. Changes to This Policy</h2>
            <p>We will notify registered users of material changes to this policy via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section id="s12">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>12. California Privacy Rights (CCPA)</h2>
            <p className="mb-3">If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA):</p>
            <ul className="space-y-2 list-none mb-3">
              <li>• The right to know what personal information is collected about you</li>
              <li>• The right to request deletion of your personal information</li>
              <li>• The right to opt out of the sale of your personal information</li>
            </ul>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>We do not sell your personal information.</strong> We do not share your data with third parties for their direct marketing purposes. To exercise your rights, contact us via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a>.</p>
          </section>

          <section id="s13">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>13. Contact</h2>
            <p>
              Privacy questions?{' '}
              <Link href="/contact" style={{ color: 'var(--color-secondary-light)' }}>
                Contact us
              </Link>
              .
            </p>
          </section>
        </div>
      </LegalPageShell>
    </UtilityPageShell>
  );
}
