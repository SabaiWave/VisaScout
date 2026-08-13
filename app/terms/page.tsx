import Link from 'next/link';
import type { Metadata } from 'next';
import { UtilityPageShell } from '@/app/components/ui/UtilityPageShell';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { LegalPageShell } from '@/app/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Terms of Service — VisaScout',
  description: 'VisaScout Terms of Service',
};

const TOC_ITEMS = [
  { id: 's1',  label: '1. Agreement to Terms' },
  { id: 's2',  label: '2. Description of Service' },
  { id: 's3',  label: '3. Not Legal Advice' },
  { id: 's4',  label: '4. Accuracy of Information' },
  { id: 's5',  label: '5. Payment and Refunds' },
  { id: 's6',  label: '6. Limitation of Liability' },
  { id: 's7',  label: '7. User Accounts' },
  { id: 's8',  label: '8. Prohibited Uses' },
  { id: 's9',  label: '9. Intellectual Property' },
  { id: 's10', label: '10. Changes to Terms' },
  { id: 's11', label: '11. Governing Law' },
  { id: 's12', label: '12. Contact' },
];

export default function TermsPage() {
  return (
    <UtilityPageShell maxWidth="1080px" excludeFooterLink="/terms">
      <LegalPageShell tocItems={TOC_ITEMS}>
        <SectionHeading as="h1" size="md" className="mb-2">Terms of Service</SectionHeading>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Last updated: August 2026
        </p>

        <div className="prose-content space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section id="s1">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>1. Agreement to Terms</h2>
            <p>By accessing or using VisaScout (&quot;the Service&quot;), operated by Sabai Wave LLC, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section id="s2">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>2. Description of Service</h2>
            <p className="mb-3">VisaScout is an information aggregation service that synthesizes publicly available information about visa requirements and immigration policies across Southeast Asia, East Asia, Europe, and Latin America. The Service does not provide legal advice, immigration legal services, or visa application processing.</p>
            <p>Generated briefs may be shared via a unique link. Anyone with the link can view the brief&apos;s visa intelligence content. Shared briefs do not expose your account information, email address, or raw input — only the generated visa intelligence.</p>
          </section>

          <section id="s3">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>3. Not Legal Advice</h2>
            <p className="font-semibold" style={{ color: 'var(--color-warning)' }}>
              ⚠ The information provided by VisaScout is for informational purposes only and does not constitute legal advice. VisaScout is not a law firm and does not provide immigration legal services. You should verify all visa requirements with official government sources and consult a qualified immigration attorney for legal advice specific to your situation.
            </p>
          </section>

          <section id="s4">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>4. Accuracy of Information</h2>
            <p>VisaScout aggregates publicly available information from government websites, news sources, and community platforms. Immigration policies change frequently. While we strive for accuracy, we make no warranty that information is current, complete, or accurate. Always verify requirements with official immigration authorities before travel.</p>
          </section>

          <section id="s5">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>5. Payment and Refunds</h2>
            <p>Paid reports are charged per report at the time of generation. Refunds are not available once a report has been generated. If a technical error prevents delivery, reach out via our <a href="/contact" style={{ color: 'var(--color-secondary-light)' }}>contact form</a> for resolution.</p>
          </section>

          <section id="s6">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>6. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Sabai Wave LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. <strong style={{ color: 'var(--color-text-primary)' }}>In no event shall Sabai Wave LLC&apos;s total liability to you exceed the amount you paid for the report giving rise to the claim.</strong></p>
          </section>

          <section id="s7">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>7. User Accounts</h2>
            <p className="mb-3">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information during registration and keep your account information up to date.</p>
            <p>When describing your travel situation, you do not need to include your name, contact details, employer name, or other personal identifiers. We recommend against including such information, as generated briefs can be shared via a public link. Only visa-relevant context (nationality, destination, duration, entry pattern, income type) is needed to generate an accurate brief.</p>
          </section>

          <section id="s8">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>8. Prohibited Uses</h2>
            <p>You may not use the Service to violate any applicable laws, scrape or systematically extract data, circumvent security measures, or resell the Service commercially without written permission.</p>
          </section>

          <section id="s9">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>9. Intellectual Property</h2>
            <p>The Service, including all content, features, and functionality, is owned by Sabai Wave LLC and is protected by intellectual property laws. Generated reports are licensed for your personal use only and may not be resold or redistributed.</p>
          </section>

          <section id="s10">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify registered users of material changes via email.</p>
          </section>

          <section id="s11">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>11. Governing Law</h2>
            <p>These terms are governed by the laws of the United States. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
          </section>

          <section id="s12">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>12. Contact</h2>
            <p>
              Questions about these Terms?{' '}
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
