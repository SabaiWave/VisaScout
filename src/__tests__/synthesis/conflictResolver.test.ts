import Anthropic from '@anthropic-ai/sdk';
import { resolveConflicts } from '../../synthesis/conflictResolver';
import type {
  AgentResultEnvelope,
  AgentResult,
  OfficialPolicyOutput,
  RecentChangesOutput,
  CommunityIntelOutput,
  EntryRequirementsOutput,
  BorderRunOutput,
  VisaRequest,
  ConflictReport,
} from '../../types/index';

import officialPolicyFixture from '../../__fixtures__/agents/officialPolicy.json';
import recentChangesFixture from '../../__fixtures__/agents/recentChanges.json';
import communityIntelFixture from '../../__fixtures__/agents/communityIntel.json';
import entryRequirementsFixture from '../../__fixtures__/agents/entryRequirements.json';
import borderRunFixture from '../../__fixtures__/agents/borderRun.json';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';

function makeClient(responseJson: ConflictReport): Anthropic {
  const mockCreate = jest.fn().mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(responseJson) }],
    usage: { input_tokens: 100, output_tokens: 200 },
  });
  return { messages: { create: mockCreate } } as unknown as Anthropic;
}

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
    error: 'agent error',
  };
}

const BASE_ENVELOPE: AgentResultEnvelope = {
  visaRequest: visaRequestFixture as VisaRequest,
  officialPolicy: officialPolicyFixture as AgentResult<OfficialPolicyOutput>,
  recentChanges: recentChangesFixture as AgentResult<RecentChangesOutput>,
  communityIntel: communityIntelFixture as AgentResult<CommunityIntelOutput>,
  entryRequirements: entryRequirementsFixture as AgentResult<EntryRequirementsOutput>,
  borderRun: borderRunFixture as AgentResult<BorderRunOutput>,
};

describe('resolveConflicts', () => {
  it('returns confirmed item when Tier 1 source beats Tier 4 on same claim', async () => {
    const mockReport: ConflictReport = {
      confirmed: [
        {
          topic: '60-day visa exemption',
          description: 'Confirmed by Thai MFA official announcement (Tier 1).',
          sources: ['https://www.mfa.go.th/en/content/thailand-visa-exemption-60days'],
        },
      ],
      contested: [],
      unverified: [],
      overallConfidence: 'high',
    };

    const client = makeClient(mockReport);
    const result = await resolveConflicts(BASE_ENVELOPE, client);

    expect(result.confirmed).toHaveLength(1);
    expect(result.confirmed[0].topic).toBe('60-day visa exemption');
    expect(result.contested).toHaveLength(0);
    expect(result.overallConfidence).toBe('high');
  });

  it('flags Tier 4 contradicting Tier 1 as contested', async () => {
    const mockReport: ConflictReport = {
      confirmed: [],
      contested: [
        {
          topic: 'Land border crossing limit',
          description:
            'Official policy (Tier 1) states 2 land crossings per year. Community reports leniency.',
          sources: [
            'https://www.immigration.go.th/en/?page_id=1161',
            'https://www.reddit.com/r/ThailandTourism/comments/xyz',
          ],
          resolution: 'Tier 1 wins — treat 2-crossing limit as binding.',
        },
      ],
      unverified: [],
      overallConfidence: 'medium',
    };

    const client = makeClient(mockReport);
    const result = await resolveConflicts(BASE_ENVELOPE, client);

    expect(result.contested).toHaveLength(1);
    expect(result.contested[0].resolution).toContain('Tier 1');
    expect(result.confirmed).toHaveLength(0);
  });

  it('marks claims as unverified when no Tier 1-2 source found', async () => {
    const mockReport: ConflictReport = {
      confirmed: [],
      contested: [],
      unverified: [
        {
          topic: 'Remote work declaration',
          description:
            'Community advice only — no official guidance found. No Tier 1-2 source.',
          sources: ['https://www.reddit.com/r/digitalnomad/comments/abc'],
          resolution: 'Verify with Thai immigration attorney.',
        },
      ],
      overallConfidence: 'low',
    };

    const client = makeClient(mockReport);
    const result = await resolveConflicts(BASE_ENVELOPE, client);

    expect(result.unverified).toHaveLength(1);
    expect(result.overallConfidence).toBe('low');
  });

  it('returns degraded ConflictReport when all agents failed', async () => {
    const allFailedEnvelope: AgentResultEnvelope = {
      visaRequest: visaRequestFixture as VisaRequest,
      officialPolicy: makeFailedResult<OfficialPolicyOutput>('OfficialPolicy failed'),
      recentChanges: makeFailedResult<RecentChangesOutput>('RecentChanges failed'),
      communityIntel: makeFailedResult<CommunityIntelOutput>('CommunityIntel failed'),
      entryRequirements: makeFailedResult<EntryRequirementsOutput>('EntryRequirements failed'),
      borderRun: makeFailedResult<BorderRunOutput>('BorderRun failed'),
    };

    const mockReport: ConflictReport = {
      confirmed: [],
      contested: [],
      unverified: [
        {
          topic: 'All claims',
          description: 'All agents failed — no data to reconcile.',
          sources: [],
          resolution: 'Verify with official government immigration sources.',
        },
      ],
      overallConfidence: 'low',
    };

    const client = makeClient(mockReport);
    const result = await resolveConflicts(allFailedEnvelope, client);

    expect(result.confirmed).toHaveLength(0);
    expect(result.contested).toHaveLength(0);
    expect(result.overallConfidence).toBe('low');
  });

  it('returns fallback ConflictReport when LLM returns invalid JSON', async () => {
    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'this is not valid json at all' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });
    const client = { messages: { create: mockCreate } } as unknown as Anthropic;

    const result = await resolveConflicts(BASE_ENVELOPE, client);

    expect(result.confirmed).toHaveLength(0);
    expect(result.overallConfidence).toBe('low');
    expect(result.unverified).toHaveLength(1);
    expect(result.unverified[0].topic).toBe('All claims');
  });

  it('passes the full envelope data to the LLM call', async () => {
    const mockReport: ConflictReport = {
      confirmed: [],
      contested: [],
      unverified: [],
      overallConfidence: 'high',
    };

    const mockCreate = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(mockReport) }],
      usage: { input_tokens: 500, output_tokens: 100 },
    });
    const client = { messages: { create: mockCreate } } as unknown as Anthropic;

    await resolveConflicts(BASE_ENVELOPE, client);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-sonnet-4-6');
    expect(callArgs.messages[0].role).toBe('user');
    // Prompt should reference the source tiers
    expect(callArgs.messages[0].content).toContain('Tier');
  });
});
