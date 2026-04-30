import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily';
import { buildCommunityIntelPrompt } from '../prompts/communityIntel';
import { parseJSON } from '../lib/parseJSON';
import { recordUsage } from '../lib/cost';
import type { AgentResult, CommunityIntelOutput, VisaRequest } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export async function communityIntelAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<CommunityIntelOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;

  try {
    const results = await tavilySearch(
      `${request.normalizedDestination} visa ${request.normalizedNationality} reddit nomadlist experience 2025 border run tourist`,
      {
        maxResults,
        domainBias: [
          'reddit.com', 'nomadlist.com', 'thaivisa.com',
          'tripadvisor.com', 'reddit.com/r/ThailandTourism',
          'reddit.com/r/digitalnomad', 'reddit.com/r/SEABackpacking',
        ],
      }
    );

    const sourceUrls = results.map((r) => r.url);

    const searchText = results
      .map((r) => `[${r.url}]\nPublished: ${r.publishedDate ?? 'unknown'}\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildCommunityIntelPrompt(request, searchText || 'No community results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'communityIntel',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 1,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<CommunityIntelOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceUrls: string[];
    }>(raw);

    return {
      status: 'success',
      data: {
        recentReports: parsed.recentReports ?? [],
        groundTruthNotes: parsed.groundTruthNotes ?? [],
        enforcementReality: parsed.enforcementReality ?? '',
        commonIssues: parsed.commonIssues ?? [],
      },
      confidence: parsed.confidence ?? 'medium',
      gaps: parsed.gaps ?? [],
      sourceTier: 4,
      sourceUrls: parsed.sourceUrls?.length ? parsed.sourceUrls : sourceUrls,
      verified: false,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: 'failed',
      data: null,
      confidence: 'low',
      gaps: ['CommunityIntel agent failed — community data unavailable, treat official sources as primary'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
