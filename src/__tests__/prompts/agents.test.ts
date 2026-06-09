import { buildOfficialPolicyPrompt } from '@/src/prompts/officialPolicy';
import { buildCommunityIntelPrompt } from '@/src/prompts/communityIntel';
import { buildBorderRunPrompt } from '@/src/prompts/borderRun';
import { buildRecentChangesPrompt } from '@/src/prompts/recentChanges';
import { buildEntryRequirementsPrompt } from '@/src/prompts/entryRequirements';
import { buildSynthesisPrompt } from '@/src/prompts/synthesis';
import { buildConflictResolverPrompt } from '@/src/prompts/conflictResolver';
import type { VisaRequest, AgentResultEnvelope, ConflictReport } from '@/src/types/index';
import visaRequestFixture from '@/src/__fixtures__/agents/visaRequest.json';

const REQUEST = visaRequestFixture as VisaRequest;
const SEARCH_RESULTS = '<mock>search result data</mock>';

const FAILED_AGENT_RESULT = {
  status: 'failed' as const,
  data: null,
  confidence: 'low' as const,
  gaps: ['Agent failed'],
  sourceTier: 4 as const,
  sourceUrls: [],
  verified: false,
  durationMs: 0,
  error: 'Mocked failure',
};

const MOCK_ENVELOPE: AgentResultEnvelope = {
  visaRequest: REQUEST,
  officialPolicy: FAILED_AGENT_RESULT,
  recentChanges: FAILED_AGENT_RESULT,
  communityIntel: FAILED_AGENT_RESULT,
  entryRequirements: FAILED_AGENT_RESULT,
  borderRun: FAILED_AGENT_RESULT,
};

const MOCK_CONFLICT_REPORT: ConflictReport = {
  confirmed: [],
  contested: [],
  unverified: [],
  overallConfidence: 'low',
};

// ─── H-02: traveler_context wrapping in all 5 agent prompts ───────────────────

describe('agent prompt traveler_context wrapping (H-02)', () => {
  const cases: Array<[string, (r: VisaRequest, s: string) => { system: string; user: string }]> = [
    ['buildOfficialPolicyPrompt', buildOfficialPolicyPrompt],
    ['buildCommunityIntelPrompt', buildCommunityIntelPrompt],
    ['buildBorderRunPrompt', buildBorderRunPrompt],
    ['buildRecentChangesPrompt', buildRecentChangesPrompt],
    ['buildEntryRequirementsPrompt', buildEntryRequirementsPrompt],
  ];

  for (const [name, builder] of cases) {
    describe(name, () => {
      it('user block wraps traveler context in <traveler_context> tags', () => {
        const { user } = builder(REQUEST, SEARCH_RESULTS);
        expect(user).toContain('<traveler_context>');
        expect(user).toContain('</traveler_context>');
      });

      it('freeform appears inside <traveler_context>, before <search_results>', () => {
        const { user } = builder(REQUEST, SEARCH_RESULTS);
        const contextClose = user.indexOf('</traveler_context>');
        const searchOpen = user.indexOf('<search_results>');
        expect(contextClose).toBeGreaterThan(-1);
        expect(searchOpen).toBeGreaterThan(-1);
        expect(contextClose).toBeLessThan(searchOpen);
        // freeform is inside the traveler_context block
        const contextOpen = user.indexOf('<traveler_context>');
        const inside = user.slice(contextOpen, contextClose);
        expect(inside).toContain(REQUEST.freeform.slice(0, 50));
      });

      it('system block SECURITY instruction covers both <traveler_context> and <search_results>', () => {
        const { system } = builder(REQUEST, SEARCH_RESULTS);
        expect(system).toContain('SECURITY');
        expect(system).toContain('<traveler_context>');
        expect(system).toContain('<search_results>');
      });
    });
  }
});

// ─── H-03: SECURITY framing in synthesis and conflictResolver ─────────────────

describe('buildSynthesisPrompt SECURITY framing (H-03)', () => {
  it('system block contains SECURITY instruction about external data', () => {
    const { system } = buildSynthesisPrompt(MOCK_ENVELOPE, MOCK_CONFLICT_REPORT, '');
    expect(system).toContain('SECURITY');
    expect(system).toContain('external data');
  });

  it('system block warns against following instructions in user block', () => {
    const { system } = buildSynthesisPrompt(MOCK_ENVELOPE, MOCK_CONFLICT_REPORT, '');
    expect(system.toLowerCase()).toContain('never');
    expect(system.toLowerCase()).toContain('instructions');
  });
});

describe('buildConflictResolverPrompt SECURITY framing (H-03)', () => {
  it('system block contains SECURITY instruction about external data', () => {
    const { system } = buildConflictResolverPrompt(MOCK_ENVELOPE);
    expect(system).toContain('SECURITY');
    expect(system).toContain('external data');
  });

  it('system block warns against following instructions in user block', () => {
    const { system } = buildConflictResolverPrompt(MOCK_ENVELOPE);
    expect(system.toLowerCase()).toContain('never');
    expect(system.toLowerCase()).toContain('instructions');
  });
});
