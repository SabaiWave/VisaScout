import Anthropic from '@anthropic-ai/sdk';
import { officialPolicyAgent } from '../../agents/officialPolicy';
import type { VisaRequest, OfficialPolicyOutput } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import officialPolicyFixture from '../../__fixtures__/agents/officialPolicy.json';

jest.mock('../../tools/tavily', () => ({
  tavilySearch: jest.fn(),
}));

import { tavilySearch } from '../../tools/tavily';
import thailandOfficialFixture from '../../__fixtures__/tavily/thailand-official.json';

const mockTavilySearch = tavilySearch as jest.MockedFunction<typeof tavilySearch>;

const VISA_REQUEST = visaRequestFixture as VisaRequest;

function makeClient(responseData: Partial<OfficialPolicyOutput> & Record<string, unknown>): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
        usage: { input_tokens: 300, output_tokens: 400 },
      }),
    },
  } as unknown as Anthropic;
}

describe('officialPolicyAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns AgentResult with status success on valid fixture input', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...officialPolicyFixture.data,
      confidence: 'high',
      gaps: [],
      sourceTier: 1,
      sourceUrls: ['https://www.immigration.go.th/en/?page_id=1161'],
      verified: true,
    };

    const client = makeClient(llmResponse);
    const result = await officialPolicyAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('success');
    expect(result.data).not.toBeNull();
    expect(result.confidence).toBe('high');
    expect(result.sourceTier).toBe(1);
    expect(result.verified).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('output includes confidence + gaps + sourceTier + sourceUrls fields', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...officialPolicyFixture.data,
      confidence: 'medium',
      gaps: ['Extension fees could not be verified from Tier 1 source'],
      sourceTier: 2,
      sourceUrls: ['https://www.iata.org/en/programs'],
      verified: false,
    };

    const client = makeClient(llmResponse);
    const result = await officialPolicyAgent(VISA_REQUEST, client, 'standard');

    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('sourceTier');
    expect(result).toHaveProperty('sourceUrls');
    expect(result).toHaveProperty('verified');
    expect(Array.isArray(result.gaps)).toBe(true);
    expect(Array.isArray(result.sourceUrls)).toBe(true);
  });

  it('returns status failed when Tavily throws — never throws itself', async () => {
    mockTavilySearch.mockRejectedValue(new Error('Tavily API error'));

    const client = makeClient({});
    const result = await officialPolicyAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
    expect(result.confidence).toBe('low');
    expect(result.error).toBeDefined();
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it('returns status failed when LLM returns invalid JSON — never throws', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const client = {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'not valid json' }],
          usage: { input_tokens: 100, output_tokens: 20 },
        }),
      },
    } as unknown as Anthropic;

    const result = await officialPolicyAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
  });

  it('uses correct max_results for each depth level', async () => {
    mockTavilySearch.mockResolvedValue([]);
    const client = makeClient({ ...officialPolicyFixture.data, confidence: 'low', gaps: [], sourceTier: 4, sourceUrls: [], verified: false });

    await officialPolicyAgent(VISA_REQUEST, client, 'quick');
    expect(mockTavilySearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxResults: 3 })
    );

    jest.clearAllMocks();
    mockTavilySearch.mockResolvedValue([]);
    await officialPolicyAgent(VISA_REQUEST, client, 'deep');
    expect(mockTavilySearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxResults: 8 })
    );
  });
});
