/**
 * Tests for Recent Changes retry logic in runOrchestrator.
 * Mocks all agent modules directly — agents never execute real code.
 * DRY_RUN=true: orchestrator skips LLM parse; retry logic still runs.
 */
import Anthropic from '@anthropic-ai/sdk';
import { runOrchestrator } from '@/src/orchestrator';
import type { VisaInput, AgentResult, RecentChangesOutput } from '@/src/types/index';

jest.mock('@/src/agents/recentChanges');
jest.mock('@/src/agents/officialPolicy');
jest.mock('@/src/agents/communityIntel');
jest.mock('@/src/agents/entryRequirements');
jest.mock('@/src/agents/borderRun');

import { recentChangesAgent } from '@/src/agents/recentChanges';
import { officialPolicyAgent } from '@/src/agents/officialPolicy';
import { communityIntelAgent } from '@/src/agents/communityIntel';
import { entryRequirementsAgent } from '@/src/agents/entryRequirements';
import { borderRunAgent } from '@/src/agents/borderRun';

// DRY_RUN=true: orchestrator skips LLM call; agents are mocked so their own DRY_RUN check never runs.
const originalDryRun = process.env.DRY_RUN;
beforeAll(() => { process.env.DRY_RUN = 'true'; });
afterAll(() => {
  if (originalDryRun === undefined) delete process.env.DRY_RUN;
  else process.env.DRY_RUN = originalDryRun;
});

const BASE_INPUT: VisaInput = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'tourist',
  freeform: 'Planning a 30-day stay.',
};

// Minimal stub client — never called in DRY_RUN mode
const STUB_CLIENT = {} as unknown as Anthropic;

const FAILED_RECENT_CHANGES: AgentResult<RecentChangesOutput> = {
  status: 'failed',
  data: null,
  confidence: 'low',
  gaps: ['RecentChanges agent failed'],
  sourceTier: 4,
  sourceUrls: [],
  verified: false,
  durationMs: 10,
  error: 'Network error',
};

const SUCCESS_RECENT_CHANGES: AgentResult<RecentChangesOutput> = {
  status: 'success',
  data: { changes: [], enforcementShifts: [], newRequirements: [], lastChecked: '2026-06-05' },
  confidence: 'medium',
  gaps: [],
  sourceTier: 2,
  sourceUrls: ['https://immigration.go.th'],
  verified: true,
  durationMs: 200,
};

const STUB_AGENT_RESULT = {
  status: 'success' as const,
  data: {},
  confidence: 'medium' as const,
  gaps: [],
  sourceTier: 2 as const,
  sourceUrls: [],
  verified: true,
  durationMs: 10,
};

function setupSupportingAgents() {
  (officialPolicyAgent as jest.Mock).mockResolvedValue(STUB_AGENT_RESULT);
  (communityIntelAgent as jest.Mock).mockResolvedValue(STUB_AGENT_RESULT);
  (entryRequirementsAgent as jest.Mock).mockResolvedValue(STUB_AGENT_RESULT);
  (borderRunAgent as jest.Mock).mockResolvedValue(STUB_AGENT_RESULT);
}

describe('runOrchestrator — Recent Changes retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSupportingAgents();
  });

  it('retries on Standard depth when initial call fails, uses retry result', async () => {
    (recentChangesAgent as jest.Mock)
      .mockResolvedValueOnce(FAILED_RECENT_CHANGES)
      .mockResolvedValueOnce(SUCCESS_RECENT_CHANGES);

    const envelope = await runOrchestrator(BASE_INPUT, STUB_CLIENT, 'standard');

    expect(recentChangesAgent).toHaveBeenCalledTimes(2);
    expect(envelope.recentChanges.status).toBe('success');
    expect(envelope.recentChanges.sourceTier).toBe(2);
  });

  it('retries on Deep depth when initial call fails, uses retry result', async () => {
    (recentChangesAgent as jest.Mock)
      .mockResolvedValueOnce(FAILED_RECENT_CHANGES)
      .mockResolvedValueOnce(SUCCESS_RECENT_CHANGES);

    const envelope = await runOrchestrator(BASE_INPUT, STUB_CLIENT, 'deep');

    expect(recentChangesAgent).toHaveBeenCalledTimes(2);
    expect(envelope.recentChanges.status).toBe('success');
  });

  it('does NOT retry on Quick depth — returns failed result immediately', async () => {
    (recentChangesAgent as jest.Mock).mockResolvedValue(FAILED_RECENT_CHANGES);

    const envelope = await runOrchestrator(BASE_INPUT, STUB_CLIENT, 'quick');

    expect(recentChangesAgent).toHaveBeenCalledTimes(1);
    expect(envelope.recentChanges.status).toBe('failed');
  });

  it('does not retry when initial call succeeds', async () => {
    (recentChangesAgent as jest.Mock).mockResolvedValue(SUCCESS_RECENT_CHANGES);

    const envelope = await runOrchestrator(BASE_INPUT, STUB_CLIENT, 'standard');

    expect(recentChangesAgent).toHaveBeenCalledTimes(1);
    expect(envelope.recentChanges.status).toBe('success');
  });

  it('returns failed result if retry also fails', async () => {
    (recentChangesAgent as jest.Mock).mockResolvedValue(FAILED_RECENT_CHANGES);

    const envelope = await runOrchestrator(BASE_INPUT, STUB_CLIENT, 'standard');

    expect(recentChangesAgent).toHaveBeenCalledTimes(2);
    expect(envelope.recentChanges.status).toBe('failed');
  });
});
