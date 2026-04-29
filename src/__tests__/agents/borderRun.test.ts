import Anthropic from '@anthropic-ai/sdk';
import { borderRunAgent } from '../../agents/borderRun';
import type { VisaRequest } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import borderRunFixture from '../../__fixtures__/agents/borderRun.json';

jest.mock('../../tools/tavily', () => ({
  tavilySearch: jest.fn(),
}));

import { tavilySearch } from '../../tools/tavily';
import thailandOfficialFixture from '../../__fixtures__/tavily/thailand-official.json';
import communityFixture from '../../__fixtures__/tavily/thailand-community.json';

const mockTavilySearch = tavilySearch as jest.MockedFunction<typeof tavilySearch>;
const VISA_REQUEST = visaRequestFixture as VisaRequest;

function makeClient(responseData: Record<string, unknown>): Anthropic {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
        usage: { input_tokens: 250, output_tokens: 350 },
      }),
    },
  } as unknown as Anthropic;
}

describe('borderRunAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns AgentResult with status success on valid fixture input', async () => {
    mockTavilySearch
      .mockResolvedValueOnce(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never)
      .mockResolvedValueOnce(communityFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...borderRunFixture.data,
      confidence: 'medium',
      gaps: borderRunFixture.gaps,
      sourceTier: 2,
      sourceUrls: borderRunFixture.sourceUrls,
      verified: false,
    };

    const client = makeClient(llmResponse);
    const result = await borderRunAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('success');
    expect(result.data).not.toBeNull();
    expect(result.data!.crossingOptions).toBeInstanceOf(Array);
    expect(result.data!.warnings).toBeInstanceOf(Array);
  });

  it('makes two Tavily searches (official + community)', async () => {
    mockTavilySearch.mockResolvedValue([]);
    const client = makeClient({ crossingOptions: [], enforcementPosture: '', recommendedCrossings: [], warnings: [], confidence: 'low', gaps: [], sourceTier: 4, sourceUrls: [], verified: false });

    await borderRunAgent(VISA_REQUEST, client, 'standard');

    expect(mockTavilySearch).toHaveBeenCalledTimes(2);
  });

  it('output includes all required AgentResult fields', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...borderRunFixture.data,
      confidence: 'medium',
      gaps: [],
      sourceTier: 2,
      sourceUrls: [],
      verified: false,
    };

    const client = makeClient(llmResponse);
    const result = await borderRunAgent(VISA_REQUEST, client, 'standard');

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('sourceTier');
    expect(result).toHaveProperty('sourceUrls');
    expect(result).toHaveProperty('verified');
    expect(result).toHaveProperty('durationMs');
  });

  it('returns status failed when Tavily throws — never throws itself', async () => {
    mockTavilySearch.mockRejectedValue(new Error('Tavily error'));

    const client = makeClient({});
    const result = await borderRunAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('gap message for failure is specific about border run unavailability', async () => {
    mockTavilySearch.mockRejectedValue(new Error('error'));

    const client = makeClient({});
    const result = await borderRunAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.gaps[0]).toContain('BorderRun agent failed');
    expect(result.gaps[0]).toContain('official policy only');
  });
});
