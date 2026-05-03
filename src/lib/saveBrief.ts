import { getSupabase } from './supabase';
import type { VisaBrief, VisaRequest } from '../types/index';

export interface SaveBriefInput {
  visaRequest: VisaRequest;
  brief: VisaBrief;
  depth: 'quick' | 'standard' | 'deep';
  userId?: string;
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
