import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '../src/orchestrator.js';
import { resolveConflicts } from '../src/synthesis/conflictResolver.js';
import { synthesizeBrief } from '../src/synthesis/synthesize.js';
import { printCostSummary, resetUsage } from '../src/lib/cost.js';
import type {
  AgentResultEnvelope,
  VisaRequest,
  OfficialPolicyOutput,
  RecentChangesOutput,
  CommunityIntelOutput,
  EntryRequirementsOutput,
  BorderRunOutput,
  AgentResult,
  ConflictReport,
} from '../src/types/index.js';

const DRY_RUN = process.env.DRY_RUN === 'true';

const TEST_INPUT = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'tourist visa exemption',
  freeform:
    'Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company.',
};

// --- Fixture data for DRY_RUN mode ---

const FIXTURE_VISA_REQUEST: VisaRequest = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'tourist visa exemption',
  freeform: TEST_INPUT.freeform,
  normalizedNationality: 'United States',
  normalizedDestination: 'Thailand',
  intendedDuration: '28 days',
  entryExitPattern: 'single entry with one border run to Malaysia',
  incomeSource: 'remote work for US company',
  priorVisitHistory: undefined,
  accommodationType: undefined,
  parsedSummary:
    'A US passport holder plans to arrive in Thailand on March 15 for a 28-day stay under the visa exemption program, working remotely for a US employer. They are planning one border run to Malaysia, likely to reset their visa exemption stamp.',
};

const FIXTURE_OFFICIAL_POLICY: AgentResult<OfficialPolicyOutput> = {
  status: 'success',
  data: {
    visaTypes: [
      {
        name: 'Visa Exemption (Tourist)',
        maxStay: '30 days (overland) / 30 days (air)',
        canExtend: true,
        extensionDetails: 'Can extend once at local immigration office for 30 additional days (fee: 1,900 THB)',
        fee: 'Free',
        eligibility: 'US passport holders — eligible under bilateral agreement',
      },
      {
        name: 'Tourist Visa (TR)',
        maxStay: '60 days, extendable once for 30 days',
        canExtend: true,
        extensionDetails: '30-day extension at immigration office, fee: 1,900 THB',
        fee: '~$40 USD at Thai consulate',
        eligibility: 'All nationalities',
      },
    ],
    defaultStayDuration: '30 days visa exemption (air entry)',
    extensionRules:
      'Visa exemption can be extended once for 30 days at a local immigration office. Fee: 1,900 THB.',
    fees: 'Visa exemption: free. TR visa: ~$40. Extension: 1,900 THB.',
    applicationProcess:
      'Visa exemption: no application needed — granted on arrival. TR visa: apply at Thai consulate before travel.',
    notes: [
      'Land border crossings limited — Thailand enforces restrictions on back-to-back land entries',
      'As of 2024: Thailand allows up to 2 land border crossings per calendar year on visa exemption',
    ],
  },
  confidence: 'high',
  gaps: [],
  sourceTier: 1,
  sourceUrls: [
    'https://www.immigration.go.th/en/?page_id=1161',
    'https://thaiembassy.com/thailand-visa/thailand-visa-exemption',
  ],
  verified: true,
  durationMs: 1240,
};

const FIXTURE_RECENT_CHANGES: AgentResult<RecentChangesOutput> = {
  status: 'success',
  data: {
    changes: [
      {
        description:
          'Thailand extended the visa exemption duration for US passport holders from 30 to 60 days, effective November 2024.',
        effectiveDate: '2024-11-11',
        sourceUrl: 'https://www.mfa.go.th/en/content/thailand-visa-exemption-60days',
        sourceTier: 1,
      },
    ],
    enforcementShifts: [
      'Immigration officers at Suvarnabhumi airport reporting stricter scrutiny of travelers without onward tickets.',
    ],
    newRequirements: [],
    lastChecked: '2026-04-29',
  },
  confidence: 'high',
  gaps: [],
  sourceTier: 1,
  sourceUrls: ['https://www.mfa.go.th/en/content/thailand-visa-exemption-60days'],
  verified: true,
  durationMs: 980,
};

const FIXTURE_COMMUNITY_INTEL: AgentResult<CommunityIntelOutput> = {
  status: 'success',
  data: {
    recentReports: [
      {
        summary:
          'Multiple reports on r/ThailandTourism confirm the 60-day exemption is being granted consistently at Suvarnabhumi. Air entry smooth.',
        date: '2025-03',
        sourceUrl: 'https://reddit.com/r/ThailandTourism/comments/example',
        sentiment: 'positive',
      },
      {
        summary:
          'Border run to Malaysia via Padang Besar reported smooth in Feb 2025. Officer asked about return ticket.',
        date: '2025-02',
        sourceUrl: 'https://reddit.com/r/digitalnomad/comments/example2',
        sentiment: 'positive',
      },
    ],
    groundTruthNotes: [
      'Remote workers are advised to say "tourism" at immigration — not mention work.',
      'Onward ticket requirement is increasingly enforced at Suvarnabhumi for budget airline passengers.',
    ],
    enforcementReality:
      'Generally relaxed for US passport holders entering by air. Land crossings see more scrutiny, especially for repeat entries.',
    commonIssues: [
      'No onward ticket causing secondary screening',
      'Repeated land border crossings flagged as potential overstay risk',
    ],
  },
  confidence: 'medium',
  gaps: [],
  sourceTier: 4,
  sourceUrls: [
    'https://reddit.com/r/ThailandTourism/comments/example',
    'https://reddit.com/r/digitalnomad/comments/example2',
  ],
  verified: false,
  durationMs: 1100,
};

const FIXTURE_ENTRY_REQUIREMENTS: AgentResult<EntryRequirementsOutput> = {
  status: 'success',
  data: {
    requiredDocuments: [
      'Valid US passport (must have 6+ months validity)',
      'Return or onward ticket',
      'Proof of sufficient funds (20,000 THB per person recommended)',
      'Accommodation booking for at least first night',
    ],
    proofOfFundsThreshold: '20,000 THB per person (approximately $550 USD)',
    onwardTicketRequired: true,
    onwardTicketNotes:
      'Officially required. Enforcement is inconsistent but increasing at Suvarnabhumi — budget airline passengers more likely to be asked.',
    healthRequirements: [],
    additionalNotes: [
      'No visa required for US passport holders for stays up to 60 days (as of Nov 2024)',
    ],
  },
  confidence: 'high',
  gaps: [],
  sourceTier: 1,
  sourceUrls: ['https://www.immigration.go.th/en/?page_id=1161'],
  verified: true,
  durationMs: 870,
};

const FIXTURE_BORDER_RUN: AgentResult<BorderRunOutput> = {
  status: 'success',
  data: {
    limitsPerYear: '2 land border crossings per calendar year on visa exemption (Thai policy as of 2023)',
    crossingOptions: [
      {
        name: 'Padang Besar (Hat Yai → Padang Besar)',
        country: 'Malaysia',
        notes: 'Most popular visa run crossing. Train available from Hat Yai. Typically smooth for US passport holders.',
        recommended: true,
      },
      {
        name: 'Sadao / Bukit Kayu Hitam',
        country: 'Malaysia',
        notes: 'Road crossing. Busy but functional. Used by many Chiang Mai–based travelers via bus.',
        recommended: true,
      },
    ],
    enforcementPosture:
      'Moderate — immigration officers have discretion. Repeated land crossings within same calendar year may trigger questioning. Air entry + land return for one border run is the safest pattern.',
    recommendedCrossings: ['Padang Besar'],
    warnings: [
      'Exceeding 2 land crossings per year on visa exemption may result in denial of entry',
      'Always carry proof of funds and a return/onward ticket for border runs',
      'Some immigration officers ask about income source — having proof of employment or savings helps',
    ],
  },
  confidence: 'medium',
  gaps: ['Exact current enforcement posture at specific crossings is community-sourced only'],
  sourceTier: 2,
  sourceUrls: [
    'https://www.immigration.go.th/en/?page_id=1161',
    'https://reddit.com/r/ThailandTourism/comments/example3',
  ],
  verified: false,
  durationMs: 1050,
};

const FIXTURE_CONFLICT_REPORT: ConflictReport = {
  confirmed: [
    {
      topic: '60-day visa exemption for US passport holders',
      description:
        'Thailand extended the visa exemption to 60 days for US citizens effective November 11, 2024. Confirmed by Thai MFA official announcement.',
      sources: ['https://www.mfa.go.th/en/content/thailand-visa-exemption-60days'],
      resolution: undefined,
    },
    {
      topic: 'Onward ticket requirement',
      description:
        'Onward ticket is officially required for entry. Enforcement is increasing at Suvarnabhumi.',
      sources: ['https://www.immigration.go.th/en/?page_id=1161'],
      resolution: undefined,
    },
  ],
  contested: [
    {
      topic: 'Land border crossing limits',
      description:
        'Official Thai policy states 2 land border crossings per year on visa exemption. Community reports suggest enforcement is inconsistent.',
      sources: [
        'https://www.immigration.go.th/en/?page_id=1161',
        'https://reddit.com/r/ThailandTourism/comments/example3',
      ],
      resolution:
        'Tier 1 (Thai Immigration official site) states 2-crossing limit. Treat as binding regardless of community reports of leniency.',
    },
  ],
  unverified: [
    {
      topic: 'Remote work declaration at immigration',
      description:
        "Community advice to say 'tourism' rather than disclose remote work. No official policy on enforcement found.",
      sources: ['https://reddit.com/r/digitalnomad/comments/example2'],
      resolution:
        'Verify with a Thai immigration attorney before travel if remote work is a concern.',
    },
  ],
  overallConfidence: 'high',
};

function buildFixtureEnvelope(): AgentResultEnvelope {
  return {
    visaRequest: FIXTURE_VISA_REQUEST,
    officialPolicy: FIXTURE_OFFICIAL_POLICY,
    recentChanges: FIXTURE_RECENT_CHANGES,
    communityIntel: FIXTURE_COMMUNITY_INTEL,
    entryRequirements: FIXTURE_ENTRY_REQUIREMENTS,
    borderRun: FIXTURE_BORDER_RUN,
  };
}

async function main() {
  console.log('=== VisaScout Pipeline Test ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY_RUN (fixture data, zero API cost)' : 'LIVE (real API calls)'}`);
  console.log(`Input: ${JSON.stringify(TEST_INPUT, null, 2)}\n`);

  resetUsage();
  const start = Date.now();

  try {
    let envelope: AgentResultEnvelope;
    let conflictReport: ConflictReport;

    if (DRY_RUN) {
      console.log('[dry-run] Using fixture data — skipping all API calls\n');
      envelope = buildFixtureEnvelope();
      conflictReport = FIXTURE_CONFLICT_REPORT;
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in environment');

      const client = new Anthropic({ apiKey });

      console.log('[1/3] Running orchestrator...');
      envelope = await runOrchestrator(TEST_INPUT, client, 'standard', (req) => {
        console.log('\n[orchestrator] Parsed situation:');
        console.log(req.parsedSummary);
        console.log('');
      });

      console.log('\n[2/3] Agent results:');
      for (const [key, result] of Object.entries(envelope)) {
        if (key === 'visaRequest') continue;
        const r = result as AgentResult<unknown>;
        console.log(
          `  ${key}: ${r.status} | confidence=${r.confidence} | tier=${r.sourceTier} | ${r.durationMs}ms`
        );
      }

      console.log('\n[3/3] Running conflict resolver...');
      conflictReport = await resolveConflicts(envelope, client);

      console.log('[synthesis] Synthesizing final brief...');
      const brief = await synthesizeBrief(envelope, conflictReport, client, 'standard', start);

      console.log('\n=== VISA BRIEF ===\n');
      console.log(JSON.stringify(brief, null, 2));

      printCostSummary();
      return;
    }

    // DRY_RUN path
    const client = DRY_RUN ? null : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    if (DRY_RUN) {
      console.log('[dry-run] Envelope assembled. Agent statuses:');
      for (const [key, result] of Object.entries(envelope)) {
        if (key === 'visaRequest') continue;
        const r = result as AgentResult<unknown>;
        console.log(
          `  ${key}: ${r.status} | confidence=${r.confidence} | tier=${r.sourceTier} | ${r.durationMs}ms`
        );
      }

      console.log('\n[dry-run] Conflict report (fixture):');
      console.log(
        `  Confirmed: ${conflictReport.confirmed.length} | Contested: ${conflictReport.contested.length} | Unverified: ${conflictReport.unverified.length}`
      );
      console.log(`  Overall confidence: ${conflictReport.overallConfidence}`);

      console.log('\n[dry-run] Running synthesis against fixture data (real LLM call)...');
      const realClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('\n[dry-run] ANTHROPIC_API_KEY not set — printing fixture envelope only\n');
        console.log(JSON.stringify(envelope, null, 2));
        return;
      }

      const brief = await synthesizeBrief(envelope, conflictReport, realClient, 'standard', start);
      console.log('\n=== VISA BRIEF ===\n');
      console.log(JSON.stringify(brief, null, 2));
      printCostSummary();
    }
  } catch (err) {
    console.error('\n[ERROR] Pipeline failed:', err);
    process.exit(1);
  }
}

main();
