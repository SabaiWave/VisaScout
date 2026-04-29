import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily.js';
import { buildOfficialPolicyPrompt } from '../prompts/officialPolicy.js';
import { parseJSON } from '../lib/parseJSON.js';
import { highestTier } from '../lib/sourceTier.js';
import { recordUsage } from '../lib/cost.js';
import type { AgentResult, OfficialPolicyOutput, VisaRequest } from '../types/index.js';

const MODEL = 'claude-sonnet-4-6';

export async function officialPolicyAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<OfficialPolicyOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;

  try {
    const results = await tavilySearch(
      `${request.normalizedDestination} visa ${request.normalizedNationality} official immigration rules requirements 2024 2025`,
      {
        maxResults,
        domainBias: [
          '.gov', '.go.th', '.go.vn', '.gov.sg', '.gov.ph', '.gov.my',
          'immigration.go.th', 'evisa.gov.vn', 'immigration.gov',
        ],
      }
    );

    const sourceUrls = results.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = results
      .map((r) => `[${r.url}]\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildOfficialPolicyPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'officialPolicy',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 1,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<OfficialPolicyOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceTier: 1 | 2 | 3 | 4;
      sourceUrls: string[];
      verified: boolean;
    }>(raw);

    return {
      status: 'success',
      data: {
        visaTypes: parsed.visaTypes ?? [],
        defaultStayDuration: parsed.defaultStayDuration ?? '',
        extensionRules: parsed.extensionRules ?? '',
        fees: parsed.fees ?? '',
        applicationProcess: parsed.applicationProcess ?? '',
        notes: parsed.notes ?? [],
      },
      confidence: parsed.confidence ?? 'medium',
      gaps: parsed.gaps ?? [],
      sourceTier: parsed.sourceTier ?? sourceTier,
      sourceUrls: parsed.sourceUrls?.length ? parsed.sourceUrls : sourceUrls,
      verified: parsed.verified ?? sourceTier <= 2,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'failed',
      data: null,
      confidence: 'low',
      gaps: ['Official policy agent failed — visa rules not available'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
