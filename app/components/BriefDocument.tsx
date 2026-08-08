// Pure presentational — no 'use client', no hooks, no Next.js imports.
// Works in renderToStaticMarkup for PDF generation and in React tree for screen.

import type { VisaBrief } from '@/src/types/index';
import { DEPTH_LABEL } from '@/src/lib/depth';

export interface BriefDocumentMeta {
  nationality: string;
  destination: string;
  briefId?: string;
  generatedAt: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function noDash(text: string): string {
  return text.replace(/ — /g, '. ').replace(/—/g, '. ');
}

function fmt(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return isoDate; }
}

function zeroPad(n: number): string { return n < 10 ? `0${n}` : String(n); }

function urlDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function withLinks(text: string): string {
  return noDash(text).replace(
    /(https?:\/\/[^\s<>"()\[\]{};,]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--accent-ink);word-break:break-all;text-decoration:underline;">$1</a>',
  );
}

function confLabel(c: 'high' | 'medium' | 'low' | undefined): string {
  if (c === 'high') return 'High';
  if (c === 'medium') return 'Med';
  if (c === 'low') return 'Low';
  return '—';
}

function confTagClass(c: 'high' | 'medium' | 'low' | undefined): string {
  if (c === 'high') return 'ctag hi';
  if (c === 'medium') return 'ctag md';
  if (c === 'low') return 'ctag';
  return 'ctag na';
}

function deadlineDays(dl?: string | null): string {
  if (!dl) return '—';
  const m = dl.match(/(\d+)\s*day/i);
  if (m) return m[1];
  return '—';
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.doc {
  --stage:        #060c12;
  --ground:       #060c12;
  --ground-up:    #0a1520;
  --ground-sub:   #0e1c28;
  --rim:          #1e3040;
  --rim-soft:     #16242f;
  --accent:       #c8780a;
  --accent-ink:   #c8780a;
  --accent-hot:   #e8940e;
  --accent-wash:  rgba(200,120,10,0.07);
  --accent-rim:   rgba(200,120,10,0.34);
  --ink:          #dceaf6;
  --ink-2:        #8fb2c8;
  --ink-3:        #5f849e;
  --ink-4:        #54809d;
  --ok:           #10b981;
  --ok-wash:      rgba(16,185,129,0.10);
  --bad:          #e0574a;
  --bad-wash:     rgba(224,87,74,0.10);
  --radius:       0px;
  --chrome:       block;
  --chrome-flex:  flex;
  --texture:      1;
  --nav-h:        0px;
  --break:        auto;
  --scrollx:      auto;

  --sheet-w:      1180px;
  --sheet-pad:    46px 0 70px;
  --sec-gap:      42px;
  --num-size:     52px;
  --title-size:   30px;

  --rail-w:       268px;
  --rail-pos:     sticky;
  --rail-gap:     40px;
  --grid-cols:    var(--rail-w) minmax(0,1fr);

  background: var(--stage);
  color: var(--ink-2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 100vh;
}

.doc[data-mode="print"] {
  --stage: #ffffff; --ground: #ffffff; --ground-up: #f0f0f0; --ground-sub: #e4e4e4;
  --rim: #aaaaaa; --rim-soft: #d4d4d4;
  --accent: #111111; --accent-ink: #111111; --accent-hot: #000000;
  --accent-wash: #eeeeee; --accent-rim: #888888;
  --ink: #0a0a0a; --ink-2: #2a2a2a; --ink-3: #555555; --ink-4: #777777;
  --ok: #0a0a0a; --ok-wash: #eeeeee; --bad: #555555; --bad-wash: #e6e6e6;
  --chrome: none; --chrome-flex: none; --texture: 0; --break: avoid; --scrollx: visible;

  --sheet-w:    210mm;
  --sheet-pad:  16mm 15mm 18mm;
  --sec-gap:    26px;
  --num-size:   40px;
  --title-size: 23px;

  --rail-pos:   static;
  --rail-w:     0px;
  --rail-gap:   0px;
  --grid-cols:  minmax(0,1fr);
}

@media print {
  .doc {
    --stage: #ffffff; --ground: #ffffff; --ground-up: #f0f0f0; --ground-sub: #e4e4e4;
    --rim: #aaaaaa; --rim-soft: #d4d4d4;
    --accent: #111111; --accent-ink: #111111; --accent-hot: #000000;
    --accent-wash: #eeeeee; --accent-rim: #888888;
    --ink: #0a0a0a; --ink-2: #2a2a2a; --ink-3: #555555; --ink-4: #777777;
    --ok: #0a0a0a; --ok-wash: #eeeeee; --bad: #555555; --bad-wash: #e6e6e6;
    --chrome: none; --chrome-flex: none; --texture: 0; --break: avoid; --scrollx: visible;
    --sheet-w: 100%; --sheet-pad: 0; --sec-gap: 24px;
    --num-size: 40px; --title-size: 23px;
    --rail-pos: static; --rail-w: 0px; --rail-gap: 0px; --grid-cols: minmax(0,1fr);
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
  .doc::before { display: none !important; }
}

.doc::before {
  content: '';
  position: fixed; inset: 0; z-index: 0;
  opacity: var(--texture);
  pointer-events: none;
  background-image:
    repeating-radial-gradient(ellipse 52% 40% at 18% 30%,
      transparent 0, transparent 58px, rgba(200,120,10,0.028) 59px, transparent 60px),
    repeating-radial-gradient(ellipse 64% 46% at 86% 70%,
      transparent 0, transparent 74px, rgba(30,48,64,0.34) 75px, transparent 76px);
}

/* ── SHEET + GRID ──────────────────────────────────────────────── */
.sheet {
  position: relative; z-index: 1;
  width: 100%; max-width: var(--sheet-w);
  margin: 0 auto; padding: var(--sheet-pad);
  background: var(--ground);
}
.grid { display: grid; grid-template-columns: var(--grid-cols); }

/* ── RAIL ──────────────────────────────────────────────────────── */
.rail {
  position: var(--rail-pos);
  top: calc(var(--nav-h) + 22px);
  align-self: start;
  min-width: 0;
  max-height: calc(100vh - var(--nav-h) - 42px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--rim) transparent;
}
.doc[data-mode="print"] .rail { display: none !important; }
@media print { .rail { display: none !important; } }

/* Rail panel primitive */
.rp { border: 1px solid var(--rim); }
.rp + .rp { margin-top: 16px; }
.rp-h {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 11px;
  background: var(--ground-up);
  border-bottom: 1px solid var(--rim);
  font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--accent-ink); white-space: nowrap;
}
.rp-h i { flex: 1; height: 1px; min-width: 10px; display: block;
  background: linear-gradient(to right, var(--accent-rim), transparent); }
.rp-h .ct { color: var(--ink-4); letter-spacing: 0.14em; }
.rp-b { padding: 12px 11px; }

/* Panel 1 — route identity */
.route {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 27px; font-weight: 900; line-height: 0.94;
  text-transform: uppercase; letter-spacing: -0.005em; color: var(--ink);
}
.route em { font-style: normal; color: var(--accent-ink); }
.route-sub {
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--rim-soft);
  font-size: 8.5px; letter-spacing: 0.11em; color: var(--ink-4); line-height: 1.95; text-transform: uppercase;
}
.route-sub b { color: var(--ink-3); font-weight: 700; }

/* Panel 2 — confidence ledger */
.led-hero { padding: 12px 12px 13px; background: var(--ground-up); }
.led-hero .l { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-4); }
.led-hero .v {
  margin-top: 6px;
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 30px; line-height: 1; letter-spacing: 0.035em;
  text-transform: uppercase; color: var(--ok);
}
.bars { display: flex; gap: 4px; margin-top: 10px; }
.bars i { flex: 1; height: 6px; background: var(--rim); display: block; }
.bars i.on { background: var(--ok); }
.bars i.mid { background: var(--accent); }

.metrics { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--rim); }
.m-cell { padding: 10px 12px; border-right: 1px solid var(--rim-soft); border-bottom: 1px solid var(--rim-soft); }
.m-cell:nth-child(2n) { border-right: none; }
.m-cell:nth-last-child(-n+2) { border-bottom: none; }
.m-k { font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 6px; }
.m-v {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 24px; line-height: 1; color: var(--accent-ink);
}
.m-v.good { color: var(--ok); }
.m-v.nil { color: var(--ink-4); }

/* Panel 3 — contents TOC */
.toc { list-style: none; }
.toc li { border-bottom: 1px solid var(--rim-soft); }
.toc li:last-child { border-bottom: none; }
.toc a {
  display: grid; grid-template-columns: 19px minmax(0,1fr) auto;
  align-items: center; gap: 9px;
  padding: 7px 11px 7px 9px;
  border-left: 2px solid transparent;
  text-decoration: none;
  font-size: 10px; letter-spacing: 0.02em; color: var(--ink-3);
}
.toc a:hover { color: var(--ink); background: var(--ground-up); }
.toc a.on { color: var(--ink); border-left-color: var(--accent); background: var(--accent-wash); }
.toc .n { font-size: 8px; letter-spacing: 0.13em; color: var(--ink-4); }
.toc a.on .n { color: var(--accent-ink); }
.toc .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ctag {
  font-size: 8px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  border: 1px solid var(--rim-soft);
  padding: 2px 5px; white-space: nowrap; color: var(--ink-4);
}
.ctag.hi { color: var(--ok); border-color: rgba(16,185,129,0.32); }
.ctag.md { color: var(--accent-ink); border-color: var(--accent-rim); }
.ctag.na { color: var(--ink-4); }

.rp-foot {
  padding: 9px 11px; border-top: 1px solid var(--rim-soft);
  font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); line-height: 1.8;
}

/* ── BODY + MASTHEAD ───────────────────────────────────────────── */
.body { padding-left: var(--rail-gap); min-width: 0; }
.doc[data-mode="print"] .body { padding-left: 0; }

.mast { border: 1px solid var(--rim); page-break-inside: var(--break); }
.mast-top {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;
  padding: 20px 20px 16px; border-bottom: 1px solid var(--rim);
}
.mast-kicker {
  font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--accent-ink); margin-bottom: 8px;
}
.mast-title {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: clamp(30px, 4vw, 46px); line-height: 0.9;
  letter-spacing: 0.005em; text-transform: uppercase; color: var(--ink);
}
.mast-title .arr { color: var(--accent-ink); margin: 0 0.14em; }
.mast-seal { text-align: right; white-space: nowrap; }
.mast-seal .id {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 19px;
  letter-spacing: 0.1em; color: var(--accent-ink);
}
.mast-seal .st { margin-top: 5px; font-size: 8.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-4); line-height: 1.9; }

.metastrip { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); }
.metastrip > div { padding: 12px 14px; border-left: 1px solid var(--rim-soft); }
.metastrip > div:first-child { border-left: none; }
.metastrip .l { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-4); }
.metastrip .v {
  margin-top: 6px; font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
  font-size: 19px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink); line-height: 1;
}
.metastrip .v.hot { color: var(--accent-ink); }
.metastrip .v.good { color: var(--ok); }

/* ── SECTION HEADER ────────────────────────────────────────────── */
.sec { margin-top: var(--sec-gap); scroll-margin-top: calc(var(--nav-h) + 18px); }
.sh {
  display: flex; align-items: baseline; gap: 14px;
  padding-bottom: 10px; margin-bottom: 14px;
  border-bottom: 1px solid var(--rim);
  page-break-after: avoid;
}
.sh-n {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: var(--num-size); line-height: 0.78;
  letter-spacing: -0.01em; color: var(--accent-ink);
}
.sh-t {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
  font-size: var(--title-size); letter-spacing: 0.045em;
  text-transform: uppercase; color: var(--ink); line-height: 1;
}
.sh-rule { flex: 1; height: 1px; background: var(--rim); align-self: center; }
.sh-meta { font-size: 8.5px; letter-spacing: 0.17em; text-transform: uppercase; color: var(--ink-4); white-space: nowrap; }

.sh-toggle {
  display: var(--chrome-flex);
  align-self: center; flex-shrink: 0;
  width: 22px; height: 22px;
  border: 1px solid var(--rim); background: transparent; color: var(--ink-4);
  cursor: pointer;
  align-items: center; justify-content: center;
}
.sh-toggle:hover { color: var(--ink); border-color: var(--accent-rim); }
.sh-toggle svg { width: 12px; height: 12px; transition: transform 0.15s; display: block; }
.sec.collapsed .sh-toggle svg { transform: rotate(-90deg); }
.sec.collapsed > *:not(.sh) { display: none; }
@media print { .sec.collapsed > *:not(.sh) { display: block !important; } }
.doc[data-mode="print"] .sec.collapsed > *:not(.sh) { display: block !important; }

/* Gated sections get no toggle at quick depth */
.doc[data-depth="quick"] #s5 .sh-toggle,
.doc[data-depth="quick"] #s7 .sh-toggle,
.doc[data-depth="quick"] #s9 .sh-toggle { display: none; }

/* wide tables scroll in-place */
.scrollx { overflow-x: var(--scrollx); }

/* ── KEY/VALUE GRID ─────────────────────────────────────────────── */
.kv { border: 1px solid var(--rim); page-break-inside: var(--break); }
.kv-r { display: grid; grid-template-columns: 214px minmax(0,1fr); border-bottom: 1px solid var(--rim-soft); }
.kv-r:last-child { border-bottom: none; }
.kv-k {
  padding: 11px 14px; background: var(--ground-up);
  border-right: 1px solid var(--rim-soft);
  font-size: 9px; letter-spacing: 0.17em; text-transform: uppercase; color: var(--ink-4);
}
.kv-v { padding: 11px 16px; color: var(--ink); }
.kv-v .dim { color: var(--ink-3); }
.kv-v .hot { color: var(--accent-ink); font-weight: 700; }

/* ── RECOMMENDED ACTION ────────────────────────────────────────── */
.act {
  border: 1px solid var(--accent-rim);
  border-top: 3px solid var(--accent);
  background: var(--accent-wash);
  page-break-inside: var(--break);
}
.act-body { display: grid; grid-template-columns: minmax(0,1fr) 190px; }
.act-main { padding: 18px 20px; }
.act-lab { font-size: 8.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-ink); }
.act-head {
  margin-top: 9px;
  font-family: 'Barlow Condensed', sans-serif; font-weight: 800;
  font-size: 25px; line-height: 1.06; letter-spacing: 0.015em;
  text-transform: uppercase; color: var(--ink);
}
.act-note { margin-top: 11px; font-size: 11.5px; line-height: 1.72; color: var(--ink-2); }
.act-clock {
  border-left: 1px solid var(--accent-rim);
  padding: 18px; text-align: center;
  display: flex; flex-direction: column; justify-content: center;
}
.act-clock .n {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 68px; line-height: 0.8; color: var(--accent-ink);
}
.act-clock .u { margin-top: 8px; font-size: 8.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
.act-foot {
  border-top: 1px solid var(--accent-rim);
  padding: 11px 20px;
  display: flex; gap: 24px; flex-wrap: wrap;
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-3);
}
.act-foot b { color: var(--ink); font-weight: 700; }

/* ── DATA TABLES ────────────────────────────────────────────────── */
table.tbl {
  width: 100%; border-collapse: collapse;
  border: 1px solid var(--rim);
  page-break-inside: var(--break);
}
table.tbl thead th {
  background: var(--ground-up);
  padding: 10px 12px; text-align: left; vertical-align: bottom;
  border-bottom: 1px solid var(--rim);
  border-right: 1px solid var(--rim-soft);
  font-size: 8px; font-weight: 700; letter-spacing: 0.19em;
  text-transform: uppercase; color: var(--ink-4); white-space: nowrap;
}
table.tbl thead th:last-child { border-right: none; }
table.tbl tbody td {
  padding: 12px; vertical-align: top;
  border-bottom: 1px solid var(--rim-soft);
  border-right: 1px solid var(--rim-soft);
  color: var(--ink-2); font-size: 11.5px; line-height: 1.62;
}
table.tbl tbody td:last-child { border-right: none; }
table.tbl tbody tr:last-child td { border-bottom: none; }
table.tbl .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
table.tbl .name {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 17px;
  letter-spacing: 0.035em; text-transform: uppercase; color: var(--ink); line-height: 1.12;
}
table.tbl .code { display: block; margin-top: 4px; font-size: 8.5px; letter-spacing: 0.16em; color: var(--ink-4); }
table.tbl .noterow td {
  background: var(--ground-up); padding: 10px 12px;
  font-size: 10.5px; color: var(--ink-3); line-height: 1.72;
}
table.tbl .noterow .m {
  color: var(--accent-ink); font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; font-size: 8.5px; margin-right: 9px;
}
tr.fit-best td { background: var(--ok-wash); border-top: 1px solid var(--ok); }
tr.fit-best + tr.noterow td { background: var(--ok-wash); border-bottom: 1px solid var(--ok); }

/* chip + meter */
.chip {
  display: inline-block;
  border: 1px solid var(--rim); background: transparent;
  padding: 4px 8px; font-size: 8.5px; font-weight: 700;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-3); white-space: nowrap;
}
.chip.best { border-color: var(--ok); color: var(--ok); background: var(--ok-wash); }
.chip.good { border-color: var(--accent-rim); color: var(--accent-ink); background: var(--accent-wash); }
.chip.cond { border-color: var(--rim); color: var(--ink-3); }
.chip.t1 { border-color: var(--accent-rim); color: var(--accent-ink); }
.chip.t4 { border-color: var(--rim); color: var(--ink-4); }

.meter { display: inline-flex; gap: 3px; align-items: center; }
.meter i { display: block; width: 11px; height: 9px; border: 1px solid var(--rim); }
.meter i.on { background: var(--accent); border-color: var(--accent); }
.meter i.on.lo { background: var(--ok); border-color: var(--ok); }
.meter i.on.hi { background: var(--bad); border-color: var(--bad); }
.meter .lbl { margin-left: 8px; font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4); }

/* ── CHECKLIST GRID ────────────────────────────────────────────── */
.chk { border: 1px solid var(--rim); page-break-inside: var(--break); }
.chk-r {
  display: grid; grid-template-columns: 44px minmax(0,1fr) 230px 80px;
  border-bottom: 1px solid var(--rim-soft); align-items: stretch;
}
.chk-r:last-child { border-bottom: none; }
.chk-r > div { padding: 12px 14px; border-right: 1px solid var(--rim-soft); }
.chk-r > div:last-child { border-right: none; }
.chk-box { display: flex; align-items: center; justify-content: center; background: var(--ground-up); color: var(--accent-ink); font-weight: 700; font-size: 13px; }
.chk-name { color: var(--ink); font-size: 12px; }
.chk-spec { color: var(--ink-3); font-size: 11px; }
.chk-src { font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4); text-align: right; }

/* ── ALERT BLOCK ────────────────────────────────────────────────── */
.alert {
  border: 1px solid var(--accent-rim);
  background: var(--accent-wash);
  padding: 15px 17px;
  page-break-inside: var(--break);
}
.alert + .alert { margin-top: 12px; }
.alert.calm { border-color: var(--rim); background: var(--ground-up); }
.alert-h {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 19px;
  letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink); line-height: 1.1;
}
.alert-h .flag { font-size: 12px; color: var(--accent-ink); font-family: 'JetBrains Mono', monospace; font-weight: 700; }
.alert-d { margin-top: 4px; font-size: 8.5px; letter-spacing: 0.17em; text-transform: uppercase; color: var(--ink-4); }
.alert-b { margin-top: 10px; font-size: 11.5px; line-height: 1.74; color: var(--ink-2); }
.alert-meta {
  margin-top: 11px; padding-top: 9px; border-top: 1px solid var(--accent-rim);
  display: flex; gap: 20px; flex-wrap: wrap;
  font-size: 8.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4);
}
.alert.calm .alert-meta { border-top-color: var(--rim-soft); }
.alert-meta b { color: var(--ink-3); font-weight: 700; }

/* ── DEPTH GATE ─────────────────────────────────────────────────── */
.lockcard {
  display: none; align-items: center; gap: 14px;
  border: 1px solid var(--rim); background: var(--ground-up);
  padding: 18px 20px;
}
.lock-icon { color: var(--ink-4); flex-shrink: 0; }
.lock-icon svg { width: 16px; height: 16px; display: block; }
.lock-text { font-size: 11.5px; color: var(--ink-4); line-height: 1.75; }
.lock-link { color: var(--accent-ink); text-decoration: underline; }

.doc[data-depth="quick"] #s5 .gatecontent,
.doc[data-depth="quick"] #s7 .gatecontent,
.doc[data-depth="quick"] #s9 .gatecontent { display: none; }
.doc[data-depth="quick"] #s5 .lockcard,
.doc[data-depth="quick"] #s7 .lockcard,
.doc[data-depth="quick"] #s9 .lockcard { display: flex; }

.doc[data-mode="print"][data-depth="quick"] #s5,
.doc[data-mode="print"][data-depth="quick"] #s7,
.doc[data-mode="print"][data-depth="quick"] #s9 { display: none !important; }
@media print {
  .doc[data-depth="quick"] #s5,
  .doc[data-depth="quick"] #s7,
  .doc[data-depth="quick"] #s9 { display: none !important; }
}

/* ── VERDICT / STATUS MARKS ────────────────────────────────────── */
.vd { font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; font-size: 9px; white-space: nowrap; }
.vd.ok { color: var(--ok); }
.vd.warn { color: var(--accent-ink); }
.vd.bad { color: var(--bad); }
.vd.dim { color: var(--ink-4); }

/* ── CONFIDENCE READOUT ─────────────────────────────────────────── */
.conf {
  margin-top: 16px; border: 1px solid var(--rim);
  display: grid; grid-template-columns: 230px minmax(0,1fr);
  page-break-inside: var(--break);
}
.conf-l { padding: 16px 18px; border-right: 1px solid var(--rim-soft); background: var(--ground-up); }
.conf-l .l { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-4); }
.conf-l .v {
  margin-top: 7px; font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 30px; line-height: 1; letter-spacing: 0.03em; text-transform: uppercase; color: var(--ok);
}
.conf-r { padding: 16px 18px; font-size: 11.5px; line-height: 1.74; color: var(--ink-2); }

/* ── FOOTER ─────────────────────────────────────────────────────── */
.docfoot { margin-top: 34px; padding-top: 16px; border-top: 1px solid var(--rim); page-break-inside: var(--break); }
.disc { display: grid; grid-template-columns: auto 1fr; gap: 12px; font-size: 10px; line-height: 1.85; color: var(--ink-3); }
.disc .m { font-size: 8.5px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-ink); white-space: nowrap; }
.colophon {
  margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--rim-soft);
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4);
}

/* ── RESPONSIVE ─────────────────────────────────────────────────── */
@media (max-width: 1240px) {
  .doc { --sheet-pad: 34px 22px 60px; --rail-w: 244px; --rail-gap: 30px; }
}
@media (max-width: 1000px) {
  .doc { --grid-cols: minmax(0,1fr); --rail-pos: static; --rail-w: 100%; --rail-gap: 0px; }
  .rail { max-height: none; overflow: visible; margin-bottom: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
  .rp + .rp { margin-top: 0; }
  .rail .rp:last-child { grid-column: 1 / -1; }
  .toc { display: grid; grid-template-columns: 1fr 1fr; }
  .toc li:nth-last-child(2) { border-bottom: none; }
  .toc li:nth-child(odd) { border-right: 1px solid var(--rim-soft); }
}
@media (max-width: 780px) {
  .doc { --num-size: 42px; --title-size: 24px; }
  .rail { grid-template-columns: 1fr; }
  .toc { grid-template-columns: 1fr; }
  .toc li:nth-child(odd) { border-right: none; }
  .toc li:nth-last-child(2) { border-bottom: 1px solid var(--rim-soft); }
  .metastrip { grid-template-columns: 1fr 1fr; }
  .metastrip > div { border-left: none; border-top: 1px solid var(--rim-soft); }
  .metastrip > div:nth-child(-n+2) { border-top: none; }
  .metastrip > div:nth-child(even) { border-left: 1px solid var(--rim-soft); }
  .act-body { grid-template-columns: minmax(0,1fr); }
  .act-clock { border-left: none; border-top: 1px solid var(--accent-rim); }
  .kv-r { grid-template-columns: minmax(0,1fr); }
  .kv-k { border-right: none; border-bottom: 1px solid var(--rim-soft); }
  .chk-r { grid-template-columns: 40px minmax(0,1fr); }
  .chk-r > div:nth-child(3), .chk-r > div:nth-child(4) { grid-column: 2; border-top: 1px solid var(--rim-soft); border-right: none; text-align: left; }
  .conf { grid-template-columns: minmax(0,1fr); }
  .conf-l { border-right: none; border-bottom: 1px solid var(--rim-soft); }
}
`;

// Collapse toggle + TOC scroll-spy (screen-only progressive enhancement)
// Executes on initial HTML parse. For SPA navigation, collapse is non-functional
// but all sections remain visible — acceptable since default state is open.
const TOGGLE_JS = `
(function(){
  document.querySelectorAll('.sh-toggle').forEach(function(btn){
    btn.addEventListener('click',function(){
      var sec=btn.closest('.sec');
      var collapsed=sec.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded',collapsed?'false':'true');
    });
  });
  var links=[].slice.call(document.querySelectorAll('#bd-toc a'));
  var targets=links.map(function(a){return document.querySelector(a.getAttribute('href'));});
  if(!links.length)return;
  var spy=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      var i=targets.indexOf(en.target);
      links.forEach(function(a,n){a.classList.toggle('on',n===i);});
    });
  },{rootMargin:'-78px 0px -62% 0px',threshold:0});
  targets.forEach(function(t){t&&spy.observe(t);});
  links[0].classList.add('on');
})();
`;

// ── small shared components ────────────────────────────────────────────────

function ConfBars({ level }: { level: 'high' | 'medium' | 'low' }) {
  if (level === 'high') return (
    <div className="bars"><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i className="mid" /></div>
  );
  if (level === 'medium') return (
    <div className="bars"><i className="on" /><i className="on" /><i className="mid" /><i /><i /></div>
  );
  return <div className="bars"><i className="mid" /><i /><i /><i /><i /></div>;
}

function Meter({ suitability }: { suitability: 'best' | 'good' | 'acceptable' }) {
  if (suitability === 'best') return (
    <span className="meter"><i className="on lo" /><i /><i /><i /><i /><span className="lbl">Low</span></span>
  );
  if (suitability === 'good') return (
    <span className="meter"><i className="on" /><i className="on" /><i /><i /><i /><span className="lbl">Medium</span></span>
  );
  return (
    <span className="meter"><i className="on hi" /><i className="on hi" /><i className="on hi" /><i className="on hi" /><i /><span className="lbl">High</span></span>
  );
}

function TierChip({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  const cls = tier === 1 ? 'chip t1' : tier === 4 ? 'chip t4' : 'chip';
  return <span className={cls}>Tier {tier}</span>;
}

function SuitChip({ suitability }: { suitability: 'best' | 'good' | 'acceptable' }) {
  if (suitability === 'best') return <span className="chip best">Best fit</span>;
  if (suitability === 'good') return <span className="chip good">Good fit</span>;
  return <span className="chip cond">Conditional</span>;
}

const CHEVRON_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const LOCK_SVG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="square">
    <rect x={3} y={11} width={18} height={11} rx={0} />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Sh({ n, title, meta }: { n: number; title: string; meta?: string }) {
  return (
    <header className="sh">
      <span className="sh-n">{zeroPad(n)}</span>
      <span className="sh-t">{title}</span>
      <span className="sh-rule" />
      {meta && <span className="sh-meta">{meta}</span>}
      <button className="sh-toggle" aria-expanded="true" aria-label="Collapse section" title="Collapse section">
        {CHEVRON_SVG}
      </button>
    </header>
  );
}

function LockCard({ title }: { title: string }) {
  return (
    <div className="lockcard">
      <span className="lock-icon" aria-hidden="true">{LOCK_SVG}</span>
      <span className="lock-text">
        {title} included in <a className="lock-link" href="/app?depth=standard">Intel and Dossier</a>.
      </span>
    </div>
  );
}

// ── section labels + conf keys ────────────────────────────────────────────────

const SECTION_LABELS: [string, string][] = [
  ['s1', 'Parsed Situation'],
  ['s2', 'Recommended Action'],
  ['s3', 'Visa Options'],
  ['s4', 'Entry Requirements'],
  ['s5', 'Border Run Analysis'],
  ['s6', 'Recent Changes'],
  ['s7', 'Conflict Report'],
  ['s8', 'Source Citations'],
  ['s9', 'Contingency'],
];

const SECTION_CONF_KEYS: Array<string | undefined> = [
  undefined,
  'recommendedAction',
  'visaOptions',
  'entryRequirements',
  'borderRun',
  'recentChanges',
  'conflictReport',
  undefined,
  'contingency',
];

// ── section renderers ──────────────────────────────────────────────────────────

function ParsedSituationSection({ brief, meta }: { brief: VisaBrief; meta: BriefDocumentMeta }) {
  const depth = brief.metadata.depth;
  const depthFull = DEPTH_LABEL[depth as 'quick' | 'standard' | 'deep'] ?? depth;
  return (
    <section className="sec" id="s1">
      <Sh n={1} title="Parsed Situation" meta="Agent · Orchestrator" />
      <div className="kv">
        <div className="kv-r">
          <div className="kv-k">Nationality</div>
          <div className="kv-v">{meta.nationality}</div>
        </div>
        <div className="kv-r">
          <div className="kv-k">Destination</div>
          <div className="kv-v">{meta.destination}</div>
        </div>
        <div className="kv-r">
          <div className="kv-k">Analysis depth</div>
          <div className="kv-v">{depthFull}</div>
        </div>
        <div className="kv-r">
          <div className="kv-k">Situation</div>
          <div className="kv-v">{noDash(brief.parsedSituation)}</div>
        </div>
      </div>
    </section>
  );
}

function RecommendedActionSection({ brief }: { brief: VisaBrief }) {
  const ra = brief.recommendedAction;
  const daysNum = deadlineDays(ra.deadline);
  return (
    <section className="sec" id="s2">
      <Sh n={2} title="Recommended Action" meta="Agent · Synthesis" />
      <div className="act">
        <div className="act-body">
          <div className="act-main">
            <div className="act-lab">Primary directive</div>
            <div className="act-head">{noDash(ra.action)}</div>
            <p className="act-note">{noDash(ra.rationale)}</p>
            {ra.stalePolicyWarning && (
              <p className="act-note" style={{ color: 'var(--accent-ink)', marginTop: '10px' }}>
                {noDash(ra.stalePolicyWarning)}
              </p>
            )}
          </div>
          <div className="act-clock">
            <div className="n">{daysNum}</div>
            <div className="u">Days<br />remaining</div>
          </div>
        </div>
        <div className="act-foot">
          {ra.deadline && <span>Deadline <b>{ra.deadline}</b></span>}
          <span>Urgency <b>{ra.urgency.toUpperCase()}</b></span>
        </div>
      </div>
    </section>
  );
}

function VisaOptionsSection({ brief }: { brief: VisaBrief }) {
  const options = brief.visaOptions;
  return (
    <section className="sec" id="s3">
      <Sh n={3} title="Visa Options" meta={`Agent · Official Policy · ${options.length} ranked`} />
      <div className="scrollx">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Instrument</th>
              <th style={{ width: '14%' }}>Duration</th>
              <th style={{ width: '16%' }}>Apply</th>
              <th style={{ width: '16%' }}>Suitability</th>
              <th style={{ width: '22%' }}>Friction</th>
            </tr>
          </thead>
          <tbody>
            {options.length === 0 ? (
              <tr><td colSpan={5} style={{ color: 'var(--ink-4)' }}>No visa options available.</td></tr>
            ) : options.flatMap((opt, i) => [
              <tr key={`opt-${i}`} className={opt.suitability === 'best' ? 'fit-best' : undefined}>
                <td><span className="name">{opt.name}</span></td>
                <td className="num">{opt.maxStay}</td>
                <td>
                  {opt.applicationUrl
                    ? <a href={opt.applicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-ink)', textDecoration: 'underline' }}>Apply online</a>
                    : <span style={{ color: 'var(--ink-4)' }}>&mdash;</span>}
                </td>
                <td><SuitChip suitability={opt.suitability} /></td>
                <td><Meter suitability={opt.suitability} /></td>
              </tr>,
              <tr key={`note-${i}`} className="noterow">
                <td colSpan={5}>
                  <span className="m">Note</span>
                  {noDash(opt.summary)}
                  {opt.cons.length > 0 && (
                    <span style={{ color: 'var(--ink-4)', marginLeft: '8px' }}>
                      {opt.cons.map(noDash).join('. ')}.
                    </span>
                  )}
                </td>
              </tr>,
            ])}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EntryRequirementsSection({ brief }: { brief: VisaBrief }) {
  const req = brief.entryRequirements;
  const conf = (brief.confidenceScore.perSection ?? {})['entryRequirements'];

  type ChkItem = { name: string; spec: string; src: string };
  const items: ChkItem[] = [];
  for (const doc of req.documents) items.push({ name: doc, spec: '', src: 'T1' });
  if (req.proofOfFunds) items.push({ name: 'Proof of funds', spec: req.proofOfFunds, src: 'T1' });
  items.push({ name: 'Onward ticket', spec: req.onwardTicket ? 'Required' : 'Not required', src: 'T1' });
  for (const h of req.health) items.push({ name: 'Health', spec: h, src: 'T2' });
  for (const n of req.notes) items.push({ name: 'Note', spec: n, src: 'T4' });

  return (
    <section className="sec" id="s4">
      <Sh n={4} title="Entry Requirements" meta={`Agent · Entry Requirements · ${items.length} items${conf ? ` · Conf ${conf}` : ''}`} />
      <div className="chk">
        {items.map((item, i) => (
          <div key={i} className="chk-r">
            <div className="chk-box">&#10003;</div>
            <div className="chk-name">{noDash(item.name)}</div>
            <div className="chk-spec">{noDash(item.spec)}</div>
            <div className="chk-src">{item.src}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BorderRunSection({ brief }: { brief: VisaBrief }) {
  const analysis = brief.borderRunAnalysis;
  const depth = brief.metadata.depth;
  return (
    <section className="sec" id="s5">
      <Sh n={5} title="Border Run Analysis" meta="Agent · Border Run · T1 + T4 blend" />

      <div className="gatecontent">
        <div className="scrollx">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Vector</th>
                <th style={{ width: '36%' }}>Route / details</th>
                <th style={{ width: '20%' }}>Annual cap</th>
                <th style={{ width: '28%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!analysis.eligible ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--ink-3)' }}>
                    Border runs not applicable for this combination.
                  </td>
                </tr>
              ) : analysis.recommendedCrossings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--ink-3)' }}>
                    {noDash(analysis.enforcementPosture)}
                    {analysis.limitsPerYear && <span> Annual cap: {analysis.limitsPerYear}.</span>}
                  </td>
                </tr>
              ) : (
                <>
                  {analysis.recommendedCrossings.map((crossing, i) => (
                    <tr key={i}>
                      <td><span className="name">Option {i + 1}</span></td>
                      <td>{noDash(crossing)}</td>
                      <td className="num">{analysis.limitsPerYear ?? <span className="vd ok">No hard cap</span>}</td>
                      <td><span className="vd ok">Open</span></td>
                    </tr>
                  ))}
                  <tr className="noterow">
                    <td colSpan={4}>
                      <span className="m">Enforcement posture</span>
                      {noDash(analysis.enforcementPosture)}
                    </td>
                  </tr>
                  {analysis.warnings.map((w, i) => (
                    <tr key={`w-${i}`} className="noterow">
                      <td colSpan={4}><span className="m">Warning</span>{noDash(w)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LockCard title="Border Run Analysis" />
    </section>
  );
}

function RecentChangesSection({ brief }: { brief: VisaBrief }) {
  const changes = brief.recentChanges;
  if (!changes.hasChanges && changes.items.length === 0 && changes.watchItems.length === 0) return null;
  return (
    <section className="sec" id="s6">
      <Sh n={6} title="Recent Changes" meta="Agent · Recent Changes · 90-day window" />
      {changes.items.map((item, i) => (
        <div key={i} className="alert">
          <div className="alert-h"><span className="flag">&#9888;</span>{noDash(item).split('.')[0]}</div>
          {noDash(item).split('.').slice(1).join('.').trim() && (
            <p className="alert-b">{noDash(item).split('.').slice(1).join('.').trim()}.</p>
          )}
          <div className="alert-meta">
            <span>Window <b>90 days</b></span>
            <span>Source <b>Recent Changes agent</b></span>
          </div>
        </div>
      ))}
      {changes.watchItems.map((item, i) => (
        <div key={`w-${i}`} className="alert calm">
          <div className="alert-h">{noDash(item).split('.')[0]}</div>
          {noDash(item).split('.').slice(1).join('.').trim() && (
            <p className="alert-b">{noDash(item).split('.').slice(1).join('.').trim()}.</p>
          )}
          <div className="alert-meta">
            <span>Status <b>Watch item</b></span>
          </div>
        </div>
      ))}
    </section>
  );
}

function ConflictSection({ brief }: { brief: VisaBrief }) {
  const report = brief.conflictReport;
  const total = report.confirmed.length + report.contested.length + report.unverified.length;
  const overallConf = brief.confidenceScore.overall;
  const t1Count = brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length;

  type Row = { topic: string; description: string; sources: string[]; resolution?: string; status: 'confirmed' | 'contested' | 'unverified' };
  const rows: Row[] = [
    ...report.confirmed.map(item => ({ ...item, status: 'confirmed' as const })),
    ...report.contested.map(item => ({ ...item, status: 'contested' as const })),
    ...report.unverified.map(item => ({ ...item, status: 'unverified' as const })),
  ];

  return (
    <section className="sec" id="s7">
      <Sh n={7} title="Conflict Report" meta={`Agent · Conflict Resolver · ${total} items`} />

      <div className="gatecontent">
        <div className="scrollx">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Topic</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '36%' }}>Agent verdicts</th>
                <th style={{ width: '30%' }}>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={4} style={{ color: 'var(--ink-3)' }}>No conflicts detected. All sources in agreement.</td></tr>
              ) : rows.map((row, i) => (
                <tr key={i}>
                  <td><span className="name">{row.topic}</span></td>
                  <td>
                    {row.status === 'confirmed' && <span className="vd ok">Confirmed</span>}
                    {row.status === 'contested' && <span className="vd warn">Contested</span>}
                    {row.status === 'unverified' && <span className="vd bad">Unverified</span>}
                  </td>
                  <td>
                    {noDash(row.description)}
                    {row.sources.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        {row.sources.map((s, si) => (
                          <a key={si} href={s} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'block', fontSize: '9px', color: 'var(--accent-ink)', wordBreak: 'break-all' }}>
                            {urlDomain(s)}
                          </a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    {row.resolution
                      ? noDash(row.resolution)
                      : <span style={{ color: 'var(--ink-4)' }}>&mdash;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="conf">
          <div className="conf-l">
            <div className="l">Overall confidence</div>
            <div className="v">{overallConf.charAt(0).toUpperCase() + overallConf.slice(1)}</div>
            <ConfBars level={overallConf} />
          </div>
          <div className="conf-r">
            {t1Count > 0 && `${t1Count} Tier 1 source${t1Count !== 1 ? 's' : ''} support the primary recommendation. `}
            {report.confirmed.length} claim{report.confirmed.length !== 1 ? 's' : ''} confirmed
            {report.contested.length > 0 ? `, ${report.contested.length} contested` : ''}
            {report.unverified.length > 0 ? `, ${report.unverified.length} unverified` : ''}.
            {report.unverified.length === 0 && ' No unverified claims. Every statement traces to at least one Tier 1 or Tier 2 source.'}
          </div>
        </div>
      </div>

      <LockCard title="Conflict Report" />
    </section>
  );
}

function CitationsSection({ brief }: { brief: VisaBrief }) {
  const citations = brief.confidenceScore.sourceCitations;
  if (citations.length === 0) return null;
  const t1Count = citations.filter(c => c.tier === 1).length;
  const t4Count = citations.filter(c => c.tier === 4).length;
  return (
    <section className="sec" id="s8">
      <Sh n={8} title="Source Citations" meta={`${citations.length} sources · T1×${t1Count} T4×${t4Count}`} />
      <div className="scrollx">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Ref</th>
              <th style={{ width: '28%' }}>Source</th>
              <th style={{ width: '22%' }}>Domain</th>
              <th style={{ width: '30%' }}>Scope of claim</th>
              <th style={{ width: '12%' }}>Tier</th>
            </tr>
          </thead>
          <tbody>
            {citations.map((cite, i) => (
              <tr key={i}>
                <td className="num" style={{ color: 'var(--accent-ink)', fontWeight: 700 }}>S{i + 1}</td>
                <td style={{ color: 'var(--ink)' }}>
                  <a href={cite.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--ink)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                    {urlDomain(cite.url)}
                  </a>
                  {cite.publishedDate && (
                    <span style={{ display: 'block', marginTop: '3px', fontSize: '9px', color: 'var(--ink-4)' }}>
                      {cite.publishedDate}
                    </span>
                  )}
                </td>
                <td className="num">{urlDomain(cite.url)}</td>
                <td>{noDash(cite.claim)}</td>
                <td><TierChip tier={cite.tier} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContingencySection({ brief }: { brief: VisaBrief }) {
  const c = brief.contingency;
  return (
    <section className="sec" id="s9">
      <Sh n={9} title="Contingency" meta="If things go wrong" />

      <div className="gatecontent">
        <div className="kv">
          {c.deniedEntrySteps.length > 0 && (
            <div className="kv-r">
              <div className="kv-k">If denied entry</div>
              <div className="kv-v">
                <ol style={{ paddingLeft: '18px', margin: 0 }}>
                  {c.deniedEntrySteps.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{noDash(s)}</li>)}
                </ol>
              </div>
            </div>
          )}
          <div className="kv-r">
            <div className="kv-k">Overstay scenario</div>
            <div className="kv-v" dangerouslySetInnerHTML={{ __html: withLinks(c.overstayScenario) }} />
          </div>
          {c.emergencyContacts.length > 0 && (
            <div className="kv-r">
              <div className="kv-k">Emergency contacts</div>
              <div className="kv-v">
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {c.emergencyContacts.map((ec, i) => <li key={i}>{noDash(ec)}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <LockCard title="Contingency Planning" />
    </section>
  );
}

// ── Rail ──────────────────────────────────────────────────────────────────────

function Rail({ brief, meta }: { brief: VisaBrief; meta: BriefDocumentMeta }) {
  const perSection = brief.confidenceScore.perSection ?? {};
  const overallConf = brief.confidenceScore.overall;
  const t1Count = brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length;
  const confirmed = brief.conflictReport.confirmed.length;
  const contested = brief.conflictReport.contested.length;
  const unverified = brief.conflictReport.unverified.length;
  const depth = brief.metadata.depth;
  const depthTag = depth === 'quick' ? 'Qck' : depth === 'standard' ? 'Std' : 'Deep';

  return (
    <aside className="rail">
      {/* Panel 1 — route identity */}
      <div className="rp">
        <div className="rp-h">Visa Intelligence Brief<i /><span className="ct">{depthTag}</span></div>
        <div className="rp-b">
          <div className="route">
            {meta.nationality}<br /><em>&rarr;</em>&nbsp;{meta.destination}
          </div>
          {meta.briefId && <div className="route-sub"><b>{meta.briefId}</b></div>}
        </div>
      </div>

      {/* Panel 2 — confidence ledger */}
      <div className="rp">
        <div className="rp-h">Confidence Ledger<i /><span className="ct">&sect;07</span></div>
        <div className="led-hero">
          <div className="l">Overall confidence</div>
          <div className="v">{overallConf.charAt(0).toUpperCase() + overallConf.slice(1)}</div>
          <ConfBars level={overallConf} />
        </div>
        <div className="metrics">
          <div className="m-cell"><div className="m-k">Tier 1 src</div><div className="m-v">{t1Count}</div></div>
          <div className="m-cell"><div className="m-k">Confirmed</div><div className={`m-v${confirmed > 0 ? ' good' : ''}`}>{confirmed}</div></div>
          <div className="m-cell"><div className="m-k">Contested</div><div className="m-v">{contested}</div></div>
          <div className="m-cell"><div className="m-k">Unverified</div><div className={`m-v${unverified === 0 ? ' nil' : ''}`}>{unverified}</div></div>
        </div>
      </div>

      {/* Panel 3 — scroll-spy TOC */}
      <div className="rp">
        <div className="rp-h">Contents<i /><span className="ct">Conf</span></div>
        <ul className="toc" id="bd-toc">
          {SECTION_LABELS.map(([id, label], i) => {
            const confKey = SECTION_CONF_KEYS[i];
            const conf = confKey ? perSection[confKey] as 'high' | 'medium' | 'low' | undefined : undefined;
            return (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className="n">{zeroPad(i + 1)}</span>
                  <span className="t">{label}</span>
                  <span className={confTagClass(conf)}>{confLabel(conf)}</span>
                </a>
              </li>
            );
          })}
        </ul>
        <div className="rp-foot">&mdash;&nbsp;not a scored claim</div>
      </div>
    </aside>
  );
}

// ── root ──────────────────────────────────────────────────────────────────────

export default function BriefDocument({
  brief,
  meta,
  mode = 'screen',
}: {
  brief: VisaBrief;
  meta: BriefDocumentMeta;
  mode?: 'screen' | 'print';
}) {
  const depth = brief.metadata.depth;
  const depthFull = DEPTH_LABEL[depth as 'quick' | 'standard' | 'deep'] ?? depth;
  const successCount = brief.metadata.agentStatuses.filter(s => s.status === 'success').length;
  const totalCount = brief.metadata.agentStatuses.length;

  return (
    <div className="doc" data-mode={mode} data-depth={depth}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="sheet">
        <div className="grid">
          <Rail brief={brief} meta={meta} />

          <main className="body">
            <header className="mast">
              <div className="mast-top">
                <div>
                  <div className="mast-kicker">Visa Intelligence Brief &middot; {depthFull} Depth</div>
                  <h1 className="mast-title">
                    {meta.nationality}<span className="arr">&rarr;</span>{meta.destination}
                  </h1>
                </div>
                <div className="mast-seal">
                  {meta.briefId && <div className="id">{meta.briefId}</div>}
                  <div className="st">
                    Issued {fmt(brief.metadata.generatedAt)}<br />
                    Agents {successCount} / {totalCount} resolved<br />
                    Runtime {Math.round(brief.metadata.totalDurationMs / 1000)}s &middot; {brief.metadata.model}
                  </div>
                </div>
              </div>
              <div className="metastrip">
                <div><div className="l">Passport</div><div className="v">{meta.nationality}</div></div>
                <div><div className="l">Destination</div><div className="v">{meta.destination}</div></div>
                <div><div className="l">Depth</div><div className="v">{depthFull}</div></div>
                <div><div className="l">Agents</div><div className="v">{successCount}/{totalCount}</div></div>
                <div>
                  <div className="l">Confidence</div>
                  <div className="v good">{brief.confidenceScore.overall.charAt(0).toUpperCase() + brief.confidenceScore.overall.slice(1)}</div>
                </div>
              </div>
            </header>

            <ParsedSituationSection brief={brief} meta={meta} />
            <RecommendedActionSection brief={brief} />
            <VisaOptionsSection brief={brief} />
            <EntryRequirementsSection brief={brief} />
            <BorderRunSection brief={brief} />
            <RecentChangesSection brief={brief} />
            <ConflictSection brief={brief} />
            <CitationsSection brief={brief} />
            <ContingencySection brief={brief} />

            <footer className="docfoot">
              <div className="disc">
                <span className="m">Disclaimer</span>
                <span>{brief.disclaimer || 'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.'}</span>
              </div>
              <div className="colophon">
                <span>VisaScout &middot; visascout.io &middot; &copy; 2026 Sabai Wave LLC</span>
                <span>{depthFull} depth &middot; {totalCount} agents &middot; {brief.metadata.model}</span>
                <span>{fmt(brief.metadata.generatedAt)}</span>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Collapse toggle + TOC scroll-spy — executes on initial HTML parse only */}
      <script dangerouslySetInnerHTML={{ __html: TOGGLE_JS }} />
    </div>
  );
}
