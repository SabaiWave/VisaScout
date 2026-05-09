import { getSupabase } from './supabase';
import type { VisaBrief, VisaRequest } from '../types/index';

export interface SaveBriefInput {
  visaRequest: VisaRequest;
  brief: VisaBrief;
  depth: 'quick' | 'standard' | 'deep';
  userId?: string;
}

export interface ShellBriefInput {
  nationality: string;
  destination: string;
  visaType?: string;
  freeform: string;
  depth: 'standard' | 'deep';
  userId: string;
}

export async function createShellBrief(input: ShellBriefInput): Promise<string> {
  const { data, error } = await getSupabase()
    .from('briefs')
    .insert({
      nationality: input.nationality,
      destination: input.destination,
      visa_type: input.visaType ?? null,
      freeform_input: input.freeform,
      depth: input.depth,
      user_id: input.userId,
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
  stripeSessionId: string;
  paymentStatus: 'paid' | 'error';
}

export async function updateBriefWithContent(input: UpdateBriefContentInput): Promise<void> {
  const { error } = await getSupabase()
    .from('briefs')
    .update({
      visa_request: input.visaRequest,
      brief_markdown: JSON.stringify(input.brief),
      conflict_report: input.brief.conflictReport,
      agent_statuses: input.brief.metadata.agentStatuses,
      overall_confidence: input.brief.confidenceScore.overall,
      degraded: input.brief.metadata.degraded,
      stripe_session_id: input.stripeSessionId,
      payment_status: input.paymentStatus,
    })
    .eq('id', input.briefId);

  if (error) throw new Error(`Failed to update brief: ${error.message}`);
}

export async function saveBrief({ visaRequest, brief, depth, userId }: SaveBriefInput): Promise<string> {
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
      user_id: userId ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save brief: ${error.message}`);
  return (data as { id: string }).id;
}
