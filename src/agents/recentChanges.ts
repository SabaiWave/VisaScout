import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily.js';
import { buildRecentChangesPrompt } from '../prompts/recentChanges.js';
import { parseJSON } from '../lib/parseJSON.js';
import { highestTier } from '../lib/sourceTier.js';
import { recordUsage } from '../lib/cost.js';
import type { AgentResult, RecentChangesOutput, VisaRequest } from '../types/index.js';

const MODEL = 'claude-sonnet-4-6';

export async function recentChangesAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<RecentChangesOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;

  try {
    const results = await tavilySearch(
      `${request.normalizedDestination} visa policy changes ${request.normalizedNationality} 2025 new rules enforcement`,
      {
        maxResults,
        days: 90,
      }
    );

    const sourceUrls = results.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = results
      .map((r) => `[${r.url}]\nPublished: ${r.publishedDate ?? 'unknown'}\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildRecentChangesPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'recentChanges',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 1,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<RecentChangesOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceTier: 1 | 2 | 3 | 4;
      sourceUrls: string[];
      verified: boolean;
    }>(raw);

    return {
      status: 'success',
      data: {
        changes: parsed.changes ?? [],
        enforcementShifts: parsed.enforcementShifts ?? [],
        newRequirements: parsed.newRequirements ?? [],
        lastChecked: parsed.lastChecked ?? new Date().toISOString().split('T')[0],
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
      gaps: ['RecentChanges agent failed — recent policy changes not available'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
