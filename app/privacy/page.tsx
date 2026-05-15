import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — VisaScout',
  description: 'VisaScout Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        className="border-b px-6 py-4"
        style={{ borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[760px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-widest no-underline"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
          </Link>
          <Link
            href="/"
            className="text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors"
            style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
          >
            ← Home
          </Link>
        </div>
      </nav>

      <main className="max-w-[760px] mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Last updated: May 2026
        </p>

        <div className="space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>1. Information We Collect</h2>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Account information:</strong> Email address and name provided during sign-up.</p>
            <p className="mb-3"><strong style={{ color: 'var(--color-text-primary)' }}>Report data:</strong> Nationality, destination country, visa type, and your freeform situation description — used to generate your visa brief.</p>
            <p><strong style={{ color: 'var(--color-text-primary)' }}>Usage data:</strong> Pages visited and report generation events, collected anonymously.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>2. What We Do Not Collect</h2>
            <p>We do not collect passport numbers, date of birth, physical address, or any government-issued identification numbers. We do not store payment card information — payments are processed by Stripe.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>3. How We Use Your Information</h2>
            <ul className="space-y-2 list-none">
              <li>• Generate your visa intelligence brief</li>
              <li>• Send transactional emails (report confirmation, account-related notices)</li>
              <li>• Improve the accuracy and quality of our reports</li>
              <li>• Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>4. Data Storage</h2>
            <p>Your data is stored on US-based servers. We use reputable third-party providers for authentication, payments, and data storage — each operating under their own security standards and privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>5. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with service providers necessary to operate VisaScout (Anthropic for AI processing, Tavily for search, Clerk for auth, Stripe for payments, Supabase for storage). These providers process data under their own privacy policies and are not permitted to use your data for other purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>6. Your Rights</h2>
            <p>You may request deletion of your account and associated data at any time via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a>. We will process deletion requests within 30 days. Note that anonymized aggregate usage data may be retained for service improvement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>7. Cookies</h2>
            <p>We use session cookies required for authentication and anonymous analytics. We do not use advertising cookies or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>8. Security</h2>
            <p>All data is encrypted in transit. Access to stored data is restricted and access-controlled. We do not expose user data to the client beyond what is necessary to render your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>9. Children</h2>
            <p>VisaScout is not directed at children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>10. Changes to This Policy</h2>
            <p>We will notify registered users of material changes to this policy via email. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>11. Contact</h2>
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

      <footer
        className="border-t px-6 py-8 text-center"
        style={{ borderColor: 'var(--color-border-muted)' }}
      >
        <div className="flex justify-center gap-6 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <Link href="/" className="transition-colors" style={{ color: 'var(--color-text-tertiary)' }}>Home</Link>
          <Link href="/terms" className="transition-colors" style={{ color: 'var(--color-text-tertiary)' }}>Terms</Link>
          <Link href="/contact" className="transition-colors" style={{ color: 'var(--color-text-tertiary)' }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
