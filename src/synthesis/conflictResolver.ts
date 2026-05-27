import Anthropic from '@anthropic-ai/sdk';
import { buildConflictResolverPrompt } from '../prompts/conflictResolver';
import { parseJSON } from '../lib/parseJSON';
import { recordUsage } from '../lib/cost';
import type { AgentResultEnvelope, ConflictReport } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

/**
 * Deterministic confidence scoring using cross-agent agreement + source tier.
 * Overrides the LLM's overallConfidence after parsing.
 *
 * HIGH:   2+ Tier 1 agents succeeded, OR 4+/5 agents succeeded with zero contested claims
 * MEDIUM: 1 Tier 1 agent succeeded, OR majority (3+/5) succeeded with ≤1 contested claim
 * LOW:    all other cases (no Tier 1-2 coverage, significant conflicts, low agent agreement)
 */
export function computeOverallConfidence(
  report: ConflictReport,
  envelope: AgentResultEnvelope
): 'high' | 'medium' | 'low' {
  const agents = [
    envelope.officialPolicy,
    envelope.recentChanges,
    envelope.communityIntel,
    envelope.entryRequirements,
    envelope.borderRun,
  ];

  const succeeded = agents.filter((a) => a.status === 'success');
  const tier1Count = succeeded.filter((a) => a.sourceTier === 1).length;
  const contestedCount = report.contested.length;

  // HIGH: 2+ Tier 1 sources confirmed, OR 4+/5 agents agree with zero contested claims
  if (tier1Count >= 2 || (succeeded.length >= 4 && contestedCount === 0)) {
    return 'high';
  }

  // MEDIUM: 1 Tier 1 source confirmed, OR majority (3+/5) agents agree with minor conflicts (≤1 contested)
  if (tier1Count >= 1 || (succeeded.length >= 3 && contestedCount <= 1)) {
    return 'medium';
  }

  // LOW: No Tier 1-2 sources AND significant unverified/contested items AND low agent agreement
  return 'low';
}

export async function resolveConflicts(
  envelope: AgentResultEnvelope,
  client: Anthropic
): Promise<ConflictReport> {
  const { system, user } = buildConflictResolverPrompt(envelope);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });

  recordUsage({
    agent: 'conflictResolver',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    tavilySearches: 0,
    cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    const report = parseJSON<ConflictReport>(raw);
    // Override LLM's overallConfidence with deterministic cross-agent scoring
    report.overallConfidence = computeOverallConfidence(report, envelope);
    return report;
  } catch {
    return {
      confirmed: [],
      contested: [],
      unverified: [
        {
          topic: 'All claims',
          description: 'ConflictResolver failed to parse agent outputs — all claims should be manually verified',
          sources: [],
          resolution: 'Verify all claims with official government immigration sources',
        },
      ],
      overallConfidence: 'low',
    };
  }
}
