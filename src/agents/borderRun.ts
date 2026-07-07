import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily';
import { buildBorderRunPrompt } from '../prompts/borderRun';
import { parseJSON } from '../lib/parseJSON';
import { highestTier } from '../lib/sourceTier';
import { recordUsage } from '../lib/cost';
import { getGovDomains } from '../config/destinations';
import type { AgentResult, BorderRunOutput, VisaRequest } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export async function borderRunAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<BorderRunOutput>> {
  if (process.env.DRY_RUN === 'true') {
    return {
      status: 'success',
      data: { crossingOptions: [], enforcementPosture: 'DRY_RUN — no data', recommendedCrossings: [], warnings: [] },
      confidence: 'low',
      gaps: ['DRY_RUN mode — no API calls made'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: 0,
    };
  }

  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;
  const agentMaxTokens = depth === 'quick' ? 2048 : depth === 'standard' ? 4096 : 6144;

  try {
    const [officialResults, communityResults] = await Promise.all([
      tavilySearch(
        `${request.normalizedDestination} border run visa run land border limit official policy 2025`,
        {
          maxResults: Math.ceil(maxResults / 2),
          domainBias: getGovDomains(request.normalizedDestination),
        }
      ),
      tavilySearch(
        `${request.normalizedDestination} border run experience reddit 2025 ${request.normalizedNationality} land crossing`,
        {
          maxResults: Math.floor(maxResults / 2),
          domainBias: ['reddit.com', 'nomadlist.com', 'thaivisa.com'],
        }
      ),
    ]);

    const allResults = [...officialResults, ...communityResults];
    const sourceUrls = allResults.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = allResults
      .map((r) => `[${r.url}]\nPublished: ${r.publishedDate ?? 'unknown'}\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const { system, user } = buildBorderRunPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: agentMaxTokens,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    });

    recordUsage({
      agent: 'borderRun',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 2,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<BorderRunOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceTier: 1 | 2 | 3 | 4;
      sourceUrls: string[];
      verified: boolean;
    }>(raw);

    return {
      status: 'success',
      data: {
        limitsPerYear: parsed.limitsPerYear,
        crossingOptions: parsed.crossingOptions ?? [],
        enforcementPosture: parsed.enforcementPosture ?? '',
        recommendedCrossings: parsed.recommendedCrossings ?? [],
        warnings: parsed.warnings ?? [],
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
      gaps: ['BorderRun agent failed — border run analysis based on official policy only, no community enforcement data available'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
