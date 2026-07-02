import type { VisaBrief, VisaOption, ConflictItem } from '@/src/types/index';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PdfMeta {
  nationality: string;
  destination: string;
  depth: string;
  createdAt: string;
}

// Print color palette — light-mode equivalent of dark UI tokens
const C = {
  bg:          '#ffffff',
  bgElevated:  '#f8fafc',
  bgSubtle:    '#f1f5f9',
  border:      '#e2e8f0',
  borderStrong:'#cbd5e1',
  textPrimary: '#0f172a',
  textSecondary:'#374151',
  textTertiary:'#6b7280',
  indigo:      '#6366f1',
  indigoDeep:  '#4f46e5',
  indigoSubtle:'#eef2ff',
  amber:       '#d97706',
  amberSubtle: '#fffbeb',
  amberBorder: '#fde68a',
  success:     '#16a34a',
  successSubtle:'#f0fdf4',
  error:       '#dc2626',
  errorSubtle: '#fee2e2',
};

function mono(text: string, opts: { size?: number; weight?: number; color?: string; upper?: boolean; tracking?: string } = {}): string {
  const { size = 10.5, weight = 700, color = C.indigoDeep, upper = true, tracking = '0.07em' } = opts;
  return `<span style="font-family:'JetBrains Mono',monospace;font-size:${size}px;font-weight:${weight};color:${color};${upper ? `text-transform:uppercase;letter-spacing:${tracking};` : ''}">${text}</span>`;
}

function label(text: string, color = C.indigoDeep): string {
  return `<p style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${color};margin:0 0 5px;">${esc(text)}</p>`;
}

function sectionHeading(title: string): string {
  return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid ${C.border};">
    <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${C.indigo};">//</span>
    <span style="font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:700;color:${C.textPrimary};text-transform:uppercase;letter-spacing:0.05em;">${esc(title)}</span>
  </div>`;
}

function card(title: string, content: string): string {
  return `<div style="border:1px solid ${C.border};border-radius:8px;padding:16px 18px;margin-bottom:16px;page-break-inside:avoid;background:${C.bg};">
    ${sectionHeading(title)}
    ${content}
  </div>`;
}

function warningBox(header: string, items: string[]): string {
  if (!items.length) return '';
  return `<div style="background:${C.amberSubtle};border:1px solid ${C.amberBorder};border-radius:6px;padding:10px 12px;margin-top:10px;page-break-inside:avoid;">
    ${label(header, C.amber)}
    ${items.map(i => `<p style="font-size:12px;color:${C.textSecondary};margin:3px 0 0;display:flex;gap:6px;align-items:flex-start;"><span style="color:${C.amber};flex-shrink:0;">⚠</span><span>${esc(i)}</span></p>`).join('')}
  </div>`;
}

function tierBadge(tier: 1 | 2 | 3 | 4): string {
  const isTop = tier <= 1;
  return `<span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:${isTop ? 700 : 400};text-transform:uppercase;letter-spacing:0.05em;padding:2px 6px;border-radius:4px;flex-shrink:0;background:${isTop ? C.indigoSubtle : C.bgSubtle};color:${isTop ? C.indigoDeep : C.textTertiary};">T${tier}</span>`;
}

function visaOptionHtml(opt: VisaOption): string {
  const borderColor = opt.suitability === 'best' ? C.success : opt.suitability === 'good' ? C.indigo : C.borderStrong;
  const bg = opt.suitability === 'best' ? C.successSubtle : opt.suitability === 'good' ? C.indigoSubtle : C.bgElevated;
  return `<div style="border-left:4px solid ${borderColor};border-top:1px solid ${C.border};border-right:1px solid ${C.border};border-bottom:1px solid ${C.border};border-radius:0 6px 6px 0;background:${bg};padding:12px;margin-bottom:10px;page-break-inside:avoid;">
    <div style="margin-bottom:4px;">
      <span style="font-family:'Geist',sans-serif;font-weight:700;font-size:13px;color:${C.textPrimary};">${esc(opt.name)}</span>
      <div style="display:flex;align-items:baseline;gap:8px;margin-top:3px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${C.textTertiary};flex-shrink:0;">Max Stay</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${C.indigoDeep};">${esc(opt.maxStay)}</span>
      </div>
    </div>
    <p style="font-size:12px;color:${C.textSecondary};margin:0 0 8px;line-height:1.5;">${esc(opt.summary)}</p>
    <ul style="list-style:none;padding:0;margin:0;">
      ${opt.pros.map(p => `<li style="display:flex;gap:7px;align-items:flex-start;margin-bottom:3px;"><span style="background:rgba(22,163,74,0.12);color:${C.success};font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.05em;">Pro</span><span style="font-size:12px;color:${C.textSecondary};">${esc(p)}</span></li>`).join('')}
      ${opt.cons.map(c => `<li style="display:flex;gap:7px;align-items:flex-start;margin-bottom:3px;"><span style="background:rgba(220,38,38,0.1);color:${C.error};font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.05em;">Con</span><span style="font-size:12px;color:${C.textSecondary};">${esc(c)}</span></li>`).join('')}
    </ul>
  </div>`;
}

function conflictItems(items: ConflictItem[], color: string, labelText: string): string {
  if (!items.length) return '';
  return `<div style="margin-bottom:12px;">
    ${label(labelText, color)}
    ${items.map(item => `<div style="margin-bottom:8px;${labelText === 'Contested' ? `border-left:2px solid ${color};padding-left:10px;` : ''}">
      <p style="font-family:'Geist',sans-serif;font-weight:600;font-size:12.5px;color:${C.textPrimary};margin:0 0 2px;">${esc(item.topic)}</p>
      <p style="font-size:12px;color:${C.textSecondary};margin:0;">${esc(item.description)}</p>
      ${item.resolution ? `<div style="margin-top:5px;">${label('Resolution', color)}<p style="font-size:12px;color:${C.textSecondary};margin:0;">${esc(item.resolution)}</p></div>` : ''}
    </div>`).join('')}
  </div>`;
}

export function generateBriefHtml(brief: VisaBrief, meta: PdfMeta): string {
  const { nationality, destination, depth, createdAt } = meta;

  const _d = new Date(createdAt);
  const generatedDate = _d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const generatedTime = _d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
  });

  const confColor = { high: C.success, medium: C.amber, low: C.error }[brief.confidenceScore.overall];
  const confBg = { high: C.successSubtle, medium: C.amberSubtle, low: C.errorSubtle }[brief.confidenceScore.overall];

  const recommendedAction = `<div style="border-left:4px solid ${C.amber};border-top:1px solid ${C.amberBorder};border-right:1px solid ${C.amberBorder};border-bottom:1px solid ${C.amberBorder};border-radius:0 8px 8px 0;background:${C.amberSubtle};padding:16px;margin-bottom:16px;page-break-inside:avoid;">
    ${label('Recommended Action', C.amber)}
    <p style="font-family:'Geist',sans-serif;font-size:15px;font-weight:700;color:${C.textPrimary};margin:4px 0;">${esc(brief.recommendedAction.action)}</p>
    ${brief.recommendedAction.deadline ? `<p style="font-family:'Geist',sans-serif;font-size:12px;font-weight:600;color:${C.error};margin:4px 0;">Deadline: ${esc(brief.recommendedAction.deadline)}</p>` : ''}
    <p style="font-size:12px;color:${C.textSecondary};margin:8px 0 0;line-height:1.5;">${esc(brief.recommendedAction.rationale)}</p>
    <div style="display:flex;align-items:center;gap:8px;margin-top:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;border-radius:4px;background:${confBg};color:${confColor};">CONF · ${esc(brief.confidenceScore.overall.toUpperCase())}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;color:${C.textTertiary};text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Overall Confidence</span>
    </div>
  </div>`;

  const visaOptions = card('Visa Options', brief.visaOptions.map(visaOptionHtml).join(''));

  const entryContent = `
    ${brief.entryRequirements.documents.length ? `${label('Required Documents')}<ul style="list-style:none;padding:0;margin:0 0 12px;">${brief.entryRequirements.documents.map(d => `<li style="font-size:12px;color:${C.textSecondary};padding:2px 0;">• ${esc(d)}</li>`).join('')}</ul>` : ''}
    ${brief.entryRequirements.proofOfFunds ? `${label('Proof of Funds')}<p style="font-size:12px;color:${C.textSecondary};margin:0 0 12px;">${esc(brief.entryRequirements.proofOfFunds)}</p>` : ''}
    ${label('Onward Ticket')}<p style="font-size:12px;color:${C.textSecondary};margin:0 0 12px;">${brief.entryRequirements.onwardTicket ? 'Required' : 'Not required'}</p>
    ${brief.entryRequirements.notes.length ? `<ul style="list-style:none;padding:0;margin:0;">${brief.entryRequirements.notes.map(n => `<li style="font-size:12px;color:${C.textSecondary};padding:2px 0;">• ${esc(n)}</li>`).join('')}</ul>` : ''}`;
  const entryReqs = card('Entry Requirements', entryContent);

  const borderContent = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
      <div>${label('Eligible')}<p style="font-size:12px;color:${C.textSecondary};margin:0;">${brief.borderRunAnalysis.eligible ? 'Yes' : 'No'}</p></div>
      ${brief.borderRunAnalysis.limitsPerYear ? `<div>${label('Annual Limit')}<p style="font-size:12px;color:${C.textSecondary};margin:0;">${esc(brief.borderRunAnalysis.limitsPerYear)}</p></div>` : ''}
    </div>
    ${label('Enforcement Posture')}<p style="font-size:12px;color:${C.textSecondary};margin:0 0 10px;">${esc(brief.borderRunAnalysis.enforcementPosture)}</p>
    ${warningBox('Warnings', brief.borderRunAnalysis.warnings)}`;
  const borderRun = card('Border Run Analysis', borderContent);

  const recentChanges = brief.recentChanges.hasChanges ? card(
    'Recent Changes & Watch Items',
    `<ul style="list-style:none;padding:0;margin:0${brief.recentChanges.watchItems.length ? ' 0 10px' : ''};">${brief.recentChanges.items.map(i => `<li style="font-size:12px;color:${C.textSecondary};padding:3px 0;">• ${esc(i)}</li>`).join('')}</ul>${warningBox('Watch Items', brief.recentChanges.watchItems)}`,
  ) : '';

  const citations = brief.confidenceScore.sourceCitations.length ? card(
    'Source Citations',
    `<ul style="list-style:none;padding:0;margin:0;">${brief.confidenceScore.sourceCitations.map(cite => `
      <li style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
        ${tierBadge(cite.tier as 1 | 2 | 3 | 4)}
        <div>
          <p style="font-size:12px;color:${C.textSecondary};margin:0 0 2px;">${esc(cite.claim)}</p>
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;color:${C.indigo};word-break:break-all;">${esc(cite.url)}</span>
        </div>
      </li>`).join('')}</ul>`,
  ) : '';

  const { confirmed, contested, unverified } = brief.conflictReport;
  const conflictTotal = confirmed.length + contested.length + unverified.length;
  const conflictTitle = `Conflict Report — ${conflictTotal} item${conflictTotal !== 1 ? 's' : ''}${contested.length ? ` (${contested.length} contested)` : ''}`;
  const conflict = card(
    conflictTitle,
    conflictItems(confirmed, C.success, 'Confirmed') +
    conflictItems(contested, C.amber, 'Contested') +
    conflictItems(unverified, C.error, 'Unverified'),
  );

  const contingencyContent = `
    ${brief.contingency.deniedEntrySteps.length ? `${label('If Denied Entry')}<ul style="list-style:none;padding:0;margin:0 0 12px;">${brief.contingency.deniedEntrySteps.map(s => `<li style="font-size:12px;color:${C.textSecondary};padding:2px 0;">• ${esc(s)}</li>`).join('')}</ul>` : ''}
    ${label('Overstay Scenario')}<p style="font-size:12px;color:${C.textSecondary};margin:0 0 12px;">${esc(brief.contingency.overstayScenario)}</p>
    ${brief.contingency.emergencyContacts.length ? `${label('Emergency Contacts')}<ul style="list-style:none;padding:0;margin:0;">${brief.contingency.emergencyContacts.map(c => `<li style="font-size:12px;color:${C.textSecondary};padding:2px 0;">• ${esc(c)}</li>`).join('')}</ul>` : ''}`;
  const contingency = card('Contingency Planning', contingencyContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VisaScout Brief — ${esc(nationality)} → ${esc(destination)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital,wght@0,400;1,400&family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Geist', system-ui, -apple-system, sans-serif;
      color: ${C.textPrimary};
      background: ${C.bg};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 13px;
      line-height: 1.5;
    }
    @page { size: A4; margin: 18mm 15mm; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom:1px solid rgba(99,102,241,0.4);padding-bottom:14px;margin-bottom:18px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;color:${C.indigo};text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">VisaScout · Visa Intelligence</div>
        <h1 style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:${C.textPrimary};text-transform:uppercase;letter-spacing:0.04em;">
          <span style="color:${C.indigo};margin-right:8px;">//</span>${esc(nationality.toUpperCase())} <span style="color:${C.textTertiary};">→</span> ${esc(destination.toUpperCase())}
        </h1>
      </div>
      <div style="text-align:right;">
        ${mono(esc(depth.toUpperCase()) + ' DEPTH', { size: 9.5, color: C.textTertiary, tracking: '0.07em' })}
        <br>
        ${mono('Generated ' + esc(generatedDate) + ' · ' + esc(generatedTime) + ' UTC', { size: 9, color: C.textTertiary, tracking: '0.05em' })}
      </div>
    </div>
  </div>

  <!-- We Understood -->
  <div style="background:${C.indigoSubtle};border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:12px 16px;margin-bottom:16px;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:${C.indigo};">//</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${C.indigoDeep};text-transform:uppercase;letter-spacing:0.05em;">We Understood</span>
    </div>
    <p style="font-size:12px;color:${C.textPrimary};line-height:1.55;">${esc(brief.parsedSituation)}</p>
  </div>

  ${recommendedAction}
  ${visaOptions}
  ${entryReqs}
  ${borderRun}
  ${recentChanges}
  ${citations}
  ${conflict}
  ${contingency}

  <!-- Disclaimer + Footer -->
  <div style="page-break-inside:avoid;margin-top:16px;padding-top:12px;border-top:1px solid ${C.border};">
    <p style="font-size:10px;color:${C.textTertiary};line-height:1.6;margin-bottom:10px;">⚠ ${esc(brief.disclaimer)}</p>
    <p style="font-family:'JetBrains Mono',monospace;font-size:9px;color:${C.textTertiary};text-transform:uppercase;letter-spacing:0.08em;text-align:center;">Generated by VisaScout · visascout.io · ${esc(generatedDate)} · ${esc(generatedTime)} UTC</p>
  </div>
</body>
</html>`;
}
