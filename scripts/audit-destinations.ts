import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tavilySearch } from '../src/tools/tavily.js';
import { DESTINATIONS, type DestinationConfig } from '../src/config/destinations.js';
import { parseJSON } from '../src/lib/parseJSON.js';

const MODEL = 'claude-sonnet-4-6';

interface DomainAudit {
  domain: string;
  status: 'active' | 'broken' | 'unknown';
  note?: string | null;
}

interface VisaTypeAudit {
  name: string;
  status: 'confirmed' | 'renamed' | 'discontinued' | 'changed';
  currentName?: string | null;
  note?: string | null;
}

interface DestinationAuditResult {
  destination: string;
  govDomains: DomainAudit[];
  visaTypes: VisaTypeAudit[];
  newVisaTypes: { name: string; note: string }[];
  notesUpdate?: string | null;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

async function auditDestination(
  dest: DestinationConfig,
  client: Anthropic
): Promise<DestinationAuditResult> {
  process.stdout.write(`[audit] ${dest.name}... `);

  const [govResults, newsResults] = await Promise.all([
    tavilySearch(`${dest.name} visa types requirements 2025 official`, {
      maxResults: 5,
      domainBias: dest.govDomains,
    }),
    tavilySearch(`${dest.name} visa policy changes 2024 2025`, {
      maxResults: 3,
      days: 180,
    }),
  ]);

  const searchContext = [...govResults, ...newsResults]
    .map((r) => `URL: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
    .join('\n\n---\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are auditing VisaScout's hardcoded destination config for ${dest.name}.

CURRENT CONFIG:
govDomains: ${JSON.stringify(dest.govDomains)}
visaTypes: ${JSON.stringify(dest.visaTypes)}
notes: ${dest.notes ?? 'none'}

SEARCH RESULTS (from gov domains + recent news):
${searchContext || 'No results returned.'}

Compare the search results against the current config. Check:
1. Which govDomains appear active (URL found in results) vs broken/unknown.
2. Which visaTypes are confirmed current, renamed, changed, or discontinued.
3. Any new visa types/programs not in the config.
4. Whether the notes field needs updating.

NOTES FIELD RULE — CRITICAL:
The notes field is injected into agent system prompts as behavioral guardrails, not factual claims.
It must tell agents HOW TO BEHAVE, not WHAT THE FACTS ARE.
Facts go stale; behavior stays stable.

ALLOWED in notesUpdate:
- "Do not assert X without verifying from search results"
- "Always surface Y to the user"
- "Verify Z at [official source] before advising"
- "Never conflate A and B — they are distinct"
- Stable structural distinctions between visa types
- Process facts unlikely to change (e.g. "must appear in person", "surrendered at exit")

NOT ALLOWED in notesUpdate:
- Specific durations, fees, or counts (e.g. "60 days", "S$5,600", "93 nationalities")
- Specific dates or law references (e.g. "effective Oct 23, 2025", "Law No. 61/2025")
- Factual claims about current policy that will go stale within months

If you would write a factual claim, convert it: instead of "visa is now 60 days", write "do not assume any specific duration — confirm from search results".

Base confidence on result quality: high = multiple gov sources confirm, medium = partial coverage, low = few/no gov sources.

Return JSON only:
{
  "destination": "${dest.name}",
  "govDomains": [
    { "domain": "string", "status": "active|broken|unknown", "note": "string or null" }
  ],
  "visaTypes": [
    { "name": "exact config name", "status": "confirmed|renamed|discontinued|changed", "currentName": "new name or null", "note": "string or null" }
  ],
  "newVisaTypes": [
    { "name": "string", "note": "string" }
  ],
  "notesUpdate": "behavioral guardrail notes replacement, or null if no change needed",
  "confidence": "high|medium|low",
  "summary": "1-2 sentence summary of what changed and what needs attention"
}`,
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const result = parseJSON<DestinationAuditResult>(raw);
  const issueCount =
    result.govDomains.filter((d) => d.status !== 'active').length +
    result.visaTypes.filter((v) => v.status !== 'confirmed').length +
    result.newVisaTypes.length;
  console.log(issueCount > 0 ? `⚠ ${issueCount} issue(s)` : '✓ clean');
  return result;
}

function renderReport(results: DestinationAuditResult[], runDate: string): string {
  const lines: string[] = [
    `# VisaScout Destination Audit`,
    ``,
    `**Run date:** ${runDate}`,
    `**Destinations audited:** ${results.length}`,
    ``,
  ];

  const flagged = results.filter(
    (r) =>
      r.govDomains.some((d) => d.status !== 'active') ||
      r.visaTypes.some((v) => v.status !== 'confirmed') ||
      r.newVisaTypes.length > 0
  );

  lines.push(`## Summary`);
  if (flagged.length === 0) {
    lines.push(`All ${results.length} destinations look current. No changes needed.`);
  } else {
    lines.push(`**${flagged.length}/${results.length} destinations need attention:**`);
    for (const r of flagged) {
      const domainIssues = r.govDomains.filter((d) => d.status !== 'active').length;
      const visaIssues = r.visaTypes.filter((v) => v.status !== 'confirmed').length;
      const newCount = r.newVisaTypes.length;
      const parts = [];
      if (domainIssues) parts.push(`${domainIssues} domain issue(s)`);
      if (visaIssues) parts.push(`${visaIssues} visa type change(s)`);
      if (newCount) parts.push(`${newCount} new visa type(s)`);
      lines.push(`- **${r.destination}**: ${parts.join(', ')}`);
    }
  }
  lines.push(``);

  for (const result of results) {
    const domainIssues = result.govDomains.filter((d) => d.status !== 'active');
    const visaIssues = result.visaTypes.filter((v) => v.status !== 'confirmed');
    const hasIssues = domainIssues.length > 0 || visaIssues.length > 0 || result.newVisaTypes.length > 0;
    const icon = hasIssues ? '⚠️' : '✅';

    lines.push(`## ${icon} ${result.destination}`);
    lines.push(`*Confidence: ${result.confidence} — ${result.summary}*`);
    lines.push(``);

    lines.push(`**Gov Domains:**`);
    for (const d of result.govDomains) {
      const mark = d.status === 'active' ? '✓' : d.status === 'broken' ? '✗' : '?';
      const noteStr = d.note ? ` — ${d.note}` : '';
      lines.push(`- \`${d.domain}\` ${mark} ${d.status}${noteStr}`);
    }
    lines.push(``);

    lines.push(`**Visa Types:**`);
    for (const v of result.visaTypes) {
      const mark = v.status === 'confirmed' ? '✓' : '⚠';
      const renameStr = v.currentName ? ` → \`${v.currentName}\`` : '';
      const noteStr = v.note ? ` (${v.note})` : '';
      lines.push(`- ${mark} ${v.name} — ${v.status}${renameStr}${noteStr}`);
    }

    if (result.newVisaTypes.length > 0) {
      lines.push(``);
      lines.push(`**New visa types (not in config):**`);
      for (const v of result.newVisaTypes) {
        lines.push(`- ➕ **${v.name}**: ${v.note}`);
      }
    }

    if (result.notesUpdate) {
      lines.push(``);
      lines.push(`**Suggested notes update:**`);
      lines.push(`> ${result.notesUpdate}`);
    }

    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Generated by \`npx tsx scripts/audit-destinations.ts\`*`);

  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const destIdx = args.indexOf('--dest');
  const regionIdx = args.indexOf('--region');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  let targets = [...DESTINATIONS];

  if (destIdx !== -1 && args[destIdx + 1]) {
    const name = args[destIdx + 1].toLowerCase();
    targets = DESTINATIONS.filter((d) => d.name.toLowerCase() === name);
    if (targets.length === 0) {
      console.error(`Unknown destination: ${args[destIdx + 1]}`);
      console.error(`Valid: ${DESTINATIONS.map((d) => d.name).join(', ')}`);
      process.exit(1);
    }
  } else if (regionIdx !== -1 && args[regionIdx + 1]) {
    const region = args[regionIdx + 1].toLowerCase();
    targets = DESTINATIONS.filter((d) => d.region.toLowerCase() === region);
    if (targets.length === 0) {
      console.error(`Unknown region: ${args[regionIdx + 1]}`);
      console.error(`Valid: SEA, "East Asia", Schengen, "Latin America"`);
      process.exit(1);
    }
  }

  console.log(`\nAuditing ${targets.length} destination(s) — ~$${(targets.length * 0.06).toFixed(2)} estimated cost\n`);

  const results: DestinationAuditResult[] = [];

  for (const dest of targets) {
    try {
      const result = await auditDestination(dest, client);
      results.push(result);
    } catch (err) {
      console.log(`✗ error`);
      console.error(`  ${String(err)}`);
      results.push({
        destination: dest.name,
        govDomains: dest.govDomains.map((d) => ({ domain: d, status: 'unknown' as const })),
        visaTypes: dest.visaTypes.map((v) => ({ name: v, status: 'confirmed' as const })),
        newVisaTypes: [],
        confidence: 'low',
        summary: `Audit failed: ${String(err)}`,
      });
    }
  }

  const runDate = new Date().toISOString().split('T')[0];
  const report = renderReport(results, runDate);

  mkdirSync('outputs', { recursive: true });
  const outPath = join('outputs', `audit-destinations-${runDate}.md`);
  writeFileSync(outPath, report, 'utf-8');

  console.log('\n' + report);
  console.log(`\nSaved: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



// Usage: npx tsx scripts/audit-destinations.ts [--dest "Destination Name"] [--region "Region Name"]


/**
 * 
 # Single country (cheapest to test)
bash scripts/run.sh scripts/audit-destinations.ts --dest Thailand

# One region
bash scripts/run.sh scripts/audit-destinations.ts --region SEA

# Full audit
bash scripts/run.sh scripts/audit-destinations.ts

 */