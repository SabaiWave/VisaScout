'use client';

import Link from 'next/link';
import { useState } from 'react';

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

      <main className="max-w-[560px] mx-auto px-6 py-16">
        {/* Heading */}
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
        >
          <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
          Contact
        </h1>
        <div
          className="mb-8 h-px"
          style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }}
        />
        <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Questions, bugs, feedback, or partnership inquiries — send a message and we'll get back to you as soon as possible.
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
              style={{ color: '#22c55e', fontFamily: 'var(--font-mono)' }}
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
                className="w-full px-4 py-3 rounded text-base outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  borderRadius: '4px',
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
                className="w-full px-4 py-3 rounded text-base outline-none transition-all"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  borderRadius: '4px',
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
                className="w-full px-4 py-3 rounded text-base outline-none transition-all resize-vertical"
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.75,
                  borderRadius: '4px',
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
                className="px-4 py-3 rounded border"
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
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 px-6 rounded text-sm font-bold uppercase tracking-wider transition-colors"
              style={{
                background: status === 'submitting' ? 'rgba(99,102,241,0.5)' : 'var(--color-secondary)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                borderRadius: '8px',
                border: 'none',
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'submitting' ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </main>

      <footer
        className="border-t px-6 py-8 text-center"
        style={{ borderColor: 'var(--color-border-muted)' }}
      >
        <div className="flex justify-center gap-6 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <Link href="/" className="transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>Home</Link>
          <Link href="/privacy" className="transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>Privacy</Link>
          <Link href="/terms" className="transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
