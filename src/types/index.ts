export interface VisaInput {
  nationality: string;
  destination: string;
  visaType?: string;
  freeform: string;
}

export interface VisaRequest extends VisaInput {
  normalizedNationality: string;
  normalizedDestination: string;
  intendedDuration?: string;
  entryExitPattern?: string;
  incomeSource?: string;
  priorVisitHistory?: string;
  accommodationType?: string;
  parsedSummary: string;
}

export interface AgentResult<T> {
  status: 'success' | 'failed';
  data: T | null;
  confidence: 'high' | 'medium' | 'low';
  gaps: string[];
  sourceTier: 1 | 2 | 3 | 4;
  sourceUrls: string[];
  verified: boolean;
  durationMs: number;
  error?: string;
}

export interface OfficialPolicyOutput {
  visaTypes: VisaTypeInfo[];
  defaultStayDuration: string;
  extensionRules: string;
  fees: string;
  applicationProcess: string;
  notes: string[];
}

export interface VisaTypeInfo {
  name: string;
  maxStay: string;
  canExtend: boolean;
  extensionDetails?: string;
  fee?: string;
  eligibility?: string;
}

export interface RecentChangesOutput {
  changes: PolicyChange[];
  enforcementShifts: string[];
  newRequirements: string[];
  lastChecked: string;
}

export interface PolicyChange {
  description: string;
  effectiveDate?: string;
  sourceUrl?: string;
  sourceTier: 1 | 2 | 3 | 4;
}

export interface CommunityIntelOutput {
  recentReports: TravelerReport[];
  groundTruthNotes: string[];
  enforcementReality: string;
  commonIssues: string[];
}

export interface TravelerReport {
  summary: string;
  date?: string;
  sourceUrl?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface EntryRequirementsOutput {
  requiredDocuments: string[];
  proofOfFundsThreshold?: string;
  onwardTicketRequired: boolean;
  onwardTicketNotes?: string;
  healthRequirements: string[];
  additionalNotes: string[];
}

export interface BorderRunOutput {
  limitsPerYear?: string;
  crossingOptions: CrossingOption[];
  enforcementPosture: string;
  recommendedCrossings: string[];
  warnings: string[];
}

export interface CrossingOption {
  name: string;
  country: string;
  notes: string;
  recommended: boolean;
}

export interface ConflictItem {
  topic: string;
  description: string;
  sources: string[];
  resolution?: string;
}

export interface ConflictReport {
  confirmed: ConflictItem[];
  contested: ConflictItem[];
  unverified: ConflictItem[];
  overallConfidence: 'high' | 'medium' | 'low';
}

export interface VisaBrief {
  parsedSituation: string;
  visaOptions: VisaOption[];
  recommendedAction: RecommendedAction;
  entryRequirements: EntryRequirementSummary;
  borderRunAnalysis: BorderRunSummary;
  recentChanges: RecentChangesSummary;
  conflictReport: ConflictReport;
  confidenceScore: ConfidenceScore;
  contingency: ContingencySummary;
  disclaimer: string;
  metadata: BriefMetadata;
}

export interface VisaOption {
  name: string;
  suitability: 'best' | 'good' | 'acceptable';
  maxStay: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export interface RecommendedAction {
  action: string;
  deadline?: string;
  rationale: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface EntryRequirementSummary {
  documents: string[];
  proofOfFunds?: string;
  onwardTicket: boolean;
  health: string[];
  notes: string[];
}

export interface BorderRunSummary {
  eligible: boolean;
  limitsPerYear?: string;
  recommendedCrossings: string[];
  enforcementPosture: string;
  warnings: string[];
}

export interface RecentChangesSummary {
  hasChanges: boolean;
  items: string[];
  watchItems: string[];
}

export interface ConfidenceScore {
  overall: 'high' | 'medium' | 'low';
  perSection: Record<string, 'high' | 'medium' | 'low'>;
  sourceCitations: SourceCitation[];
}

export interface SourceCitation {
  claim: string;
  url: string;
  tier: 1 | 2 | 3 | 4;
  publishedDate?: string;
}

export interface ContingencySummary {
  deniedEntrySteps: string[];
  overstayScenario: string;
  emergencyContacts: string[];
}

export interface AgentStatus {
  agent: string;
  status: 'success' | 'failed';
  confidence: 'high' | 'medium' | 'low';
  sourceTier: 1 | 2 | 3 | 4;
  durationMs: number;
  error?: string;
}

export interface BriefMetadata {
  agentStatuses: AgentStatus[];
  totalDurationMs: number;
  model: string;
  generatedAt: string;
  degraded: boolean;
  depth: 'quick' | 'standard' | 'deep';
}

export interface AgentResultEnvelope {
  visaRequest: VisaRequest;
  officialPolicy: AgentResult<OfficialPolicyOutput>;
  recentChanges: AgentResult<RecentChangesOutput>;
  communityIntel: AgentResult<CommunityIntelOutput>;
  entryRequirements: AgentResult<EntryRequirementsOutput>;
  borderRun: AgentResult<BorderRunOutput>;
}
