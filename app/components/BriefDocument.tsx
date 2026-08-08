// Pure presentational — no 'use client', no hooks, no Next.js imports.
// Works in renderToStaticMarkup for PDF generation and in React tree for screen.

import type { VisaBrief, VisaOption, ConflictReport, SourceCitation, AgentStatus } from '@/src/types/index';
import { DEPTH_LABEL } from '@/src/lib/depth';
import { AGENT_DISPLAY_LABELS } from '@/app/components/agentLabels';

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
    return new Date(isoDate).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function zeroPad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function confidenceLabel(c: 'high' | 'medium' | 'low'): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

// Simple text link renderer — no React.Node linkification (works in renderToStaticMarkup)
function withLinks(text: string): string {
  return noDash(text).replace(
    /(https?:\/\/[^\s<>"()\[\]{};,]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--accent-ink);word-break:break-all;text-decoration:underline;">$1</a>',
  );
}

function tierClass(tier: 1 | 2 | 3 | 4): string {
  if (tier === 1) return 'tier t1';
  if (tier === 2) return 'tier t2';
  if (tier === 4) return 'tier t4';
  return 'tier';
}

function tierLabel(tier: 1 | 2 | 3 | 4): string {
  return `T${tier}`;
}

function sectionMark(level: 'high' | 'medium' | 'low' | undefined): string {
  if (level === 'high') return 'mark full';
  if (level === 'medium') return 'mark warn';
  return 'mark none';
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

  --sheet-w:      1340px;
  --sheet-pad:    40px;
  --sheet-rim:    transparent;
  --rail-w:       272px;
  --rail-pos:     sticky;
  --rail-gap:     40px;
  --grid-cols:    var(--rail-w) minmax(0,1fr);
  --chrome:       block;
  --texture:      1;
  --nav-h:        0px;
  --break:        auto;

  background: var(--stage);
  color: var(--ink-2);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  min-height: 100vh;
}

.doc[data-mode="print"] {
  --stage:        #ffffff;
  --ground:       #ffffff;
  --ground-up:    #f0f0f0;
  --ground-sub:   #e4e4e4;
  --rim:          #aaaaaa;
  --rim-soft:     #d4d4d4;
  --accent:       #111111;
  --accent-ink:   #111111;
  --accent-hot:   #000000;
  --accent-wash:  #eeeeee;
  --accent-rim:   #888888;
  --ink:          #0a0a0a;
  --ink-2:        #2a2a2a;
  --ink-3:        #555555;
  --ink-4:        #777777;
  --ok:           #0a0a0a;
  --ok-wash:      #eeeeee;
  --bad:          #555555;
  --bad-wash:     #e6e6e6;

  --sheet-w:      210mm;
  --sheet-pad:    17mm 16mm 20mm;
  --sheet-rim:    #cccccc;
  --rail-pos:     static;
  --rail-gap:     0px;
  --grid-cols:    minmax(0,1fr);
  --chrome:       none;
  --texture:      0;
  --break:        avoid;
}

@media print {
  .doc {
    --stage: #ffffff; --ground: #ffffff; --ground-up: #f0f0f0; --ground-sub: #e4e4e4;
    --rim: #aaaaaa; --rim-soft: #d4d4d4;
    --accent: #111111; --accent-ink: #111111; --accent-hot: #000000;
    --accent-wash: #eeeeee; --accent-rim: #888888;
    --ink: #0a0a0a; --ink-2: #2a2a2a; --ink-3: #555555; --ink-4: #777777;
    --ok: #0a0a0a; --ok-wash: #eeeeee; --bad: #555555; --bad-wash: #e6e6e6;
    --sheet-w: 100%; --sheet-pad: 0; --sheet-rim: transparent;
    --grid-cols: minmax(0,1fr);
    --chrome: none; --texture: 0; --break: avoid;
  }
  @page { size: A4; margin: 16mm 15mm 18mm; }
}

.sheet {
  position: relative; z-index: 1;
  width: 100%; max-width: var(--sheet-w); margin: 0 auto;
  padding: var(--sheet-pad);
  background: var(--ground);
  border: 1px solid var(--sheet-rim);
}
.doc[data-mode="print"] .sheet { margin: 0 auto; }

.bd-grid { display: grid; grid-template-columns: var(--grid-cols); }

.rail {
  display: var(--chrome);
  position: var(--rail-pos);
  top: 22px;
  align-self: start;
  padding-right: var(--rail-gap);
  border-right: 1px solid var(--rim);
  max-height: calc(100vh - 44px);
  overflow-y: auto;
  scrollbar-width: none;
}
.rail::-webkit-scrollbar { display: none; }
.doc[data-mode="print"] .rail { display: none; }
@media print { .rail { display: none !important; } }

.rail-id { padding-bottom: 16px; border-bottom: 1px solid var(--rim-soft); }
.rail-kicker {
  display: flex; align-items: center; gap: 10px;
  font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--accent-ink); margin-bottom: 12px;
}
.rail-kicker::before { content: ''; width: 18px; height: 1px; background: var(--accent); }
.rail-route {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 30px; font-weight: 900; line-height: 0.92;
  text-transform: uppercase; letter-spacing: -0.005em; color: var(--ink);
}
.rail-route em { font-style: normal; color: var(--accent); }
.rail-sub { margin-top: 8px; font-size: 9px; letter-spacing: 0.1em; color: var(--ink-4); line-height: 1.85; }

.ledger { border: 1px solid var(--rim); margin-top: 16px; }
.ledger-row {
  display: grid; grid-template-columns: 1fr auto;
  align-items: center; gap: 10px;
  padding: 8px 12px; border-bottom: 1px solid var(--rim-soft);
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3);
}
.ledger-row:last-child { border-bottom: none; }
.ledger-row b {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 19px; letter-spacing: 0.02em; line-height: 1; color: var(--accent);
}
.ledger-row.big { background: var(--accent-wash); }
.ledger-row.big b { font-size: 26px; }

.rail-h {
  margin: 22px 0 9px;
  display: flex; align-items: center; gap: 9px;
  font-size: 8px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-ink);
}
.rail-h::after { content: ''; flex: 1; height: 1px; background: var(--rim); }

.idx { list-style: none; }
.idx li { border-bottom: 1px solid var(--rim-soft); }
.idx li:last-child { border-bottom: none; }
.idx a {
  display: grid; grid-template-columns: 22px 1fr auto;
  align-items: center; gap: 10px;
  padding: 7px 0; text-decoration: none;
  font-size: 10px; color: var(--ink-3); letter-spacing: 0.03em;
  border-left: 2px solid transparent; padding-left: 9px;
}
.idx a:hover { color: var(--ink); }
.idx a.on { color: var(--ink); border-left-color: var(--accent); background: var(--accent-wash); }
.idx .n { font-size: 8px; letter-spacing: 0.14em; color: var(--ink-4); }
.idx a.on .n { color: var(--accent-ink); }

.mark { display: inline-block; width: 7px; height: 7px; border: 1px solid var(--accent); flex-shrink: 0; vertical-align: middle; }
.mark.full { background: var(--accent); }
.mark.warn { border-color: var(--ink-4); }
.mark.none { border-color: var(--rim); background: transparent; }

.rail-agents { margin-top: 4px; }
.agentrow {
  display: grid; grid-template-columns: 1fr auto auto;
  align-items: center; gap: 8px;
  padding: 6px 0 6px 9px; border-left: 3px solid var(--accent);
  border-bottom: 1px solid var(--rim-soft);
  font-size: 10px; color: var(--ink-3);
}
.agentrow.failed { border-left-color: var(--bad); }
.agentrow:last-child { border-bottom: none; }
.agentrow .ms { font-size: 8px; letter-spacing: 0.1em; color: var(--ink-4); }

.bd-body { padding-left: var(--rail-gap); min-width: 0; }
.doc[data-mode="print"] .bd-body { padding-left: 0; }
@media print { .bd-body { padding-left: 0; } }

.dochead { padding-bottom: 22px; border-bottom: 1px solid var(--accent-rim); margin-bottom: 30px; }
.brandline {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 18px;
  font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-ink);
}
.brandline .r { color: var(--ink-4); letter-spacing: 0.14em; }
.h1 {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(42px, 6.4vw, 82px); font-weight: 900;
  line-height: 0.84; letter-spacing: -0.018em; text-transform: uppercase;
  color: var(--ink);
}
.h1 .arrow { color: var(--accent); padding: 0 0.12em; }
.doc[data-mode="print"] .h1 { font-size: 46px; }
@media print { .h1 { font-size: 46px; } }

.statline {
  display: none;
  margin-top: 10px; padding: 8px 14px;
  border: 1px solid var(--rim);
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4);
  gap: 20px;
}
.doc[data-mode="print"] .statline { display: flex; flex-wrap: wrap; }
@media print { .statline { display: flex !important; flex-wrap: wrap; } }
.statline .s { white-space: nowrap; }
.statline .s b { color: var(--accent-ink); font-weight: 700; }

.metastrip {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--rim); margin-top: 22px;
}
.metacell { padding: 12px 14px; border-right: 1px solid var(--rim); }
.metacell:last-child { border-right: none; }
.metacell .k { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 6px; }
.metacell .v {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 22px; line-height: 1; text-transform: uppercase; color: var(--ink);
}
.metacell .v.acc { color: var(--accent); }

section.sec { margin-bottom: 34px; scroll-margin-top: 22px; }
.sechead {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: baseline; gap: 14px;
  padding-bottom: 8px; border-bottom: 1px solid var(--rim);
  margin-bottom: 16px;
}
.sec-n {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 26px; line-height: 1; color: var(--accent);
}
.sec-t {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900;
  font-size: 25px; line-height: 1; letter-spacing: 0.015em;
  text-transform: uppercase; color: var(--ink);
}
.sec-m {
  display: flex; align-items: center; gap: 8px;
  font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4);
}

.lab {
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--accent-ink); margin-bottom: 6px;
}
.lab.mute { color: var(--ink-4); }
.lab.ok   { color: var(--ok); }
.lab.bad  { color: var(--bad); }
p.t { font-size: 12px; line-height: 1.85; color: var(--ink-2); }
p.t + p.t { margin-top: 10px; }

.card {
  border: 1px solid var(--rim); background: var(--ground-up);
  padding: 18px 20px; page-break-inside: var(--break);
}
.card + .card { margin-top: 12px; }

.tier {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 6px; border: 1px solid var(--rim); color: var(--ink-4);
  background: var(--ground-sub); flex-shrink: 0; white-space: nowrap;
}
.tier.t1 { color: var(--accent-ink); border-color: var(--accent-rim); background: var(--accent-wash); }
.tier.t2 { color: var(--ink-2); border-color: var(--rim); }
.tier.t4 { color: var(--ink-4); border-style: dashed; }
.tier .sq { width: 5px; height: 5px; background: currentColor; display: inline-block; flex-shrink: 0; }
.tier.t4 .sq { background: transparent; border: 1px solid currentColor; }

.chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 8px; border: 1px solid var(--rim); color: var(--ink-3);
  white-space: nowrap;
}
.chip.high { color: var(--accent-ink); border-color: var(--accent-rim); background: var(--accent-wash); }
.chip.med  { color: var(--ink-3); }
.chip.ok   { color: var(--ok); border-color: var(--ok); background: var(--ok-wash); }
.chip.bad  { color: var(--bad); border-color: var(--bad); background: var(--bad-wash); }

ul.bul { list-style: none; }
ul.bul li {
  display: flex; gap: 9px; align-items: flex-start;
  font-size: 12px; line-height: 1.75; color: var(--ink-2);
  padding: 4px 0;
}
ul.bul li::before { content: ''; width: 4px; height: 4px; background: var(--accent); flex-shrink: 0; margin-top: 8px; }
ul.bul.num { counter-reset: b; }
ul.bul.num li::before {
  counter-increment: b; content: counter(b, decimal-leading-zero);
  width: auto; height: auto; background: none; margin-top: 0;
  font-size: 9px; letter-spacing: 0.1em; color: var(--accent-ink); min-width: 18px;
}

.warn {
  border: 1px solid var(--rim); border-left: 3px solid var(--accent);
  background: var(--accent-wash); padding: 12px 14px; margin-top: 12px;
  page-break-inside: var(--break);
}
.warn li { color: var(--ink-2); }
.warn li::before { background: var(--accent); }

/* ── 02 Recommended Action ── */
.verdict {
  border: 1px solid var(--accent-rim); border-top: 3px solid var(--accent);
  background: var(--accent-wash); page-break-inside: var(--break);
}
.verdict-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 9px 18px; border-bottom: 1px solid var(--accent-rim);
  background: var(--ground-up);
}
.verdict-bar .l { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-ink); }
.verdict-body { padding: 20px 18px; }
.deadline {
  display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center;
  border: 1px solid var(--bad); background: var(--bad-wash);
  padding: 12px 15px; margin-bottom: 18px;
}
.deadline .dl {
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--bad);
  writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap;
}
.deadline .dt { font-size: 12.5px; line-height: 1.7; color: var(--bad); font-weight: 700; }
.action { font-size: 13px; line-height: 1.85; color: var(--ink); }
.action .req {
  counter-reset: r; list-style: none; margin: 12px 0;
  border-left: 1px solid var(--accent-rim); padding-left: 16px;
}
.action .req li {
  counter-increment: r; position: relative;
  padding: 6px 0 6px 34px; font-size: 12px; line-height: 1.75; color: var(--ink-2);
}
.action .req li::before {
  content: counter(r, decimal-leading-zero);
  position: absolute; left: 0; top: 6px;
  font-size: 9px; letter-spacing: 0.12em; font-weight: 700; color: var(--accent-ink);
}
.why { border-top: 1px solid var(--accent-rim); margin-top: 16px; padding-top: 14px; }

/* ── 03 Visa Options ── */
.opt {
  border: 1px solid var(--rim); border-left: 3px solid var(--rim);
  background: var(--ground-up); page-break-inside: var(--break); margin-bottom: 12px;
}
.opt.best { border-left-color: var(--ok); }
.opt.good { border-left-color: var(--accent); }
.opt-head {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 12px 16px; border-bottom: 1px solid var(--rim-soft); flex-wrap: wrap;
}
.opt-rank {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 17px;
  color: var(--ink-4); line-height: 1; margin-right: 2px;
}
.opt-name {
  font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 22px;
  text-transform: uppercase; letter-spacing: 0.01em; line-height: 1; color: var(--ink);
}
.opt-body { padding: 16px; }
.opt-stay {
  display: grid; grid-template-columns: 96px 1fr; gap: 14px; align-items: baseline;
  padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--rim-soft);
}
.opt-stay .v { font-size: 12px; color: var(--ink); }
.pc { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--rim-soft); margin-top: 14px; }
.pc > div { padding: 10px 12px; }
.pc > div:first-child { border-right: 1px solid var(--rim-soft); }
.pc li { display: flex; gap: 8px; align-items: flex-start; font-size: 11px; line-height: 1.7; padding: 3px 0; color: var(--ink-2); list-style: none; }
.pc li::before { content: '+'; color: var(--ok); font-weight: 700; flex-shrink: 0; }
.pc .con li::before { content: '\\2212'; color: var(--bad); }
.docs { border-top: 1px solid var(--rim-soft); margin-top: 14px; padding-top: 12px; }
.docs-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.docs a { color: var(--accent-ink); text-decoration: none; border-bottom: 1px solid var(--accent-rim); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }

/* ── 04/05 kv slabs ── */
.kv { border: 1px solid var(--rim); page-break-inside: var(--break); }
.kv-row { display: grid; grid-template-columns: 168px 1fr auto; gap: 16px; align-items: start; padding: 11px 14px; border-bottom: 1px solid var(--rim-soft); }
.kv-row:last-child { border-bottom: none; }
.kv-row .k { font-size: 8.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-4); padding-top: 3px; }
.kv-row .v { font-size: 12px; line-height: 1.7; color: var(--ink-2); }
.kv-row .v strong { color: var(--ink); font-weight: 700; }

/* ── 07 Conflict ── */
.cf { border: 1px solid var(--rim); page-break-inside: var(--break); margin-bottom: 10px; }
.cf-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 8px 14px; background: var(--ground-up); border-bottom: 1px solid var(--rim-soft);
}
.cf-topic { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 18px; text-transform: uppercase; color: var(--ink); line-height: 1; }
.cf-body { padding: 14px; }
.cf-res { border-left: 3px solid var(--accent); background: var(--accent-wash); padding: 10px 12px; margin-top: 12px; }
.cf-srcs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--rim-soft); }
.srclink {
  font-size: 9px; color: var(--ink-4); text-decoration: none;
  border: 1px solid var(--rim); padding: 3px 7px; word-break: break-all;
}
.cf-empty { padding: 14px; font-size: 11px; color: var(--ink-4); letter-spacing: 0.06em; }

/* ── 08 Citations ── */
.cite { display: grid; grid-template-columns: 62px 1fr; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--rim-soft); page-break-inside: var(--break); }
.cite:last-child { border-bottom: none; }
.cite .claim { font-size: 12px; line-height: 1.7; color: var(--ink); }
.cite .url { display: block; margin-top: 4px; font-size: 10px; color: var(--accent-ink); text-decoration: none; word-break: break-all; border-bottom: 1px solid var(--accent-rim); }
.cite .date { margin-top: 5px; font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); }
.tierkey { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--rim); margin-top: 16px; page-break-inside: var(--break); }
.tierkey > div { padding: 10px 12px; border-right: 1px solid var(--rim-soft); }
.tierkey > div:last-child { border-right: none; }
.tierkey .d { margin-top: 6px; font-size: 9px; line-height: 1.7; color: var(--ink-4); }

.docfoot { margin-top: 34px; padding-top: 16px; border-top: 1px solid var(--rim); page-break-inside: var(--break); }
.disc { display: grid; grid-template-columns: auto 1fr; gap: 12px; font-size: 10px; line-height: 1.85; color: var(--ink-3); }
.disc .m { font-size: 8.5px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-ink); white-space: nowrap; }
.colophon {
  margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--rim-soft);
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4);
}

/* locked section — depth gate for quick */
.locked-card {
  border: 1px solid var(--rim); background: var(--ground-up); padding: 18px 20px;
  display: flex; align-items: center; gap: 14px;
}
.lock-icon { font-size: 16px; color: var(--ink-4); flex-shrink: 0; }
.lock-text { font-size: 11px; color: var(--ink-4); line-height: 1.7; }
.lock-link { color: var(--accent-ink); text-decoration: underline; }

.stale-note { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--accent-rim); font-size: 10px; line-height: 1.75; color: var(--accent-ink); }

@media (max-width: 1080px) {
  .doc { --rail-w: 230px; --rail-gap: 26px; --sheet-pad: 26px; }
}
@media (max-width: 880px) {
  .doc { --grid-cols: minmax(0,1fr); --rail-pos: static; --rail-w: 100%; --rail-gap: 0px; }
  .rail { border-right: none; border-bottom: 1px solid var(--rim); padding-right: 0; padding-bottom: 20px; margin-bottom: 24px; max-height: none; }
  .bd-body { padding-left: 0; }
  .metastrip, .tierkey { grid-template-columns: 1fr 1fr; }
  .pc { grid-template-columns: 1fr; }
  .pc > div:first-child { border-right: none; border-bottom: 1px solid var(--rim-soft); }
  .kv-row { grid-template-columns: 140px 1fr auto; }
}
@media (max-width: 580px) {
  .metastrip { grid-template-columns: 1fr 1fr; }
  .kv-row { grid-template-columns: 1fr; }
  .kv-row .k { padding-top: 0; }
  .kv-row > span:last-child { display: none; }
}
`;

// ── sub-components (pure functions, no hooks) ─────────────────────────────────

function TierChip({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  return (
    <span className={tierClass(tier)}>
      <span className="sq" />
      {tierLabel(tier)}
    </span>
  );
}

function Chip({ level, label }: { level: 'high' | 'medium' | 'low' | 'ok' | 'bad'; label: string }) {
  const cls = level === 'high' ? 'high' : level === 'ok' ? 'ok' : level === 'bad' ? 'bad' : 'med';
  return <span className={`chip ${cls}`}>{label}</span>;
}

function SecHead({ n, title, meta }: { n: number; title: string; meta?: React.ReactNode }) {
  return (
    <div className="sechead">
      <span className="sec-n">{zeroPad(n)}</span>
      <span className="sec-t">{title}</span>
      {meta ? <span className="sec-m">{meta}</span> : <span />}
    </div>
  );
}

function KvRow({ label, value, tier }: { label: string; value: React.ReactNode; tier?: 1 | 2 | 3 | 4 }) {
  return (
    <div className="kv-row">
      <span className="k">{label}</span>
      <span className="v">{value}</span>
      {tier !== undefined ? <TierChip tier={tier} /> : <span />}
    </div>
  );
}

function WarnBlock({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="warn">
      <div className="lab">Warnings</div>
      <ul className="bul">
        {items.map((w, i) => <li key={i}>{noDash(w)}</li>)}
      </ul>
    </div>
  );
}

function LockedCard({ title, depth }: { title: string; depth: string }) {
  const label = DEPTH_LABEL[depth as 'quick' | 'standard' | 'deep'] ?? depth;
  return (
    <div className="locked-card">
      <span className="lock-icon" aria-hidden="true">
        {/* inline SVG padlock */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
          <rect x="3" y="11" width="18" height="11" rx="0" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </span>
      <span className="lock-text">
        {title} included in{' '}
        <a className="lock-link" href="/app?depth=standard">Intel and Dossier</a>.{' '}
        Current depth: {label}.
      </span>
    </div>
  );
}

// ── section renderers ─────────────────────────────────────────────────────────

function ParsedSituationSection({ brief }: { brief: VisaBrief }) {
  if (!brief.parsedSituation) return null;
  return (
    <section className="sec" id="s1">
      <SecHead n={1} title="Parsed Situation" meta="What we understood" />
      <div className="card" style={{ borderLeft: '3px solid var(--accent)', background: 'var(--accent-wash)' }}>
        <p className="t" style={{ color: 'var(--ink)' }}>{noDash(brief.parsedSituation)}</p>
      </div>
    </section>
  );
}

function RecommendedActionSection({ brief }: { brief: VisaBrief }) {
  const ra = brief.recommendedAction;
  const urgencyChip = <Chip level={ra.urgency === 'high' ? 'bad' : 'medium'} label={`Urgency · ${confidenceLabel(ra.urgency)}`} />;
  const confChip = <Chip level={brief.confidenceScore.overall === 'high' ? 'high' : 'medium'} label={`Confidence ${confidenceLabel(brief.confidenceScore.overall)}`} />;

  return (
    <section className="sec" id="s2">
      <SecHead n={2} title="Recommended Action" meta={urgencyChip} />
      <div className="verdict">
        <div className="verdict-bar">
          <span className="l">Primary Recommendation</span>
          {confChip}
        </div>
        <div className="verdict-body">
          {ra.deadline && (
            <div className="deadline">
              <span className="dl">Deadline</span>
              <span className="dt">{noDash(ra.deadline)}</span>
            </div>
          )}
          <div className="action">
            <p dangerouslySetInnerHTML={{ __html: withLinks(ra.action) }} />
          </div>
          <div className="why">
            <div className="lab">Why</div>
            <p className="t" dangerouslySetInnerHTML={{ __html: withLinks(ra.rationale) }} />
          </div>
          {ra.stalePolicyWarning && (
            <div className="stale-note">
              {noDash(ra.stalePolicyWarning)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VisaOptionsSection({ brief, mode }: { brief: VisaBrief; mode: 'screen' | 'print' }) {
  const t1Count = brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length;
  const meta = (
    <>
      {brief.visaOptions.length} ranked{t1Count > 0 && <> &middot; <TierChip tier={1} /></>}
    </>
  );
  return (
    <section className="sec" id="s3">
      <SecHead n={3} title="Visa Options" meta={meta} />
      {brief.visaOptions.map((opt, i) => (
        <VisaOptionCard key={i} opt={opt} rank={i + 1} depth={brief.metadata.depth} mode={mode} />
      ))}
    </section>
  );
}

function VisaOptionCard({ opt, rank, depth, mode }: { opt: VisaOption; rank: number; depth: string; mode: 'screen' | 'print' }) {
  const suitClass = opt.suitability === 'best' ? 'best' : opt.suitability === 'good' ? 'good' : '';
  const fitLabel = opt.suitability === 'best' ? 'Best Fit' : opt.suitability === 'good' ? 'Good Fit' : 'Acceptable';
  const fitChip = opt.suitability === 'best' ? 'ok' : opt.suitability === 'good' ? 'high' : 'med';

  return (
    <article className={`opt ${suitClass}`}>
      <div className="opt-head">
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span className="opt-rank">{zeroPad(rank)}</span>
          <span className="opt-name">{opt.name}</span>
        </span>
        <span className={`chip ${fitChip}`}>{fitLabel}</span>
      </div>
      <div className="opt-body">
        <div className="opt-stay">
          <span className="lab mute" style={{ margin: 0 }}>Max Stay</span>
          <span className="v">{noDash(opt.maxStay)}</span>
        </div>
        <p className="t">{noDash(opt.summary)}</p>
        {(opt.pros.length > 0 || opt.cons.length > 0) && (
          <div className="pc">
            <div>
              <div className="lab ok">Advantages</div>
              <ul>
                {opt.pros.map((p, i) => <li key={i}>{noDash(p)}</li>)}
              </ul>
            </div>
            <div className="con">
              <div className="lab bad">Constraints</div>
              <ul>
                {opt.cons.map((c, i) => <li key={i}>{noDash(c)}</li>)}
              </ul>
            </div>
          </div>
        )}
        {depth !== 'quick' && opt.applicationDocs && opt.applicationDocs.length > 0 && (
          <div className="docs">
            <div className="docs-head">
              <span className="lab" style={{ margin: 0 }}>Application Documents</span>
              {opt.applicationUrl && (
                <a href={opt.applicationUrl} target="_blank" rel="noopener noreferrer">Apply online &rarr;</a>
              )}
            </div>
            <ul className="bul">
              {opt.applicationDocs.map((d, i) => <li key={i}>{noDash(d)}</li>)}
            </ul>
          </div>
        )}
        {depth === 'quick' && mode !== 'print' && (
          <div className="docs">
            <div className="lock-text" style={{ fontSize: '11px', color: 'var(--ink-4)' }}>
              Application documents included in{' '}
              <a className="lock-link" href="/app?depth=standard">Intel and Dossier</a>.
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function EntryRequirementsSection({ brief }: { brief: VisaBrief }) {
  const req = brief.entryRequirements;
  const conf = brief.confidenceScore.perSection?.entryRequirements;

  return (
    <section className="sec" id="s4">
      <SecHead n={4} title="Entry Requirements" meta={conf ? <Chip level={conf} label={`Confidence ${confidenceLabel(conf)}`} /> : undefined} />
      <div className="kv">
        {req.documents.length > 0 && (
          <KvRow label="Required Documents" tier={1} value={
            <ul className="bul" style={{ margin: '-4px 0' }}>
              {req.documents.map((d, i) => <li key={i}>{noDash(d)}</li>)}
            </ul>
          } />
        )}
        {req.proofOfFunds && (
          <KvRow label="Proof of Funds" tier={1} value={<strong>{noDash(req.proofOfFunds)}</strong>} />
        )}
        <KvRow label="Onward Ticket" tier={1} value={<strong>{req.onwardTicket ? 'Required' : 'Not required'}</strong>} />
        {req.health.length > 0 && (
          <KvRow label="Health" tier={2} value={req.health.map(noDash).join('. ')} />
        )}
        {req.notes.length > 0 && (
          <KvRow label="Field Notes" tier={4} value={
            <ul className="bul" style={{ margin: '-4px 0' }}>
              {req.notes.map((n, i) => <li key={i}>{noDash(n)}</li>)}
            </ul>
          } />
        )}
      </div>
    </section>
  );
}

function BorderRunSection({ brief, locked, mode }: { brief: VisaBrief; locked: boolean; mode: 'screen' | 'print' }) {
  if (locked) {
    // Print omits the section entirely — an upgrade CTA is a screen-only
    // interaction, never printed. Screen shows the CTA in its place.
    if (mode === 'print') return null;
    return (
      <section className="sec" id="s5">
        <SecHead n={5} title="Border Run Analysis" />
        <LockedCard title="Border Run Analysis" depth={brief.metadata.depth} />
      </section>
    );
  }
  const analysis = brief.borderRunAnalysis;
  const conf = brief.confidenceScore.perSection?.borderRun;

  return (
    <section className="sec" id="s5">
      <SecHead n={5} title="Border Run Analysis" meta={conf ? <Chip level={conf} label={`Confidence ${confidenceLabel(conf)}`} /> : undefined} />
      <div className="kv">
        <KvRow label="Eligible" tier={1} value={<strong>{analysis.eligible ? 'Yes' : 'No'}</strong>} />
        {analysis.limitsPerYear && (
          <KvRow label="Annual Limit" tier={1} value={<strong>{noDash(analysis.limitsPerYear)}</strong>} />
        )}
        {analysis.recommendedCrossings.length > 0 && (
          <KvRow label="Recommended Crossings" tier={2} value={
            <ul className="bul num" style={{ margin: '-4px 0' }}>
              {analysis.recommendedCrossings.map((c, i) => <li key={i}>{noDash(c)}</li>)}
            </ul>
          } />
        )}
        <KvRow label="Enforcement Posture" tier={4} value={noDash(analysis.enforcementPosture)} />
      </div>
      <WarnBlock items={analysis.warnings} />
    </section>
  );
}

function RecentChangesSection({ brief }: { brief: VisaBrief }) {
  const changes = brief.recentChanges;
  if (!changes.hasChanges && changes.items.length === 0) return null;

  return (
    <section className="sec" id="s6">
      <SecHead n={6} title="Recent Changes" meta={<>Last 90 days &middot; <TierChip tier={1} /></>} />
      <div className="card">
        {changes.items.length > 0 && (
          <ul className="bul num">
            {changes.items.map((item, i) => <li key={i}>{noDash(item)}</li>)}
          </ul>
        )}
        {changes.watchItems.length > 0 && (
          <div className="warn">
            <div className="lab">Watch Items</div>
            <ul className="bul">
              {changes.watchItems.map((w, i) => <li key={i}>{noDash(w)}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ConflictSection({ brief, locked, mode }: { brief: VisaBrief; locked: boolean; mode: 'screen' | 'print' }) {
  const report = brief.conflictReport;
  const total = report.confirmed.length + report.contested.length + report.unverified.length;

  if (locked) {
    // Print omits the section entirely regardless of contested count — an
    // upgrade CTA is a screen-only interaction, never printed.
    if (mode === 'print') return null;
    const contested = report.contested.length + report.unverified.length;
    if (contested === 0) return null;
    return (
      <section className="sec" id="s7">
        <SecHead n={7} title="Conflict Report" />
        <LockedCard title={`Conflict Report (${contested} item${contested !== 1 ? 's' : ''})`} depth={brief.metadata.depth} />
      </section>
    );
  }

  return (
    <section className="sec" id="s7">
      <SecHead n={7} title="Conflict Report" meta={`${total} item${total !== 1 ? 's' : ''} · ${report.contested.length} contested`} />

      {report.confirmed.length > 0 && (
        <>
          <div className="lab ok" style={{ marginTop: '4px' }}>Confirmed &middot; {report.confirmed.length}</div>
          {report.confirmed.map((item, i) => (
            <div key={i} className="cf">
              <div className="cf-bar">
                <span className="cf-topic">{item.topic}</span>
                <span className="chip ok">Confirmed</span>
              </div>
              <div className="cf-body">
                <p className="t">{noDash(item.description)}</p>
                {item.sources.length > 0 && (
                  <div className="cf-srcs">
                    {item.sources.map((s, si) => (
                      <a key={si} className="srclink" href={s} target="_blank" rel="noopener noreferrer">{s}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {report.contested.length > 0 && (
        <>
          <div className="lab" style={{ marginTop: '18px' }}>Contested &middot; {report.contested.length}</div>
          {report.contested.map((item, i) => (
            <div key={i} className="cf" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div className="cf-bar">
                <span className="cf-topic">{item.topic}</span>
                <span className="chip high">Contested</span>
              </div>
              <div className="cf-body">
                <p className="t">{noDash(item.description)}</p>
                {item.resolution && (
                  <div className="cf-res">
                    <div className="lab">Resolution</div>
                    <p className="t">{noDash(item.resolution)}</p>
                  </div>
                )}
                {item.sources.length > 0 && (
                  <div className="cf-srcs">
                    {item.sources.map((s, si) => (
                      <a key={si} className="srclink" href={s} target="_blank" rel="noopener noreferrer">{s}</a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {report.unverified.length > 0 && (
        <>
          <div className="lab bad" style={{ marginTop: '18px' }}>Unverified &middot; {report.unverified.length}</div>
          {report.unverified.map((item, i) => (
            <div key={i} className="cf">
              <div className="cf-bar">
                <span className="cf-topic">{item.topic}</span>
                <span className="chip bad">Unverified</span>
              </div>
              <div className="cf-body">
                <p className="t">{noDash(item.description)}</p>
              </div>
            </div>
          ))}
        </>
      )}

      {report.unverified.length === 0 && report.confirmed.length > 0 && (
        <>
          <div className="lab bad" style={{ marginTop: '18px' }}>Unverified &middot; 0</div>
          <div className="cf"><div className="cf-empty">No unverified claims. Every statement traces to at least one Tier 1 or Tier 2 source.</div></div>
        </>
      )}
    </section>
  );
}

function CitationsSection({ brief }: { brief: VisaBrief }) {
  const citations = brief.confidenceScore.sourceCitations;
  if (citations.length === 0) return null;

  return (
    <section className="sec" id="s8">
      <SecHead n={8} title="Source Citations" meta={`${citations.length} claim${citations.length !== 1 ? 's' : ''} · ${citations.filter(c => c.tier <= 2).length} sourced`} />
      <div className="card" style={{ padding: '4px 20px' }}>
        {citations.map((cite, i) => (
          <div key={i} className="cite">
            <TierChip tier={cite.tier} />
            <span>
              <span className="claim">{cite.claim}</span>
              <a className="url" href={cite.url} target="_blank" rel="noopener noreferrer">{cite.url}</a>
              {cite.publishedDate && (
                <div className="date">{cite.publishedDate}</div>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="tierkey">
        <div><TierChip tier={1} /><div className="d">Government immigration portals, embassy sites. Authoritative.</div></div>
        <div><TierChip tier={2} /><div className="d">IATA, Timatic, official travel advisories. High trust.</div></div>
        <div><span className="tier"><span className="sq" />T3</span><div className="d">Reputable aggregators. Medium trust.</div></div>
        <div><TierChip tier={4} /><div className="d">Community reports. Ground truth, no official authority.</div></div>
      </div>
    </section>
  );
}

function ContingencySection({ brief, locked, mode }: { brief: VisaBrief; locked: boolean; mode: 'screen' | 'print' }) {
  if (locked) {
    // Print omits the section entirely — an upgrade CTA is a screen-only
    // interaction, never printed. Screen shows the CTA in its place.
    if (mode === 'print') return null;
    return (
      <section className="sec" id="s9">
        <SecHead n={9} title="Contingency" />
        <LockedCard title="Contingency Planning" depth={brief.metadata.depth} />
      </section>
    );
  }

  const c = brief.contingency;
  return (
    <section className="sec" id="s9">
      <SecHead n={9} title="Contingency" meta="If things go wrong" />
      <div className="kv">
        {c.deniedEntrySteps.length > 0 && (
          <KvRow label="If Denied Entry" value={
            <ul className="bul num" style={{ margin: '-4px 0' }}>
              {c.deniedEntrySteps.map((s, i) => <li key={i}>{noDash(s)}</li>)}
            </ul>
          } />
        )}
        <KvRow label="Overstay Scenario" tier={1} value={<span dangerouslySetInnerHTML={{ __html: withLinks(c.overstayScenario) }} />} />
        {c.emergencyContacts.length > 0 && (
          <KvRow label="Emergency Contacts" value={
            <ul className="bul" style={{ margin: '-4px 0' }}>
              {c.emergencyContacts.map((ec, i) => <li key={i}>{noDash(ec)}</li>)}
            </ul>
          } />
        )}
      </div>
    </section>
  );
}

// ── Rail ──────────────────────────────────────────────────────────────────────

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

const SECTION_CONF_KEYS = [
  undefined,
  'recommendedAction',
  'visaOptions',
  'entryRequirements',
  'borderRun',
  'recentChanges',
  'conflictReport',
  'citations',
  'contingency',
];

function Rail({ brief, meta }: { brief: VisaBrief; meta: BriefDocumentMeta }) {
  const t1Count = brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length;
  const confirmed = brief.conflictReport.confirmed.length;
  const contested = brief.conflictReport.contested.length;
  const unverified = brief.conflictReport.unverified.length;
  const perSection = brief.confidenceScore.perSection ?? {};

  const successCount = brief.metadata.agentStatuses.filter(s => s.status === 'success').length;
  const totalCount = brief.metadata.agentStatuses.length;

  return (
    <aside className="rail">
      <div className="rail-id">
        <div className="rail-kicker">Visa Intelligence Brief</div>
        <div className="rail-route">
          {meta.nationality}<br />
          <em>&rarr;</em>&nbsp;{meta.destination}
        </div>
        <div className="rail-sub">
          {meta.briefId && <>{meta.briefId}<br /></>}
          {DEPTH_LABEL[brief.metadata.depth as 'quick' | 'standard' | 'deep'] ?? brief.metadata.depth} depth &middot; 9 sections<br />
          {fmt(brief.metadata.generatedAt)}
        </div>
      </div>

      <div className="ledger">
        <div className="ledger-row big">
          <span>Overall confidence</span>
          <b>{confidenceLabel(brief.confidenceScore.overall)}</b>
        </div>
        {t1Count > 0 && (
          <div className="ledger-row"><span>Tier 1 sources</span><b>{t1Count}</b></div>
        )}
        <div className="ledger-row"><span>Claims confirmed</span><b>{confirmed}</b></div>
        <div className="ledger-row"><span>Claims contested</span><b>{contested}</b></div>
        <div className="ledger-row"><span>Unverified</span><b>{unverified}</b></div>
      </div>

      <div className="rail-h">Contents</div>
      <ul className="idx" id="bd-idx">
        {SECTION_LABELS.map(([id, label], i) => {
          const confKey = SECTION_CONF_KEYS[i];
          const conf = confKey ? perSection[confKey] : undefined;
          return (
            <li key={id}>
              <a href={`#${id}`}>
                <span className="n">{zeroPad(i + 1)}</span>
                <span>{label}</span>
                <span className={sectionMark(conf)} />
              </a>
            </li>
          );
        })}
      </ul>
      <div className="rail-sub" style={{ marginTop: '10px' }}>
        <span className="mark full" style={{ display: 'inline-block', verticalAlign: '-1px' }} /> High{' '}
        <span className="mark warn" style={{ display: 'inline-block', verticalAlign: '-1px' }} /> Medium{' '}
        <span className="mark none" style={{ display: 'inline-block', verticalAlign: '-1px' }} /> Not scored
      </div>

      <div className="rail-h">Agents</div>
      <div className="rail-agents">
        {brief.metadata.agentStatuses.map((s, i) => {
          const key = (s.agent.charAt(0).toLowerCase() + s.agent.slice(1)) as keyof typeof AGENT_DISPLAY_LABELS;
          const label = AGENT_DISPLAY_LABELS[key] ?? s.agent;
          const failed = s.status === 'failed';
          return (
            <div key={i} className={`agentrow${failed ? ' failed' : ''}`}>
              <span>{label}</span>
              <TierChip tier={s.sourceTier} />
              <span className="ms">{s.durationMs}ms</span>
            </div>
          );
        })}
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
  const isQuick = depth === 'quick';
  // Applies regardless of mode — a Quick-depth PDF must not leak gated
  // sections. Each gated section decides separately whether to render an
  // upgrade CTA (screen) or omit itself entirely (print, see LockedCard
  // call sites below and VisaOptionCard's inline lock-text).
  const lockDepthGated = isQuick;

  const successCount = brief.metadata.agentStatuses.filter(s => s.status === 'success').length;
  const totalCount = brief.metadata.agentStatuses.length;

  return (
    <div className="doc" data-mode={mode}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="sheet">
        <div className="bd-grid">
          <Rail brief={brief} meta={meta} />

          <main className="bd-body">
            <header className="dochead">
              <div className="brandline">
                <span>VisaScout &middot; Visa Intelligence</span>
                {meta.briefId && <span className="r">{meta.briefId}</span>}
              </div>
              <h1 className="h1">
                {meta.nationality} <span className="arrow">&rarr;</span> {meta.destination}
              </h1>
              <div className="metastrip">
                <div className="metacell">
                  <div className="k">Depth</div>
                  <div className="v">{DEPTH_LABEL[depth as 'quick' | 'standard' | 'deep'] ?? depth}</div>
                </div>
                <div className="metacell">
                  <div className="k">Generated</div>
                  <div className="v" style={{ fontSize: '14px', lineHeight: '1.2' }}>{fmt(brief.metadata.generatedAt)}</div>
                </div>
                <div className="metacell">
                  <div className="k">Confidence</div>
                  <div className="v acc">{confidenceLabel(brief.confidenceScore.overall)}</div>
                </div>
                <div className="metacell">
                  <div className="k">Agents</div>
                  <div className="v">{successCount} / {totalCount}</div>
                </div>
              </div>
              {/* print-only: source provenance stats from the screen rail ledger */}
              <div className="statline">
                {brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length > 0 && (
                  <span className="s">T1 sources <b>{brief.confidenceScore.sourceCitations.filter(c => c.tier === 1).length}</b></span>
                )}
                <span className="s">Confirmed <b>{brief.conflictReport.confirmed.length}</b></span>
                <span className="s">Contested <b>{brief.conflictReport.contested.length}</b></span>
                <span className="s">Unverified <b>{brief.conflictReport.unverified.length}</b></span>
              </div>
            </header>

            <ParsedSituationSection brief={brief} />
            <RecommendedActionSection brief={brief} />
            <VisaOptionsSection brief={brief} mode={mode} />
            <EntryRequirementsSection brief={brief} />
            <BorderRunSection brief={brief} locked={lockDepthGated} mode={mode} />
            <RecentChangesSection brief={brief} />
            <ConflictSection brief={brief} locked={lockDepthGated} mode={mode} />
            <CitationsSection brief={brief} />
            <ContingencySection brief={brief} locked={lockDepthGated} mode={mode} />

            <footer className="docfoot">
              <div className="disc">
                <span className="m">Disclaimer</span>
                <span>{brief.disclaimer || 'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.'}</span>
              </div>
              <div className="colophon">
                <span>VisaScout &middot; visascout.io &middot; &copy; 2026 Sabai Wave LLC</span>
                <span>{DEPTH_LABEL[depth as 'quick' | 'standard' | 'deep'] ?? depth} depth &middot; {totalCount} agents &middot; {Math.round(brief.metadata.totalDurationMs / 1000)}s &middot; {brief.metadata.model}</span>
                <span>{fmt(brief.metadata.generatedAt)}</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
