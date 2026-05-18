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

function label(text: string, color = '#4f46e5'): string {
  return `<p style="font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${color};margin:0 0 5px;">${esc(text)}</p>`;
}

function sectionHeader(title: string): string {
  return `<div style="padding:12px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
    <span style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#111827;">
      <span style="color:#4f46e5;">//</span> ${esc(title)}
    </span>
  </div>`;
}

function card(title: string, content: string): string {
  return `<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:18px;page-break-inside:avoid;">
    ${sectionHeader(title)}
    <div style="padding:18px;">${content}</div>
  </div>`;
}

function warningBox(header: string, items: string[]): string {
  if (!items.length) return '';
  return `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 14px;margin-top:12px;page-break-inside:avoid;">
    ${label(header, '#b45309')}
    ${items.map(i => `<p style="font-size:12.5px;color:#92400e;margin:3px 0 0;display:flex;gap:6px;"><span>⚠</span><span>${esc(i)}</span></p>`).join('')}
  </div>`;
}

function visaOptionHtml(opt: VisaOption): string {
  const borderColor = opt.suitability === 'best' ? '#16a34a' : opt.suitability === 'good' ? '#4f46e5' : '#9ca3af';
  const bg = opt.suitability === 'best' ? '#f0fdf4' : opt.suitability === 'good' ? '#eef2ff' : '#f9fafb';
  return `<div style="border-left:4px solid ${borderColor};border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;border-radius:0 6px 6px 0;background:${bg};padding:14px;margin-bottom:10px;page-break-inside:avoid;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
      <span style="font-weight:700;font-size:13.5px;color:#111827;">${esc(opt.name)}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#4f46e5;font-weight:600;">Max stay: ${esc(opt.maxStay)}</span>
    </div>
    <p style="font-size:12.5px;color:#4b5563;margin:0 0 8px;">${esc(opt.summary)}</p>
    <ul style="list-style:none;padding:0;margin:0;">
      ${opt.pros.map(p => `<li style="display:flex;gap:7px;align-items:flex-start;margin-bottom:3px;"><span style="background:#dcfce7;color:#15803d;font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.05em;">PRO</span><span style="font-size:12.5px;color:#374151;">${esc(p)}</span></li>`).join('')}
      ${opt.cons.map(c => `<li style="display:flex;gap:7px;align-items:flex-start;margin-bottom:3px;"><span style="background:#fee2e2;color:#dc2626;font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;padding:1px 5px;border-radius:3px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.05em;">CON</span><span style="font-size:12.5px;color:#374151;">${esc(c)}</span></li>`).join('')}
    </ul>
  </div>`;
}

function conflictItems(items: ConflictItem[], color: string, labelText: string): string {
  if (!items.length) return '';
  return `${label(labelText, color)}
    ${items.map(item => `<div style="margin-bottom:10px;${labelText === 'Contested' ? `border-left:2px solid ${color};padding-left:10px;` : ''}">
      <p style="font-weight:600;font-size:13px;color:#111827;margin:0 0 2px;">${esc(item.topic)}</p>
      <p style="font-size:12.5px;color:#4b5563;margin:0;">${esc(item.description)}</p>
      ${item.resolution ? `${label('Resolution', color)}<p style="font-size:12.5px;color:#4b5563;margin:0;">${esc(item.resolution)}</p>` : ''}
    </div>`).join('')}`;
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

  const confColor = { high: '#15803d', medium: '#854d0e', low: '#dc2626' }[brief.confidenceScore.overall];
  const confBg = { high: '#dcfce7', medium: '#fef9c3', low: '#fee2e2' }[brief.confidenceScore.overall];

  const recommendedAction = `<div style="border-left:4px solid #d97706;border-top:1px solid #fde68a;border-right:1px solid #fde68a;border-bottom:1px solid #fde68a;border-radius:0 8px 8px 0;background:#fffbeb;padding:18px;margin-bottom:18px;page-break-inside:avoid;">
    ${label('Recommended Action', '#b45309')}
    <p style="font-size:16px;font-weight:700;color:#111827;margin:4px 0;">${esc(brief.recommendedAction.action)}</p>
    ${brief.recommendedAction.deadline ? `<p style="font-size:12.5px;font-weight:600;color:#dc2626;margin:4px 0;">Deadline: ${esc(brief.recommendedAction.deadline)}</p>` : ''}
    <p style="font-size:12.5px;color:#4b5563;margin:8px 0 0;">${esc(brief.recommendedAction.rationale)}</p>
    <div style="margin-top:10px;">
      <span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 8px;border-radius:4px;background:${confBg};color:${confColor};">${esc(brief.confidenceScore.overall)}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#6b7280;margin-left:8px;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Overall Confidence</span>
    </div>
  </div>`;

  const visaOptions = card('Visa Options', brief.visaOptions.map(visaOptionHtml).join(''));

  const entryContent = `
    ${brief.entryRequirements.documents.length ? `${label('Required Documents')}<ul style="list-style:none;padding:0;margin:0 0 12px;">${brief.entryRequirements.documents.map(d => `<li style="font-size:12.5px;color:#374151;padding:2px 0;">• ${esc(d)}</li>`).join('')}</ul>` : ''}
    ${brief.entryRequirements.proofOfFunds ? `${label('Proof of Funds')}<p style="font-size:12.5px;color:#374151;margin:0 0 12px;">${esc(brief.entryRequirements.proofOfFunds)}</p>` : ''}
    ${label('Onward Ticket')}<p style="font-size:12.5px;color:#374151;margin:0 0 12px;">${brief.entryRequirements.onwardTicket ? 'Required' : 'Not required'}</p>
    ${brief.entryRequirements.notes.length ? `<ul style="list-style:none;padding:0;margin:0;">${brief.entryRequirements.notes.map(n => `<li style="font-size:12.5px;color:#374151;padding:2px 0;">• ${esc(n)}</li>`).join('')}</ul>` : ''}`;
  const entryReqs = card('Entry Requirements', entryContent);

  const borderContent = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
      <div>${label('Eligible')}<p style="font-size:12.5px;color:#374151;margin:0;">${brief.borderRunAnalysis.eligible ? 'Yes' : 'No'}</p></div>
      ${brief.borderRunAnalysis.limitsPerYear ? `<div>${label('Annual Limit')}<p style="font-size:12.5px;color:#374151;margin:0;">${esc(brief.borderRunAnalysis.limitsPerYear)}</p></div>` : ''}
    </div>
    ${label('Enforcement Posture')}<p style="font-size:12.5px;color:#374151;margin:0 0 12px;">${esc(brief.borderRunAnalysis.enforcementPosture)}</p>
    ${warningBox('Warnings', brief.borderRunAnalysis.warnings)}`;
  const borderRun = card('Border Run Analysis', borderContent);

  const recentChanges = brief.recentChanges.hasChanges ? card(
    'Recent Changes & Watch Items',
    `<ul style="list-style:none;padding:0;margin:0${brief.recentChanges.watchItems.length ? ' 0 12px' : ''};">${brief.recentChanges.items.map(i => `<li style="font-size:12.5px;color:#374151;padding:3px 0;">• ${esc(i)}</li>`).join('')}</ul>${warningBox('Watch Items', brief.recentChanges.watchItems)}`,
  ) : '';

  const citations = brief.confidenceScore.sourceCitations.length ? card(
    'Source Citations',
    `<ul style="list-style:none;padding:0;margin:0;">${brief.confidenceScore.sourceCitations.map(cite => `
      <li style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:3px;flex-shrink:0;background:${cite.tier === 1 ? '#eef2ff' : '#f3f4f6'};color:${cite.tier === 1 ? '#4f46e5' : '#6b7280'};">TIER ${cite.tier}</span>
        <div><p style="font-size:12.5px;color:#374151;margin:0 0 2px;">${esc(cite.claim)}</p><span style="font-family:'JetBrains Mono',monospace;font-size:10.5px;color:#6366f1;word-break:break-all;">${esc(cite.url)}</span></div>
      </li>`).join('')}</ul>`,
  ) : '';

  const { confirmed, contested, unverified } = brief.conflictReport;
  const conflictTotal = confirmed.length + contested.length + unverified.length;
  const conflictTitle = `Conflict Report — ${conflictTotal} item${conflictTotal !== 1 ? 's' : ''}${contested.length ? ` (${contested.length} contested)` : ''}`;
  const conflict = card(
    conflictTitle,
    conflictItems(confirmed, '#16a34a', 'Confirmed') +
    conflictItems(contested, '#d97706', 'Contested') +
    conflictItems(unverified, '#dc2626', 'Unverified'),
  );

  const contingencyContent = `
    ${brief.contingency.deniedEntrySteps.length ? `${label('If Denied Entry')}<ul style="list-style:none;padding:0;margin:0 0 12px;">${brief.contingency.deniedEntrySteps.map(s => `<li style="font-size:12.5px;color:#374151;padding:2px 0;">• ${esc(s)}</li>`).join('')}</ul>` : ''}
    ${label('Overstay Scenario')}<p style="font-size:12.5px;color:#374151;margin:0 0 12px;">${esc(brief.contingency.overstayScenario)}</p>
    ${brief.contingency.emergencyContacts.length ? `${label('Emergency Contacts')}<ul style="list-style:none;padding:0;margin:0;">${brief.contingency.emergencyContacts.map(c => `<li style="font-size:12.5px;color:#374151;padding:2px 0;">• ${esc(c)}</li>`).join('')}</ul>` : ''}`;
  const contingency = card('Contingency Planning', contingencyContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VisaScout Brief — ${esc(nationality)} → ${esc(destination)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #111827; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 18mm 15mm; }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:3px;">VisaScout · Visa Intelligence</div>
        <h1 style="font-family:'JetBrains Mono',monospace;font-size:20px;font-weight:700;color:#111827;">${esc(nationality)} <span style="color:#6b7280;">→</span> ${esc(destination)}</h1>
      </div>
      <div style="text-align:right;">
        <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">${esc(depth)} DEPTH</p>
        <p style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">GENERATED ${esc(generatedDate)} · ${esc(generatedTime)} UTC</p>
      </div>
    </div>
  </div>

  <!-- Parsed Situation -->
  <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:14px 16px;margin-bottom:18px;page-break-inside:avoid;">
    <p style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:#4f46e5;margin-bottom:5px;"><span style="opacity:0.6;">//</span> We Understood</p>
    <p style="font-size:12.5px;color:#1e1b4b;line-height:1.55;">${esc(brief.parsedSituation)}</p>
  </div>

  ${recommendedAction}
  ${visaOptions}
  ${entryReqs}
  ${borderRun}
  ${recentChanges}
  ${citations}
  ${conflict}
  ${contingency}

  <!-- Disclaimer + Footer — fine print, kept together to prevent orphaned page -->
  <div style="page-break-inside:avoid;margin-top:18px;padding-top:12px;border-top:1px solid #e5e7eb;">
    <p style="font-size:10.5px;color:#9ca3af;line-height:1.6;margin-bottom:10px;">⚠ ${esc(brief.disclaimer)}</p>
    <p style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;text-align:center;">Generated by VisaScout · visascout.io · ${generatedDate} · ${generatedTime} UTC</p>
  </div>
</body>
</html>`;
}
