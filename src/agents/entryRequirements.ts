import Anthropic from '@anthropic-ai/sdk';
import { tavilySearch } from '../tools/tavily';
import { buildEntryRequirementsPrompt } from '../prompts/entryRequirements';
import { parseJSON } from '../lib/parseJSON';
import { highestTier } from '../lib/sourceTier';
import { recordUsage } from '../lib/cost';
import type { AgentResult, EntryRequirementsOutput, VisaRequest } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export async function entryRequirementsAgent(
  request: VisaRequest,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard'
): Promise<AgentResult<EntryRequirementsOutput>> {
  const start = Date.now();
  const maxResults = depth === 'quick' ? 3 : depth === 'standard' ? 5 : 8;

  try {
    const results = await tavilySearch(
      `${request.normalizedDestination} entry requirements ${request.normalizedNationality} documents proof of funds onward ticket 2025`,
      {
        maxResults,
        domainBias: [
          '.gov', '.go.th', '.go.vn', '.gov.sg', '.gov.ph', '.gov.my',
          'immigration.go.th', 'evisa.gov.vn',
        ],
      }
    );

    const sourceUrls = results.map((r) => r.url);
    const sourceTier = highestTier(sourceUrls);

    const searchText = results
      .map((r) => `[${r.url}]\nTitle: ${r.title}\n${r.content}`)
      .join('\n\n---\n\n');

    const prompt = buildEntryRequirementsPrompt(request, searchText || 'No results found.');

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    recordUsage({
      agent: 'entryRequirements',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      tavilySearches: 1,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = parseJSON<EntryRequirementsOutput & {
      confidence: 'high' | 'medium' | 'low';
      gaps: string[];
      sourceTier: 1 | 2 | 3 | 4;
      sourceUrls: string[];
      verified: boolean;
    }>(raw);

    return {
      status: 'success',
      data: {
        requiredDocuments: parsed.requiredDocuments ?? [],
        proofOfFundsThreshold: parsed.proofOfFundsThreshold,
        onwardTicketRequired: parsed.onwardTicketRequired ?? false,
        onwardTicketNotes: parsed.onwardTicketNotes,
        healthRequirements: parsed.healthRequirements ?? [],
        additionalNotes: parsed.additionalNotes ?? [],
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
      gaps: ['EntryRequirements agent failed — entry requirement details not available'],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
