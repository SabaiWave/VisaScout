import Anthropic from '@anthropic-ai/sdk';
import { buildSynthesisPrompt } from '../prompts/synthesis';
import { parseJSON } from '../lib/parseJSON';
import { recordUsage } from '../lib/cost';
import type {
  AgentResultEnvelope,
  ConflictReport,
  VisaBrief,
  BriefMetadata,
  AgentStatus,
} from '../types/index';

const MODEL = 'claude-sonnet-4-6';

export function buildDegradedContext(envelope: AgentResultEnvelope): string {
  const gaps: string[] = [];

  if (envelope.officialPolicy.status === 'failed') {
    gaps.push('OfficialPolicy agent failed — visa rules not available from official sources. Treat all visa type information as unverified.');
  }
  if (envelope.recentChanges.status === 'failed') {
    gaps.push('RecentChanges agent failed — recent policy changes not available. Check official immigration sites for updates before travel.');
  }
  if (envelope.communityIntel.status === 'failed') {
    gaps.push('CommunityIntel agent failed — community data unavailable. Treat official sources as primary. Real enforcement posture unknown.');
  }
  if (envelope.entryRequirements.status === 'failed') {
    gaps.push('EntryRequirements agent failed — entry requirement details not available. Verify documents, proof of funds, and onward ticket requirements directly with the airline and immigration authority.');
  }
  if (envelope.borderRun.status === 'failed') {
    gaps.push('BorderRun agent failed — border run analysis based on official policy only, no community enforcement data available. Border crossing posture is unverified.');
  }

  return gaps.join('\n\n');
}

export async function synthesizeBrief(
  envelope: AgentResultEnvelope,
  conflictReport: ConflictReport,
  client: Anthropic,
  depth: 'quick' | 'standard' | 'deep' = 'standard',
  startTime: number = Date.now()
): Promise<VisaBrief> {
  const degradedContext = buildDegradedContext(envelope);
  const prompt = buildSynthesisPrompt(envelope, conflictReport, degradedContext);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  recordUsage({
    agent: 'synthesis',
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    tavilySearches: 0,
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Synthesis output exceeded max_tokens (${response.usage.output_tokens} tokens). Brief was truncated and cannot be parsed. Try a shallower depth setting.`);
  }

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';

  const brief = parseJSON<Omit<VisaBrief, 'metadata'>>(raw);

  const agentStatuses: AgentStatus[] = [
    { agent: 'OfficialPolicy', ...statusFrom(envelope.officialPolicy) },
    { agent: 'RecentChanges', ...statusFrom(envelope.recentChanges) },
    { agent: 'CommunityIntel', ...statusFrom(envelope.communityIntel) },
    { agent: 'EntryRequirements', ...statusFrom(envelope.entryRequirements) },
    { agent: 'BorderRun', ...statusFrom(envelope.borderRun) },
  ];

  const degraded = agentStatuses.some((s) => s.status === 'failed');

  const metadata: BriefMetadata = {
    agentStatuses,
    totalDurationMs: Date.now() - startTime,
    model: MODEL,
    generatedAt: new Date().toISOString(),
    degraded,
    depth,
  };

  return {
    ...brief,
    conflictReport,
    disclaimer:
      'This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.',
    metadata,
  };
}

function statusFrom(result: { status: string; confidence: string; sourceTier: number; durationMs: number; error?: string }) {
  return {
    status: result.status as 'success' | 'failed',
    confidence: result.confidence as 'high' | 'medium' | 'low',
    sourceTier: result.sourceTier as 1 | 2 | 3 | 4,
    durationMs: result.durationMs,
    error: result.error,
  };
}
