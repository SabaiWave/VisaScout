import Anthropic from '@anthropic-ai/sdk';
import { recentChangesAgent } from '../../agents/recentChanges';
import type { VisaRequest } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import recentChangesFixture from '../../__fixtures__/agents/recentChanges.json';

jest.mock('../../tools/tavily', () => ({
  tavilySearch: jest.fn(),
}));

import { tavilySearch } from '../../tools/tavily';
import thailandOfficialFixture from '../../__fixtures__/tavily/thailand-official.json';

const mockTavilySearch = tavilySearch as jest.MockedFunction<typeof tavilySearch>;
const VISA_REQUEST = visaRequestFixture as VisaRequest;

function makeClient(responseData: Record<string, unknown>): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
        usage: { input_tokens: 200, output_tokens: 300 },
      }),
    },
  } as unknown as Anthropic;
}

describe('recentChangesAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns AgentResult with status success on valid fixture input', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...recentChangesFixture.data,
      confidence: 'high',
      gaps: [],
      sourceTier: 1,
      sourceUrls: ['https://www.mfa.go.th/en/content/thailand-visa-exemption-60days'],
      verified: true,
    };

    const client = makeClient(llmResponse);
    const result = await recentChangesAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('success');
    expect(result.data).not.toBeNull();
    expect(result.data!.changes).toBeInstanceOf(Array);
    expect(result.confidence).toBeDefined();
    expect(result.sourceTier).toBeDefined();
  });

  it('output includes all required AgentResult fields', async () => {
    mockTavilySearch.mockResolvedValue([]);
    const llmResponse = {
      changes: [],
      enforcementShifts: [],
      newRequirements: [],
      lastChecked: '2026-04-29',
      confidence: 'low',
      gaps: ['No recent changes found in Tier 1-2 sources'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
    };

    const client = makeClient(llmResponse);
    const result = await recentChangesAgent(VISA_REQUEST, client, 'quick');

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('sourceTier');
    expect(result).toHaveProperty('sourceUrls');
    expect(result).toHaveProperty('verified');
    expect(result).toHaveProperty('durationMs');
  });

  it('returns status failed on Tavily error — never throws', async () => {
    mockTavilySearch.mockRejectedValue(new Error('Network timeout'));

    const client = makeClient({});
    const result = await recentChangesAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
    expect(result.error).toContain('Network timeout');
  });

  it('passes days: 90 filter to Tavily search', async () => {
    mockTavilySearch.mockResolvedValue([]);
    const client = makeClient({ changes: [], enforcementShifts: [], newRequirements: [], lastChecked: '', confidence: 'low', gaps: [], sourceTier: 4, sourceUrls: [], verified: false });

    await recentChangesAgent(VISA_REQUEST, client, 'standard');

    expect(mockTavilySearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ days: 90 })
    );
  });
});
