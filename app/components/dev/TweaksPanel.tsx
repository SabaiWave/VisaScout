'use client';

import { useEffect, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   TWEAKS PANEL — admin-only live design tuning.

   Ported from the v2e bake-off mockup. Writes CSS custom properties onto
   document.documentElement, so every component reading var(--token) updates
   live. "Copy CSS" emits a paste-ready :root block for app/globals.css.

   This exists so parametric design changes (spacing, size, color) cost zero
   round-trips. Structural changes still belong in a mockup.

   Controls map to REAL tokens in globals.css — not the mockup's landing-only
   vars. Adding a token here does nothing unless components actually read it.
   ═══════════════════════════════════════════════════════════════════════ */

type Ctrl =
  | { kind: 'section'; label: string }
  | { kind: 'color'; v: string; label: string; rgbVar?: string }
  | { kind: 'range'; v: string; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: 'swatches'; of: string; colors: string[] };

const CONTROLS: Ctrl[] = [
  { kind: 'section', label: 'Accent' },
  { kind: 'color', v: '--color-secondary', label: 'Accent', rgbVar: '--color-secondary-rgb' },
  { kind: 'color', v: '--color-secondary-light', label: 'Accent light' },
  { kind: 'color', v: '--color-secondary-dark', label: 'Accent dark' },
  { kind: 'color', v: '--color-secondary-subtle', label: 'Accent subtle' },
  { kind: 'swatches', of: '--color-secondary', colors: ['#c8780a', '#e8920a', '#d94f2b', '#b8860b', '#7a9e7e', '#2a9d8f', '#c9c2b6'] },

  { kind: 'section', label: 'Surfaces' },
  { kind: 'color', v: '--color-bg-base', label: 'Ground' },
  { kind: 'color', v: '--color-bg-elevated', label: 'Elevated' },
  { kind: 'color', v: '--color-bg-overlay', label: 'Overlay' },
  { kind: 'color', v: '--color-bg-subtle', label: 'Subtle' },

  { kind: 'section', label: 'Borders' },
  { kind: 'color', v: '--color-border', label: 'Border' },
  { kind: 'color', v: '--color-border-muted', label: 'Border muted' },
  { kind: 'color', v: '--color-border-strong', label: 'Border strong' },

  { kind: 'section', label: 'Text' },
  { kind: 'color', v: '--color-text-primary', label: 'Primary' },
  { kind: 'color', v: '--color-text-secondary', label: 'Secondary' },
  { kind: 'color', v: '--color-text-tertiary', label: 'Tertiary' },

  { kind: 'section', label: 'Shape' },
  { kind: 'range', v: '--radius-sm', label: 'Radius sm', min: 0, max: 16, step: 1, unit: 'px' },
  { kind: 'range', v: '--radius-md', label: 'Radius md', min: 0, max: 20, step: 1, unit: 'px' },
  { kind: 'range', v: '--radius-lg', label: 'Radius lg', min: 0, max: 24, step: 1, unit: 'px' },
];

/* ── WCAG contrast ─────────────────────────────────────────────────── */
function lum(hex: string): number {
  const m = hex.replace('#', '').trim();
  const h = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  const n = parseInt(h, 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a: string, b: string): number {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const PAIRS: [string, string, string, number][] = [
  ['Primary / ground',    '--color-text-primary',   '--color-bg-base', 4.5],
  ['Secondary / ground',  '--color-text-secondary', '--color-bg-base', 4.5],
  ['Tertiary / ground',   '--color-text-tertiary',  '--color-bg-base', 4.5],
  ['Accent / ground',     '--color-secondary',      '--color-bg-base', 3],
  ['Neutral / accent',    '--color-neutral',        '--color-secondary', 4.5],
];

const TOKENS = CONTROLS.filter((c): c is Extract<Ctrl, { v: string }> => 'v' in c).map(c => c.v);
const STORAGE_KEY = 'visascout_tweaks';

function hexToRgbTriplet(hex: string): string {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const readVar = (v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  // Capture pristine token values once, then replay any saved overrides.
  useEffect(() => {
    const base: Record<string, string> = {};
    TOKENS.forEach(v => { base[v] = readVar(v); });
    setDefaults(base);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        Object.entries(parsed).forEach(([k, val]) => {
          document.documentElement.style.setProperty(k, val);
          if (k === '--color-secondary' && val.startsWith('#')) {
            document.documentElement.style.setProperty('--color-secondary-rgb', hexToRgbTriplet(val));
          }
        });
        setValues(parsed);
      }
    } catch { /* corrupt state — ignore */ }
  }, []);

  const setToken = useCallback((token: string, val: string, rgbVar?: string) => {
    document.documentElement.style.setProperty(token, val);
    if (rgbVar && val.startsWith('#')) {
      document.documentElement.style.setProperty(rgbVar, hexToRgbTriplet(val));
    }
    setValues(prev => {
      const next = { ...prev, [token]: val };
      if (rgbVar && val.startsWith('#')) next[rgbVar] = hexToRgbTriplet(val);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    TOKENS.forEach(v => document.documentElement.style.removeProperty(v));
    document.documentElement.style.removeProperty('--color-secondary-rgb');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setValues({});
  }, []);

  const copyCss = useCallback(() => {
    const lines = TOKENS.map(v => `  ${v}: ${readVar(v)};`);
    lines.push(`  --color-secondary-rgb: ${readVar('--color-secondary-rgb')};`);
    navigator.clipboard.writeText(`:root {\n${lines.join('\n')}\n}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => { /* clipboard denied */ });
  }, []);

  // T toggles the panel — ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 't' || e.key === 'T') setOpen(o => !o);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const dirty = Object.keys(values).length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle design tweaks panel"
        style={{
          position: 'fixed', top: '50%', right: 0, transform: 'translateY(-50%)',
          zIndex: 9998, cursor: 'pointer',
          background: '#101013', color: dirty ? '#e8920a' : '#d8d4cc',
          border: '1px solid #33312c', borderRight: 'none',
          font: "700 9px/1 'JetBrains Mono', monospace", letterSpacing: '0.2em',
          padding: '14px 8px', writingMode: 'vertical-rl', textTransform: 'uppercase',
        }}
      >
        {dirty ? '● Tweaks' : 'Tweaks'}
      </button>

      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px',
          zIndex: 9999, background: '#101013', borderLeft: '1px solid #33312c',
          fontFamily: "'JetBrains Mono', monospace", color: '#d8d4cc',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .18s ease',
          boxShadow: '-12px 0 40px rgba(0,0,0,.5)',
        }}
      >
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #33312c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6a6560', flexShrink: 0 }}>
          <span><b style={{ color: '#e8920a' }}>Tweaks</b> · Admin</span>
          <span onClick={() => setOpen(false)} style={{ cursor: 'pointer', fontSize: '13px' }}>✕</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
          {CONTROLS.map((c, i) => {
            if (c.kind === 'section') {
              return (
                <div key={`s${i}`} style={{ padding: '5px 14px 4px', marginTop: '6px', fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#e8920a', background: '#17171b', position: 'sticky', top: 0, zIndex: 2 }}>
                  {c.label}
                </div>
              );
            }
            if (c.kind === 'swatches') {
              return (
                <div key={`w${i}`} style={{ display: 'flex', gap: '4px', padding: '2px 14px 8px' }}>
                  {c.colors.map(col => (
                    <div
                      key={col}
                      title={col}
                      onClick={() => setToken(c.of, col, '--color-secondary-rgb')}
                      style={{ width: '22px', height: '14px', border: '1px solid #33312c', cursor: 'pointer', background: col }}
                    />
                  ))}
                </div>
              );
            }
            const current = values[c.v] ?? defaults[c.v] ?? '';
            return (
              <div key={c.v} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 44px', gap: '8px', alignItems: 'center', padding: '5px 14px' }}>
                <label style={{ fontSize: '8.5px', letterSpacing: '0.08em', color: '#8a857c', textTransform: 'uppercase' }}>{c.label}</label>
                {c.kind === 'color' ? (
                  <>
                    <input
                      type="color"
                      value={current.startsWith('#') ? current : '#000000'}
                      onChange={e => setToken(c.v, e.target.value, c.rgbVar)}
                      style={{ width: '100%', height: '20px', padding: 0, border: '1px solid #33312c', background: 'none', cursor: 'pointer' }}
                    />
                    <output style={{ fontSize: '7.5px', color: '#e8920a', textAlign: 'right' }}>{current}</output>
                  </>
                ) : (
                  <>
                    <input
                      type="range"
                      min={c.min} max={c.max} step={c.step}
                      value={parseFloat(current) || 0}
                      onChange={e => setToken(c.v, e.target.value + (c.unit ?? ''))}
                      style={{ width: '100%', height: '2px', background: '#33312c', outline: 'none' }}
                    />
                    <output style={{ fontSize: '8.5px', color: '#e8920a', textAlign: 'right' }}>{current}</output>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <ContrastReadout />

        <div style={{ display: 'flex', borderTop: '1px solid #33312c', flexShrink: 0 }}>
          <button onClick={reset} style={{ flex: 1, padding: '11px', cursor: 'pointer', font: "700 9px 'JetBrains Mono', monospace", letterSpacing: '0.16em', textTransform: 'uppercase', background: '#17171b', color: '#d8d4cc', border: 'none', borderRight: '1px solid #33312c' }}>
            Reset
          </button>
          <button onClick={copyCss} style={{ flex: 1, padding: '11px', cursor: 'pointer', font: "700 9px 'JetBrains Mono', monospace", letterSpacing: '0.16em', textTransform: 'uppercase', background: '#e8920a', color: '#101013', border: 'none' }}>
            {copied ? 'Copied ✓' : 'Copy CSS'}
          </button>
        </div>
        <div style={{ padding: '6px 14px', fontSize: '8px', color: '#55514a', letterSpacing: '0.06em', borderTop: '1px solid #26241f', textAlign: 'center' }}>
          <b>T</b> toggles · changes persist locally, not shipped
        </div>
      </div>
    </>
  );
}

function ContrastReadout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const read = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const rows = PAIRS.map(([label, fg, bg, min]) => {
    const f = read(fg), b = read(bg);
    if (!f.startsWith('#') || !b.startsWith('#')) return null;
    const r = ratio(f, b);
    return { label, r, pass: r >= min, near: r < min && r >= min - 1 };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const anyFail = rows.some(r => !r.pass);

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid #33312c', background: '#131316', padding: '7px 14px 8px', fontSize: '8px', letterSpacing: '0.06em' }}>
      <h4 style={{ fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#6a6560', fontWeight: 400, marginBottom: '5px' }}>
        Contrast · WCAG AA{anyFail ? ' — issues' : ''}
      </h4>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5px 0', color: '#8a857c' }}>
          <span>{r.label}</span>
          <span style={{ color: r.pass ? '#4ba36a' : r.near ? '#d9a41f' : '#d9503f' }}>
            {r.r.toFixed(2)}:1 {r.pass ? '✓' : '✕'}
          </span>
        </div>
      ))}
    </div>
  );
}
