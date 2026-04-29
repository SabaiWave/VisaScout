import Anthropic from '@anthropic-ai/sdk';
import { buildOrchestratorPrompt } from './prompts/orchestrator.js';
import { parseJSON } from './lib/parseJSON.js';
import { recordUsage } from './lib/cost.js';
import { officialPolicyAgent } from './agents/officialPolicy.js';
import { recentChangesAgent } from './agents/recentChanges.js';
import { communityIntelAgent } from './agents/communityIntel.js';
import { entryRequirementsAgent } from './agents/entryRequirements.js';
import { borderRunAgent } from './agents/borderRun.js';
import type {
  VisaInput,
  VisaRequest,
  AgentResultEnvelope,
  AgentResult,
  OfficialPolicyOutput,
  RecentChangesOutput,
  CommunityIntelOutput,
  EntryRequirementsOutput,
  BorderRunOutput,
} from './types/index.js';

const MODEL = 'claude-sonnet-4-6';

function sanitizeFreeform(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s.,!?'"()\-:;@#%&+=[\]{}|\\/<>]/g, '')
    .slice(0, 2000)
    .trim();
}

export async function runOrchestrator(
  input: VisaInput,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard',
  onParsed?: (request: VisaRequest) => void
): Promise<AgentResultEnvelope> {
  const sanitizedInput: VisaInput = {
    ...input,
    freeform: sanitizeFreeform(input.freeform),
  };

  const prompt = buildOrchestratorPrompt(sanitizedInput);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  recordUsage({
    agent: 'orchestrator',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    tavilySearches: 0,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const visaRequest = parseJSON<VisaRequest>(raw);

  onParsed?.(visaRequest);

  const [
    officialPolicyResult,
    recentChangesResult,
    communityIntelResult,
    entryRequirementsResult,
    borderRunResult,
  ] = await Promise.allSettled([
    officialPolicyAgent(visaRequest, client, depth),
    recentChangesAgent(visaRequest, client, depth),
    communityIntelAgent(visaRequest, client, depth),
    entryRequirementsAgent(visaRequest, client, depth),
    borderRunAgent(visaRequest, client, depth),
  ]);

  function unwrap<T>(
    result: PromiseSettledResult<AgentResult<T>>,
    agentName: string,
    gapMessage: string
  ): AgentResult<T> {
    if (result.status === 'fulfilled') return result.value;
    return {
      status: 'failed',
      data: null,
      confidence: 'low',
      gaps: [gapMessage],
      sourceTier: 4,
      sourceUrls: [],
      verified: false,
      durationMs: 0,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  }

  return {
    visaRequest,
    officialPolicy: unwrap<OfficialPolicyOutput>(
      officialPolicyResult,
      'officialPolicy',
      'OfficialPolicy agent failed — visa rules not available from official sources'
    ),
    recentChanges: unwrap<RecentChangesOutput>(
      recentChangesResult,
      'recentChanges',
      'RecentChanges agent failed — recent policy changes not available'
    ),
    communityIntel: unwrap<CommunityIntelOutput>(
      communityIntelResult,
      'communityIntel',
      'CommunityIntel agent failed — community data unavailable, treat official sources as primary'
    ),
    entryRequirements: unwrap<EntryRequirementsOutput>(
      entryRequirementsResult,
      'entryRequirements',
      'EntryRequirements agent failed — entry requirement details not available'
    ),
    borderRun: unwrap<BorderRunOutput>(
      borderRunResult,
      'borderRun',
      'BorderRun agent failed — border run analysis based on official policy only, no community enforcement data available'
    ),
  };
}
