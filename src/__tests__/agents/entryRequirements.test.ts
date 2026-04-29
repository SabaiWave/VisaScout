import Anthropic from '@anthropic-ai/sdk';
import { entryRequirementsAgent } from '../../agents/entryRequirements';
import type { VisaRequest } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import entryRequirementsFixture from '../../__fixtures__/agents/entryRequirements.json';

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

describe('entryRequirementsAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns AgentResult with status success on valid fixture input', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...entryRequirementsFixture.data,
      confidence: 'high',
      gaps: [],
      sourceTier: 1,
      sourceUrls: ['https://www.immigration.go.th/en/?page_id=1161'],
      verified: true,
    };

    const client = makeClient(llmResponse);
    const result = await entryRequirementsAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('success');
    expect(result.data).not.toBeNull();
    expect(result.data!.requiredDocuments).toBeInstanceOf(Array);
    expect(typeof result.data!.onwardTicketRequired).toBe('boolean');
  });

  it('output includes all required AgentResult fields', async () => {
    mockTavilySearch.mockResolvedValue(thailandOfficialFixture as ReturnType<typeof tavilySearch> extends Promise<infer T> ? T : never);

    const llmResponse = {
      ...entryRequirementsFixture.data,
      confidence: 'high',
      gaps: [],
      sourceTier: 1,
      sourceUrls: [],
      verified: true,
    };

    const client = makeClient(llmResponse);
    const result = await entryRequirementsAgent(VISA_REQUEST, client, 'standard');

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('sourceTier');
    expect(result).toHaveProperty('sourceUrls');
    expect(result).toHaveProperty('verified');
    expect(result).toHaveProperty('durationMs');
  });

  it('returns status failed on Tavily error — never throws', async () => {
    mockTavilySearch.mockRejectedValue(new Error('API unavailable'));

    const client = makeClient({});
    const result = await entryRequirementsAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('gap message for failure is specific about entry requirements', async () => {
    mockTavilySearch.mockRejectedValue(new Error('error'));

    const client = makeClient({});
    const result = await entryRequirementsAgent(VISA_REQUEST, client, 'standard');

    expect(result.status).toBe('failed');
    expect(result.gaps[0]).toContain('entry requirement');
  });

  it('biases Tavily search toward .gov domains', async () => {
    mockTavilySearch.mockResolvedValue([]);
    const client = makeClient({ requiredDocuments: [], onwardTicketRequired: false, healthRequirements: [], additionalNotes: [], confidence: 'low', gaps: [], sourceTier: 4, sourceUrls: [], verified: false });

    await entryRequirementsAgent(VISA_REQUEST, client, 'standard');

    const callArgs = mockTavilySearch.mock.calls[0][1];
    expect(callArgs.domainBias).toBeDefined();
    expect(callArgs.domainBias!.some((d: string) => d.includes('.gov'))).toBe(true);
  });
});
