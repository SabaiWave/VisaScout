'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { NavLink } from '@/app/components/ui/NavLink';
import { MiniFooter } from '@/app/components/ui/MiniFooter';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to send message');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

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

      <main className="relative z-10 max-w-[560px] mx-auto px-6 py-16">
        <SectionHeading as="h1" size="md" className="mb-8">Contact</SectionHeading>
        <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Questions, bug reports, feedback, or partnership inquiries. We reply within one business day.
        </p>

        {status === 'success' ? (
          <div
            className="p-5 rounded-lg border"
            style={{
              background: 'rgba(34,197,94,0.08)',
              borderColor: 'rgba(34,197,94,0.25)',
            }}
          >
            <p
              className="text-sm font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}
            >
              Message sent
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              We received your message and will reply to {email || 'your email'} shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
              >
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--color-secondary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--color-secondary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
              >
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="How can we help?"
                className="w-full px-4 py-3 rounded-lg text-base outline-none transition-all resize-vertical"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.75,
                  minHeight: '140px',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--color-secondary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Error */}
            {status === 'error' && (
              <div
                className="px-4 py-3 rounded-lg border"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.25)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
                  {errorMsg}
                </p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3"
              style={status === 'submitting' ? { background: 'rgba(99,102,241,0.5)' } : undefined}
            >
              {status === 'submitting' ? 'Sending...' : 'Send message'}
            </Button>
          </form>
        )}
      </main>

      <MiniFooter exclude="/contact" />
    </div>
  );
}
