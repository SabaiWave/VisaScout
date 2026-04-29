import Anthropic from '@anthropic-ai/sdk';
import { buildConflictResolverPrompt } from '../prompts/conflictResolver.js';
import { parseJSON } from '../lib/parseJSON.js';
import { recordUsage } from '../lib/cost.js';
import type { AgentResultEnvelope, ConflictReport } from '../types/index.js';

const MODEL = 'claude-sonnet-4-6';

export async function resolveConflicts(
  envelope: AgentResultEnvelope,
  client: Anthropic
): Promise<ConflictReport> {
  const prompt = buildConflictResolverPrompt(envelope);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  recordUsage({
    agent: 'conflictResolver',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    tavilySearches: 0,
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
