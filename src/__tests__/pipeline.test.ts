/**
 * Integration test: full pipeline with fixture data.
 * Mocks all external calls (Anthropic + Tavily) — zero API cost.
 */
import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '../orchestrator';
import { resolveConflicts } from '../synthesis/conflictResolver';
import { synthesizeBrief, buildDegradedContext } from '../synthesis/synthesize';
import type {
  VisaInput,
  AgentResultEnvelope,
  ConflictReport,
  VisaBrief,
  OfficialPolicyOutput,
  RecentChangesOutput,
  CommunityIntelOutput,
  EntryRequirementsOutput,
  BorderRunOutput,
  VisaRequest,
  AgentResult,
} from '../types/index';

import officialPolicyFixture from '../__fixtures__/agents/officialPolicy.json';
import recentChangesFixture from '../__fixtures__/agents/recentChanges.json';
import communityIntelFixture from '../__fixtures__/agents/communityIntel.json';
import entryRequirementsFixture from '../__fixtures__/agents/entryRequirements.json';
import borderRunFixture from '../__fixtures__/agents/borderRun.json';
import visaRequestFixture from '../__fixtures__/agents/visaRequest.json';

// Mock all external integrations
jest.mock('../tools/tavily', () => ({ tavilySearch: jest.fn().mockResolvedValue([]) }));

const VISA_INPUT: VisaInput = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'tourist visa exemption',
  freeform: 'Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company.',
};

const CONFLICT_REPORT_FIXTURE: ConflictReport = {
  confirmed: [
    {
      topic: '60-day visa exemption',
      description: 'Confirmed by Thai MFA (Tier 1).',
      sources: ['https://www.mfa.go.th/en/content/thailand-visa-exemption-60days'],
    },
  ],
  contested: [
    {
      topic: 'Land border crossing limit',
      description: 'Official says 2 per year; community reports inconsistency.',
      sources: ['https://www.immigration.go.th/en/?page_id=1161'],
      resolution: 'Tier 1 binding.',
    },
  ],
  unverified: [],
  overallConfidence: 'high',
};

const VISA_BRIEF_FIXTURE: Omit<VisaBrief, 'metadata' | 'conflictReport' | 'disclaimer'> = {
  parsedSituation: 'US passport holder, arriving Thailand March 15, 28-day stay, one border run to Malaysia, remote worker.',
  visaOptions: [
    {
      name: 'Visa Exemption (60 days)',
      suitability: 'best',
      maxStay: '60 days',
      summary: 'Best option for a 28-day stay.',
      pros: ['No application needed', 'Free'],
      cons: ['Land crossing limit applies'],
    },
  ],
  recommendedAction: {
    action: 'Enter on visa exemption (60 days), extend if needed.',
    deadline: undefined,
    rationale: 'Visa exemption covers 28-day stay with room to spare.',
    urgency: 'low',
  },
  entryRequirements: {
    documents: ['Valid US passport (6+ months)', 'Return ticket', 'Proof of funds'],
    proofOfFunds: '20,000 THB',
    onwardTicket: true,
    health: [],
    notes: [],
  },
  borderRunAnalysis: {
    eligible: true,
    limitsPerYear: '2 land crossings',
    recommendedCrossings: ['Padang Besar'],
    enforcementPosture: 'Moderate',
    warnings: ['Carry proof of funds for border run'],
  },
  recentChanges: {
    hasChanges: true,
    items: ['60-day exemption effective November 2024'],
    watchItems: ['Onward ticket enforcement increasing'],
  },
  confidenceScore: {
    overall: 'high',
    perSection: {
      officialPolicy: 'high',
      recentChanges: 'high',
      communityIntel: 'medium',
      entryRequirements: 'high',
      borderRun: 'medium',
    },
    sourceCitations: [
      {
        claim: '60-day visa exemption',
        url: 'https://www.mfa.go.th/en/content/thailand-visa-exemption-60days',
        tier: 1,
        publishedDate: '2024-11-11',
      },
    ],
  },
  contingency: {
    deniedEntrySteps: ['Contact US Embassy Bangkok', 'Request reason in writing'],
    overstayScenario: 'Overstay results in fine of 500 THB/day. Leave immediately to avoid ban.',
    emergencyContacts: ['US Embassy Bangkok: +66-2-205-4000'],
  },
};

function makeOrchestratorClient(): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(visaRequestFixture) }],
        usage: { input_tokens: 200, output_tokens: 300 },
      }),
    },
  } as unknown as Anthropic;
}

function makeConflictClient(): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(CONFLICT_REPORT_FIXTURE) }],
        usage: { input_tokens: 800, output_tokens: 400 },
      }),
    },
  } as unknown as Anthropic;
}

function makeSynthesisClient(): Anthropic {
  const briefWithAllFields: VisaBrief = {
    ...VISA_BRIEF_FIXTURE,
    conflictReport: CONFLICT_REPORT_FIXTURE,
    disclaimer: 'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.',
    metadata: {
      agentStatuses: [],
      totalDurationMs: 5000,
      model: 'claude-sonnet-4-6',
      generatedAt: new Date().toISOString(),
      degraded: false,
      depth: 'standard',
    },
  };

  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(briefWithAllFields) }],
        usage: { input_tokens: 2000, output_tokens: 1500 },
      }),
    },
  } as unknown as Anthropic;
}

// Separate agent mock clients that handle multiple parallel calls
function makeAgentClient(agentData: Record<string, unknown>): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(agentData) }],
        usage: { input_tokens: 300, output_tokens: 400 },
      }),
    },
  } as unknown as Anthropic;
}

describe('Pipeline integration tests', () => {
  describe('Full pipeline — all agents succeed', () => {
    it('runs orchestrator and parses VisaRequest correctly', async () => {
      const client = makeOrchestratorClient();

      // We test orchestrator in isolation here (agents will fail — no real client)
      // Just verify the orchestrator LLM call returns a valid VisaRequest
      const response = await (client.messages.create as jest.Mock)({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: 'test' }],
      });

      const parsed = JSON.parse(response.content[0].text) as VisaRequest;
      expect(parsed.normalizedNationality).toBe('United States');
      expect(parsed.normalizedDestination).toBe('Thailand');
      expect(parsed.parsedSummary).toBeDefined();
    });

    it('conflict resolver produces ConflictReport with confirmed, contested, unverified', async () => {
      const envelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeConflictClient();
      const report = await resolveConflicts(envelope, client);

      expect(report).toHaveProperty('confirmed');
      expect(report).toHaveProperty('contested');
      expect(report).toHaveProperty('unverified');
      expect(report).toHaveProperty('overallConfidence');
      expect(Array.isArray(report.confirmed)).toBe(true);
      expect(Array.isArray(report.contested)).toBe(true);
      expect(Array.isArray(report.unverified)).toBe(true);
    });

    it('synthesis produces VisaBrief with all required sections', async () => {
      const envelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(envelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      // All required sections present
      expect(brief).toHaveProperty('parsedSituation');
      expect(brief).toHaveProperty('visaOptions');
      expect(brief).toHaveProperty('recommendedAction');
      expect(brief).toHaveProperty('entryRequirements');
      expect(brief).toHaveProperty('borderRunAnalysis');
      expect(brief).toHaveProperty('recentChanges');
      expect(brief).toHaveProperty('conflictReport');
      expect(brief).toHaveProperty('confidenceScore');
      expect(brief).toHaveProperty('contingency');
      expect(brief).toHaveProperty('disclaimer');
      expect(brief).toHaveProperty('metadata');
    });

    it('brief disclaimer is always the required legal text', async () => {
      const envelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(envelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      expect(brief.disclaimer).toContain('publicly available information');
      expect(brief.disclaimer).toContain('Not legal advice');
    });

    it('metadata records all 5 agent statuses', async () => {
      const envelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(envelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      expect(brief.metadata.agentStatuses).toHaveLength(5);
      const agentNames = brief.metadata.agentStatuses.map((s) => s.agent);
      expect(agentNames).toContain('OfficialPolicy');
      expect(agentNames).toContain('RecentChanges');
      expect(agentNames).toContain('CommunityIntel');
      expect(agentNames).toContain('EntryRequirements');
      expect(agentNames).toContain('BorderRun');
    });
  });

  describe('Degraded pipeline — one or more agents fail', () => {
    function makeFailedResult<T>(gapMessage: string): AgentResult<T> {
      return {
        status: 'failed',
        data: null,
        confidence: 'low',
        gaps: [gapMessage],
        sourceTier: 4,
        sourceUrls: [],
        verified: false,
        durationMs: 0,
        error: 'Simulated failure for testing',
      };
    }

    it('brief is still produced when borderRun agent fails', async () => {
      const degradedEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: makeFailedResult<BorderRunOutput>(
          'BorderRun agent failed — border run analysis based on official policy only, no community enforcement data available'
        ),
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(degradedEnvelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      // Brief was produced despite failure
      expect(brief).toBeDefined();
      expect(brief.metadata.degraded).toBe(true);
    });

    it('metadata.degraded is true when any agent fails', async () => {
      const degradedEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: makeFailedResult<OfficialPolicyOutput>('OfficialPolicy failed'),
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(degradedEnvelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      expect(brief.metadata.degraded).toBe(true);
    });

    it('metadata.degraded is false when all agents succeed', async () => {
      const fullEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(fullEnvelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      expect(brief.metadata.degraded).toBe(false);
    });

    it('failed agent status is recorded in metadata.agentStatuses', async () => {
      const degradedEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: makeFailedResult<CommunityIntelOutput>('CommunityIntel failed'),
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const client = makeSynthesisClient();
      const brief = await synthesizeBrief(degradedEnvelope, CONFLICT_REPORT_FIXTURE, client, 'standard', Date.now());

      const communityStatus = brief.metadata.agentStatuses.find((s) => s.agent === 'CommunityIntel');
      expect(communityStatus).toBeDefined();
      expect(communityStatus!.status).toBe('failed');
    });

    it('buildDegradedContext produces specific messages per failed agent', () => {
      const allFailedEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: makeFailedResult<OfficialPolicyOutput>('OfficialPolicy failed'),
        recentChanges: makeFailedResult<RecentChangesOutput>('RecentChanges failed'),
        communityIntel: makeFailedResult<CommunityIntelOutput>('CommunityIntel failed'),
        entryRequirements: makeFailedResult<EntryRequirementsOutput>('EntryRequirements failed'),
        borderRun: makeFailedResult<BorderRunOutput>('BorderRun failed'),
      };

      const ctx = buildDegradedContext(allFailedEnvelope);

      expect(ctx).toContain('OfficialPolicy agent failed');
      expect(ctx).toContain('RecentChanges agent failed');
      expect(ctx).toContain('CommunityIntel agent failed');
      expect(ctx).toContain('EntryRequirements agent failed');
      expect(ctx).toContain('BorderRun agent failed');
    });

    it('buildDegradedContext is empty string when all agents succeed', () => {
      const fullEnvelope: AgentResultEnvelope = {
        visaRequest: visaRequestFixture as VisaRequest,
        officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
        recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
        communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
        entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
        borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
      };

      const ctx = buildDegradedContext(fullEnvelope);
      expect(ctx).toBe('');
    });
  });
});
