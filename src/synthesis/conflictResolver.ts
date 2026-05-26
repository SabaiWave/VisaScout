import Anthropic from '@anthropic-ai/sdk';
import { buildConflictResolverPrompt } from '../prompts/conflictResolver';
import { parseJSON } from '../lib/parseJSON';
import { recordUsage } from '../lib/cost';
import type { AgentResultEnvelope, ConflictReport } from '../types/index';

const MODEL = 'claude-sonnet-4-6';

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
    return parseJSON<ConflictReport>(raw);
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
