import { computeOverallConfidence } from '../../synthesis/conflictResolver';
import type {
  AgentResultEnvelope,
  AgentResult,
  OfficialPolicyOutput,
  RecentChangesOutput,
  CommunityIntelOutput,
  EntryRequirementsOutput,
  BorderRunOutput,
  ConflictReport,
  VisaRequest,
} from '../../types/index';

import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAgent<T>(
  sourceTier: 1 | 2 | 3 | 4,
  status: 'success' | 'failed' = 'success'
): AgentResult<T> {
  return {
    status,
    data: status === 'success' ? ({} as T) : null,
    confidence: 'medium',
    gaps: [],
    sourceTier,
    sourceUrls: [],
    verified: status === 'success',
    durationMs: 100,
    error: status === 'failed' ? 'agent error' : undefined,
  };
}

function makeEnvelope(overrides: {
  officialPolicy?: AgentResult<OfficialPolicyOutput>;
  recentChanges?: AgentResult<RecentChangesOutput>;
  communityIntel?: AgentResult<CommunityIntelOutput>;
  entryRequirements?: AgentResult<EntryRequirementsOutput>;
  borderRun?: AgentResult<BorderRunOutput>;
}): AgentResultEnvelope {
  return {
    visaRequest: visaRequestFixture as VisaRequest,
    officialPolicy: overrides.officialPolicy ?? makeAgent<OfficialPolicyOutput>(1),
    recentChanges: overrides.recentChanges ?? makeAgent<RecentChangesOutput>(1),
    communityIntel: overrides.communityIntel ?? makeAgent<CommunityIntelOutput>(4),
    entryRequirements: overrides.entryRequirements ?? makeAgent<EntryRequirementsOutput>(1),
    borderRun: overrides.borderRun ?? makeAgent<BorderRunOutput>(2),
  };
}

function makeReport(
  contested: number = 0,
  unverified: number = 0
): ConflictReport {
  const makeItem = (i: number) => ({
    topic: `topic-${i}`,
    description: `desc-${i}`,
    sources: [],
  });
  return {
    confirmed: [],
    contested: Array.from({ length: contested }, (_, i) => makeItem(i)),
    unverified: Array.from({ length: unverified }, (_, i) => makeItem(i)),
    overallConfidence: 'medium', // LLM value — will be overridden
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeOverallConfidence', () => {
  // --- HIGH scenarios ---

  it('HIGH: 2+ tier1 agents succeeded (even with contested claims)', () => {
    // officialPolicy=tier1, recentChanges=tier1 → 2 tier1 agents
    const envelope = makeEnvelope({
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    const report = makeReport(2); // 2 contested — shouldn't matter for this path
    expect(computeOverallConfidence(report, envelope)).toBe('high');
  });

  it('HIGH: 3 tier1 agents — well above threshold', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(1),
      recentChanges: makeAgent<RecentChangesOutput>(1),
      entryRequirements: makeAgent<EntryRequirementsOutput>(1),
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    expect(computeOverallConfidence(makeReport(0), envelope)).toBe('high');
  });

  it('HIGH: 4+/5 agents succeeded with zero contested claims', () => {
    // 0 tier1 agents, but 4 succeeded with no conflicts
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2),
      communityIntel: makeAgent<CommunityIntelOutput>(3),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    const report = makeReport(0, 0);
    expect(computeOverallConfidence(report, envelope)).toBe('high');
  });

  it('HIGH: all 5 agents succeeded, zero contested, no tier1 needed', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2),
      communityIntel: makeAgent<CommunityIntelOutput>(3),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    expect(computeOverallConfidence(makeReport(0), envelope)).toBe('high');
  });

  it('NOT HIGH: 4 succeeded but 1 contested claim — falls to MEDIUM', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2),
      communityIntel: makeAgent<CommunityIntelOutput>(3),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    const report = makeReport(1); // 1 contested kills HIGH via 4+/0-contested path
    // 0 tier1, 4 succeeded but 1 contested → not HIGH; 4 >= 3 && 1 <= 1 → MEDIUM
    expect(computeOverallConfidence(report, envelope)).toBe('medium');
  });

  // --- MEDIUM scenarios ---

  it('MEDIUM: exactly 1 tier1 agent succeeded', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(1),
      recentChanges: makeAgent<RecentChangesOutput>(2),
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    const report = makeReport(3, 2); // significant conflicts — tier1 still lifts to MEDIUM
    expect(computeOverallConfidence(report, envelope)).toBe('medium');
  });

  it('MEDIUM: majority agents (3/5) succeeded with minor conflicts (1 contested)', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(3),
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    const report = makeReport(1, 2); // 1 contested = minor
    expect(computeOverallConfidence(report, envelope)).toBe('medium');
  });

  it('MEDIUM: 3 agents succeeded, zero contested', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(3),
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      entryRequirements: makeAgent<EntryRequirementsOutput>(3, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    expect(computeOverallConfidence(makeReport(0), envelope)).toBe('medium');
  });

  // --- LOW scenarios ---

  it('LOW: no tier1 agents, only 2 agents succeeded', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(3),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(3, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    const report = makeReport(0, 3);
    expect(computeOverallConfidence(report, envelope)).toBe('low');
  });

  it('LOW: no tier1 agents, 3 succeeded but 2+ contested (significant conflicts)', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(3),
      communityIntel: makeAgent<CommunityIntelOutput>(4),
      entryRequirements: makeAgent<EntryRequirementsOutput>(3, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    const report = makeReport(2, 4); // 2 contested > 1 threshold → not MEDIUM
    expect(computeOverallConfidence(report, envelope)).toBe('low');
  });

  it('LOW: all agents failed', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(1, 'failed'),
      recentChanges: makeAgent<RecentChangesOutput>(1, 'failed'),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(1, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    const report = makeReport(0, 1);
    expect(computeOverallConfidence(report, envelope)).toBe('low');
  });

  it('LOW: Laos-like scenario — no tier1, 1 agent succeeded, many unverified', () => {
    // Mirrors Brief 2 described in confidence-ux-brief.md
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(3, 'failed'),
      recentChanges: makeAgent<RecentChangesOutput>(4, 'failed'),
      communityIntel: makeAgent<CommunityIntelOutput>(4),    // only community data available
      entryRequirements: makeAgent<EntryRequirementsOutput>(3, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(4, 'failed'),
    });
    const report = makeReport(0, 5);
    expect(computeOverallConfidence(report, envelope)).toBe('low');
  });

  // --- Boundary / edge cases ---

  it('HIGH boundary: exactly 4 succeeded, exactly 0 contested', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    expect(computeOverallConfidence(makeReport(0), envelope)).toBe('high');
  });

  it('MEDIUM boundary: exactly 3 succeeded, exactly 1 contested', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2, 'failed'),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    expect(computeOverallConfidence(makeReport(1), envelope)).toBe('medium');
  });

  it('LOW boundary: exactly 3 succeeded, exactly 2 contested', () => {
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(2),
      recentChanges: makeAgent<RecentChangesOutput>(2, 'failed'),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(2),
      borderRun: makeAgent<BorderRunOutput>(2),
    });
    expect(computeOverallConfidence(makeReport(2), envelope)).toBe('low');
  });

  it('MEDIUM: 1 tier1 agent overrides low agent agreement', () => {
    // Only 1 agent succeeded but it is tier1 — still MEDIUM
    const envelope = makeEnvelope({
      officialPolicy: makeAgent<OfficialPolicyOutput>(1),
      recentChanges: makeAgent<RecentChangesOutput>(2, 'failed'),
      communityIntel: makeAgent<CommunityIntelOutput>(4, 'failed'),
      entryRequirements: makeAgent<EntryRequirementsOutput>(3, 'failed'),
      borderRun: makeAgent<BorderRunOutput>(2, 'failed'),
    });
    expect(computeOverallConfidence(makeReport(0, 3), envelope)).toBe('medium');
  });
});
