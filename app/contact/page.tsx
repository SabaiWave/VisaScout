'use client';

import { useState } from 'react';
import { UtilityPageShell } from '@/app/components/ui/UtilityPageShell';

const PAGE_CSS = `
  .ct-split {
    display: grid;
    grid-template-columns: 2fr 3fr;
    align-items: start;
  }
  .ct-left { padding-right: 48px; }
  .ct-right { border-left: 1px solid var(--color-border); padding-left: 48px; }
  .ct-h1 {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 40px;
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: var(--color-text-primary);
    margin: 0 0 16px;
  }
  .ct-sub {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
    color: var(--color-text-secondary);
    margin-bottom: 32px;
  }
  /* .ct-meta-label font props from global .vs-mono-label */
  .ct-meta-label { margin-bottom: 6px; }
  .ct-meta-val {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-bottom: 24px;
    display: block;
  }
  .ct-meta-link {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-secondary);
    text-decoration: none;
    border-bottom: 1px solid rgba(200,120,10,0.35);
    padding-bottom: 1px;
  }
  /* .ct-faq-head font props from global .vs-mono-label */
  .ct-faq-head { margin-bottom: 10px; }
  .ct-faq-link {
    display: block;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: 4px 0;
    transition: color 0.12s;
  }
  .ct-faq-link:hover { color: var(--color-text-primary); }
  /* .vs-label, .vs-input, .vs-textarea defined in globals.css */
  .ct-textarea { min-height: 140px; }
  .ct-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ct-send {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-neutral);
    background: var(--color-secondary);
    border: 1px solid var(--color-secondary);
    padding: 13px 32px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .ct-send:disabled { opacity: 0.5; cursor: not-allowed; }
  /* .ct-success / .ct-error → use global .vs-alert .vs-alert-success / .vs-alert-error */
  @media (max-width: 768px) {
    .ct-split { grid-template-columns: 1fr; }
    .ct-left { padding-right: 0; padding-bottom: 40px; border-bottom: 1px solid var(--color-border); }
    .ct-right { border-left: none; padding-left: 0; padding-top: 40px; }
    .ct-pair { grid-template-columns: 1fr; }
  }
`;


export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const body = subject ? `Subject: ${subject}\n\n${message}` : message;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to send message');
      }

      setStatus('success');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <UtilityPageShell maxWidth="1080px" excludeFooterLink="/contact">
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <div className="ct-split">
        {/* Left — info */}
        <div className="ct-left">
          <h1 className="ct-h1">Contact</h1>
          <p className="ct-sub">
            Questions, bug reports, feedback, or partnership inquiries.
          </p>

          <div className="ct-meta-label vs-mono-label">Response time</div>
          <span className="ct-meta-val">We respond within 24 hours.</span>

          <div className="ct-meta-label vs-mono-label">Support email</div>
          <a href="mailto:support@visascout.io" className="ct-meta-link" style={{ display: 'block', marginBottom: 32 }}>
            support@visascout.io
          </a>

          <div className="ct-faq-head vs-mono-label">Quick links</div>
          {[
            { href: '/how-it-works', label: 'How It Works' },
            { href: '/terms#s5',     label: 'Refund Policy' },
            { href: '/terms#s3',     label: 'Legal Disclaimer' },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="ct-faq-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {label}
              <svg width="5" height="8" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true"><path d="M0 0L5 4L0 8Z" /></svg>
            </a>
          ))}
        </div>

        {/* Right — form */}
        <div className="ct-right">
          {status === 'success' ? (
            <div className="vs-alert vs-alert-success">
              <div className="vs-alert-title">Message Sent</div>
              <div className="vs-alert-body">
                We received your message and will reply to {email || 'your email'} within 24 hours.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="ct-pair">
                <div>
                  <label htmlFor="ct-name" className="vs-label">Name</label>
                  <input id="ct-name" type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" className="vs-input" />
                </div>
                <div>
                  <label htmlFor="ct-email" className="vs-label">Email</label>
                  <input id="ct-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className="vs-input" />
                </div>
              </div>

              <div>
                <label htmlFor="ct-subject" className="vs-label">Subject</label>
                <input id="ct-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="What's this about?" className="vs-input" />
              </div>

              <div>
                <label htmlFor="ct-message" className="vs-label">Message</label>
                <textarea id="ct-message" required rows={7} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?" className="vs-textarea ct-textarea" />
              </div>

              {status === 'error' && (
                <div className="vs-alert vs-alert-error">{errorMsg}</div>
              )}

              <div>
                <button type="submit" disabled={status === 'submitting'} className="ct-send">
                  {status === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </UtilityPageShell>
  );
}
