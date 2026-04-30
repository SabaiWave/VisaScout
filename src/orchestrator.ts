import Anthropic from '@anthropic-ai/sdk';
import { buildOrchestratorPrompt } from './prompts/orchestrator';
import { parseJSON } from './lib/parseJSON';
import { recordUsage } from './lib/cost';
import { log } from './lib/logger';
import { officialPolicyAgent } from './agents/officialPolicy';
import { recentChangesAgent } from './agents/recentChanges';
import { communityIntelAgent } from './agents/communityIntel';
import { entryRequirementsAgent } from './agents/entryRequirements';
import { borderRunAgent } from './agents/borderRun';
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
} from './types/index';

export type AgentStatusEvent =
  | { agent: string; status: 'running' }
  | { agent: string; status: 'complete'; confidence: string; sourceTier: number; durationMs: number }
  | { agent: string; status: 'failed'; error?: string };

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
  onParsed?: (request: VisaRequest) => void,
  onAgentStatus?: (event: AgentStatusEvent) => void
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

  async function runWithStatus<T>(
    name: string,
    fn: () => Promise<AgentResult<T>>
  ): Promise<AgentResult<T>> {
    onAgentStatus?.({ agent: name, status: 'running' });
    log.info('agent start', { agent: name });
    const result = await fn();
    if (result.status === 'success') {
      onAgentStatus?.({ agent: name, status: 'complete', confidence: result.confidence, sourceTier: result.sourceTier, durationMs: result.durationMs });
      log.info('agent complete', { agent: name, durationMs: result.durationMs, confidence: result.confidence, sourceTier: result.sourceTier });
    } else {
      onAgentStatus?.({ agent: name, status: 'failed', error: result.error });
      log.error('agent failed', { agent: name, error: result.error });
    }
    return result;
  }

  const [
    officialPolicyResult,
    recentChangesResult,
    communityIntelResult,
    entryRequirementsResult,
    borderRunResult,
  ] = await Promise.allSettled([
    runWithStatus('officialPolicy', () => officialPolicyAgent(visaRequest, client, depth)),
    runWithStatus('recentChanges', () => recentChangesAgent(visaRequest, client, depth)),
    runWithStatus('communityIntel', () => communityIntelAgent(visaRequest, client, depth)),
    runWithStatus('entryRequirements', () => entryRequirementsAgent(visaRequest, client, depth)),
    runWithStatus('borderRun', () => borderRunAgent(visaRequest, client, depth)),
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
