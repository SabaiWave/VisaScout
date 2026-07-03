import { getSupabase } from './supabase';
import { getOrCreateUser } from './users';
import type { VisaBrief, VisaRequest } from '../types/index';
import type { ReportCost } from './cost';

export interface SaveBriefInput {
  visaRequest: VisaRequest;
  brief: VisaBrief;
  depth: 'quick' | 'standard' | 'deep';
  userId?: string;
  cost?: ReportCost;
  fundedBy?: 'stripe' | 'invite' | 'free';
  isDryRun?: boolean;
}

export interface ShellBriefInput {
  nationality: string;
  destination: string;
  visaType?: string;
  freeform: string;
  depth: 'quick' | 'standard' | 'deep';
  userId: string;
}

export async function createShellBrief(input: ShellBriefInput): Promise<string> {
  const { id: internalUserId } = await getOrCreateUser(input.userId);

  const { data, error } = await getSupabase()
    .from('briefs')
    .insert({
      nationality: input.nationality,
      destination: input.destination,
      visa_type: input.visaType ?? null,
      freeform_input: input.freeform,
      depth: input.depth,
      user_id: internalUserId,
      payment_status: 'pending',
      degraded: false,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create shell brief: ${error.message}`);
  return (data as { id: string }).id;
}

export interface UpdateBriefContentInput {
  briefId: string;
  visaRequest: VisaRequest;
  brief: VisaBrief;
  fundedBy: 'stripe' | 'invite' | 'free';
  cost?: ReportCost;
  isDryRun?: boolean;
}

export async function updateBriefWithContent(input: UpdateBriefContentInput): Promise<void> {
  const paymentStatus = input.fundedBy === 'stripe' ? 'paid' : 'unpaid';

  const { error } = await getSupabase()
    .from('briefs')
    .update({
      nationality: input.visaRequest.normalizedNationality,
      destination: input.visaRequest.normalizedDestination,
      visa_request: input.visaRequest,
      brief_markdown: JSON.stringify(input.brief),
      conflict_report: input.brief.conflictReport,
      agent_statuses: input.brief.metadata.agentStatuses,
      overall_confidence: input.brief.confidenceScore.overall,
      degraded: input.brief.metadata.degraded,
      payment_status: paymentStatus,
      funded_by: input.fundedBy,
      ...(input.isDryRun !== undefined && { is_dry_run: input.isDryRun }),
      ...(input.cost && {
        total_tokens_input:  input.cost.totalInputTokens,
        total_tokens_output: input.cost.totalOutputTokens,
        tavily_searches:     input.cost.totalTavilySearches,
        estimated_cost_usd:  input.cost.estimatedCostUsd,
      }),
    })
    .eq('id', input.briefId);

  if (error) throw new Error(`Failed to update brief: ${error.message}`);
}

export async function saveBrief({ visaRequest, brief, depth, userId, cost, fundedBy, isDryRun }: SaveBriefInput): Promise<string> {
  let internalUserId: string | null = null;
  if (userId) {
    try {
      internalUserId = (await getOrCreateUser(userId)).id;
    } catch {
      // Non-fatal — brief saved without user association; caller logs saveBrief failures
    }
  }

  const { data, error } = await getSupabase()
    .from('briefs')
    .insert({
      nationality: visaRequest.normalizedNationality,
      destination: visaRequest.normalizedDestination,
      visa_type: visaRequest.visaType ?? null,
      freeform_input: visaRequest.freeform ?? null,
      visa_request: visaRequest,
      brief_markdown: JSON.stringify(brief),
      conflict_report: brief.conflictReport,
      agent_statuses: brief.metadata.agentStatuses,
      overall_confidence: brief.confidenceScore.overall,
      degraded: brief.metadata.degraded,
      depth,
      user_id: internalUserId ?? null,
      funded_by: fundedBy ?? null,
      is_dry_run: isDryRun ?? false,
      ...(cost && {
        total_tokens_input:  cost.totalInputTokens,
        total_tokens_output: cost.totalOutputTokens,
        tavily_searches:     cost.totalTavilySearches,
        estimated_cost_usd:  cost.estimatedCostUsd,
      }),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save brief: ${error.message}`);
  return (data as { id: string }).id;
}
