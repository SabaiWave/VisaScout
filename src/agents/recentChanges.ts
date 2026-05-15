import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily';
import { buildRecentChangesPrompt } from '../prompts/recentChanges';
import { parseJSON } from '../lib/parseJSON';
import { highestTier } from '../lib/sourceTier';
import { recordUsage } from '../lib/cost';
import type { AgentResult, RecentChangesOutput, VisaRequest } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export async function recentChangesAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<RecentChangesOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;
  const agentMaxTokens = depth === 'quick' ? 2048 : depth === 'standard' ? 4096 : 6144;

  // Destination-specific Tier 1 official domains for recent-changes searches
  const officialDomains: Record<string, string[]> = {
    Thailand:    ['immigration.go.th', 'mfa.go.th', 'thailand.prd.go.th', 'thaigov.go.th'],
    Vietnam:     ['immigration.gov.vn', 'evisa.gov.vn', 'mofa.gov.vn'],
    Indonesia:   ['imigrasi.go.id', 'kemlu.go.id'],
    Malaysia:    ['imi.gov.my', 'kln.gov.my'],
    Philippines: ['immigration.gov.ph', 'dfa.gov.ph'],
    Cambodia:    ['evisa.gov.kh', 'mfaic.gov.kh'],
    Singapore:   ['ica.gov.sg', 'mfa.gov.sg'],
    Laos:        ['laoevisa.gov.la', 'mofa.gov.la'],
    Myanmar:     ['evisa.moip.gov.mm', 'mofa.gov.mm'],
    Brunei:      ['immigration.gov.bn', 'mfa.gov.bn'],
  };
  const destDomains = officialDomains[request.normalizedDestination] ?? [];

  try {
    // Two parallel searches: recent news (Tier 3+) and official government sources (Tier 1)
    const [newsResults, officialResults] = await Promise.all([
      tavilySearch(
        `${request.normalizedDestination} visa policy changes ${request.normalizedNationality} 2025 new rules enforcement announcement`,
        { maxResults: maxResults - 1, days: 90 }
      ),
      destDomains.length
        ? tavilySearch(
            `${request.normalizedDestination} visa immigration policy update announcement 2024 2025`,
            { maxResults: 3, domainBias: destDomains }
          )
        : Promise.resolve([]),
    ]);

    const results = [...officialResults, ...newsResults];

    const sourceUrls = results.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = results
      .map((r) => `[${r.url}]\nPublished: ${r.publishedDate ?? 'unknown'}\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildRecentChangesPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: agentMaxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'recentChanges',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: destDomains.length ? 2 : 1,
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
