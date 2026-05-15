import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — VisaScout',
  description: 'VisaScout Terms of Service',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Last updated: May 2026
        </p>

        <div className="prose-content space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>1. Agreement to Terms</h2>
            <p>By accessing or using VisaScout (&quot;the Service&quot;), operated by Sabai Wave LLC, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>2. Description of Service</h2>
            <p>VisaScout is an information aggregation service that synthesizes publicly available information about visa requirements and immigration policies for Southeast Asian countries. The Service does not provide legal advice, immigration legal services, or visa application processing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>3. Not Legal Advice</h2>
            <p className="font-semibold" style={{ color: 'var(--color-warning)' }}>
              ⚠ The information provided by VisaScout is for informational purposes only and does not constitute legal advice. VisaScout is not a law firm and does not provide immigration legal services. You should verify all visa requirements with official government sources and consult a qualified immigration attorney for legal advice specific to your situation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>4. Accuracy of Information</h2>
            <p>VisaScout aggregates publicly available information from government websites, news sources, and community platforms. Immigration policies change frequently. While we strive for accuracy, we make no warranty that information is current, complete, or accurate. Always verify requirements with official immigration authorities before travel.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>5. Payment and Refunds</h2>
            <p>Paid reports are charged per report at the time of generation. Refunds are not available once a report has been generated. If a technical error prevents delivery, reach out via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a> for resolution.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>6. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Sabai Wave LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. <strong style={{ color: 'var(--color-text-primary)' }}>In no event shall Sabai Wave LLC&apos;s total liability to you exceed the amount you paid for the report giving rise to the claim.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>7. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information during registration and keep your account information up to date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>8. Prohibited Uses</h2>
            <p>You may not use the Service to violate any applicable laws, scrape or systematically extract data, circumvent security measures, or resell the Service commercially without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>9. Intellectual Property</h2>
            <p>The Service, including all content, features, and functionality, is owned by Sabai Wave LLC and is protected by intellectual property laws. Generated reports are licensed for your personal use only and may not be resold or redistributed.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify registered users of material changes via email.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>11. Governing Law</h2>
            <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>12. Contact</h2>
            <p>
              Questions about these Terms?{' '}
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
          <Link href="/privacy" className="transition-colors" style={{ color: 'var(--color-text-tertiary)' }}>Privacy</Link>
          <Link href="/contact" className="transition-colors" style={{ color: 'var(--color-text-tertiary)' }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
