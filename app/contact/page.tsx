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
  .ct-meta-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    margin-bottom: 6px;
  }
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
  .ct-faq-head {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
    margin-bottom: 10px;
  }
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
  .ct-form-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }
  .ct-input, .ct-textarea {
    width: 100%;
    padding: 12px 16px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--color-text-primary);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-strong);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    display: block;
  }
  .ct-input:focus, .ct-textarea:focus {
    border-color: var(--color-secondary);
    box-shadow: var(--shadow-focus);
  }
  .ct-textarea { resize: vertical; min-height: 140px; line-height: 1.75; }
  .ct-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .ct-send {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #060c12;
    background: var(--color-secondary);
    border: 1px solid var(--color-secondary);
    padding: 13px 32px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .ct-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .ct-success {
    padding: 16px 20px;
    background: rgba(16,185,129,0.08);
    border: 1px solid rgba(16,185,129,0.25);
    font-family: var(--font-mono);
  }
  .ct-success-head { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-success); margin-bottom: 6px; }
  .ct-success-body { font-size: 12px; color: var(--color-text-secondary); }
  .ct-error {
    padding: 12px 16px;
    background: var(--color-error-bg);
    border: 1px solid var(--color-error-border);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-error);
  }
  @media (max-width: 768px) {
    .ct-split { grid-template-columns: 1fr; }
    .ct-left { padding-right: 0; padding-bottom: 40px; border-bottom: 1px solid var(--color-border); }
    .ct-right { border-left: none; padding-left: 0; padding-top: 40px; }
    .ct-pair { grid-template-columns: 1fr; }
  }
`;

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  fontFamily: 'var(--font-body)', fontSize: 14,
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border-strong)',
  outline: 'none', display: 'block',
};

function focusIn(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-secondary)';
  e.currentTarget.style.boxShadow = 'var(--shadow-focus)';
}
function focusOut(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
  e.currentTarget.style.boxShadow = 'none';
}

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

          <div className="ct-meta-label">Response time</div>
          <span className="ct-meta-val">We respond within 24 hours.</span>

          <div className="ct-meta-label">Support email</div>
          <a href="mailto:support@visascout.io" className="ct-meta-link" style={{ display: 'block', marginBottom: 32 }}>
            support@visascout.io
          </a>

          <div className="ct-faq-head">Quick links</div>
          <a href="/how-it-works" className="ct-faq-link">How It Works &rarr;</a>
          <a href="/terms#s5" className="ct-faq-link">Refund Policy &rarr;</a>
          <a href="/terms#s3" className="ct-faq-link">Legal Disclaimer &rarr;</a>
        </div>

        {/* Right — form */}
        <div className="ct-right">
          {status === 'success' ? (
            <div className="ct-success">
              <div className="ct-success-head">Message Sent</div>
              <div className="ct-success-body">
                We received your message and will reply to {email || 'your email'} within 24 hours.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="ct-pair">
                <div>
                  <label htmlFor="ct-name" className="ct-form-label">Name</label>
                  <input id="ct-name" type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label htmlFor="ct-email" className="ct-form-label">Email</label>
                  <input id="ct-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>

              <div>
                <label htmlFor="ct-subject" className="ct-form-label">Subject</label>
                <input id="ct-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="What's this about?" style={INPUT_STYLE} onFocus={focusIn} onBlur={focusOut} />
              </div>

              <div>
                <label htmlFor="ct-message" className="ct-form-label">Message</label>
                <textarea id="ct-message" required rows={7} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  style={{ ...INPUT_STYLE, minHeight: 160, lineHeight: 1.75, resize: 'vertical' }}
                  onFocus={focusIn} onBlur={focusOut} />
              </div>

              {status === 'error' && (
                <div className="ct-error">{errorMsg}</div>
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
