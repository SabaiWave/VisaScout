import Anthropic from '@anthropic-ai/sdk';
import { communityIntelAgent } from '../../agents/communityIntel';
import type { VisaRequest } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import communityIntelFixture from '../../__fixtures__/agents/communityIntel.json';

jest.mock('../../tools/tavily', () => ({
  tavilySearch: jest.fn(),
}));

import { tavilySearch } from '../../tools/tavily';
import communityFixture from '../../__fixtures__/tavily/thailand-community.json';

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

describe('communityIntelAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns AgentResult with status success on valid fixture input', async () => {
    mockTavilySearch.mockResolvedValue(communityFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...communityIntelFixture.data,
      confidence: 'medium',
      gaps: [],
      sourceUrls: ['https://www.reddit.com/r/ThailandTourism/comments/abc123'],
    };

    const client = makeClient(llmResponse);
    const result = await communityIntelAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('success');
    expect(result.data).not.toBeNull();
    expect(result.sourceTier).toBe(4); // Community is always Tier 4
    expect(result.verified).toBe(false); // Community is never verified
  });

  it('sourceTier is always 4 for community intel', async () => {
    mockTavilySearch.mockResolvedValue(communityFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...communityIntelFixture.data,
      confidence: 'medium',
      gaps: [],
      sourceTier: 1, // LLM shouldn't override this
      sourceUrls: [],
    };

    const client = makeClient(llmResponse);
    const result = await communityIntelAgent(VISA_REQUEST, client, 'standard');

    expect(result.sourceTier).toBe(4);
  });

  it('verified is always false for community intel', async () => {
    mockTavilySearch.mockResolvedValue(communityFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...communityIntelFixture.data,
      confidence: 'high',
      gaps: [],
      sourceUrls: [],
      verified: true, // should be overridden
    };

    const client = makeClient(llmResponse);
    const result = await communityIntelAgent(VISA_REQUEST, client, 'standard');

    expect(result.verified).toBe(false);
  });

  it('returns status failed on error — never throws', async () => {
    mockTavilySearch.mockRejectedValue(new Error('Tavily timeout'));

    const client = makeClient({});
    const result = await communityIntelAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
    expect(result.gaps[0]).toContain('community data unavailable');
  });

  it('gap message for failure is specific about community unavailability', async () => {
    mockTavilySearch.mockRejectedValue(new Error('error'));

    const client = makeClient({});
    const result = await communityIntelAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.gaps[0]).toContain('treat official sources as primary');
  });
});
