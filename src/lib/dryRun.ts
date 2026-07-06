import type { VisaBrief, VisaRequest, ConflictReport } from '../types/index';

// Fixture imports — only loaded when DRY_RUN=true
import visaRequestFixture from '../__fixtures__/agents/visaRequest.json';
import visaBriefFixture from '../__fixtures__/visaBrief.json';

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const AGENT_SEQUENCE: Array<{
  agent: string;
  fastDelay: number;
  slowDelay: number;
  confidence: 'high' | 'medium' | 'low';
  sourceTier: 1 | 2 | 3 | 4;
  durationMs: number;
}> = [
  { agent: 'officialPolicy',    fastDelay: 900,  slowDelay: 1000, confidence: 'high',   sourceTier: 1, durationMs: 1240 },
  { agent: 'entryRequirements', fastDelay: 700,  slowDelay: 2500, confidence: 'high',   sourceTier: 1, durationMs: 870  },
  { agent: 'recentChanges',     fastDelay: 800,  slowDelay: 4000, confidence: 'high',   sourceTier: 1, durationMs: 980  },
  { agent: 'communityIntel',    fastDelay: 1000, slowDelay: 5500, confidence: 'medium', sourceTier: 4, durationMs: 1100 },
  { agent: 'borderRun',         fastDelay: 950,  slowDelay: 7000, confidence: 'medium', sourceTier: 2, durationMs: 1050 },
];

type Depth = 'quick' | 'standard' | 'deep';

// Strips the deep fixture down to match what each depth tier actually produces
export function stripToDepth(brief: VisaBrief, depth: Depth): VisaBrief {
  if (depth === 'deep') return brief;
  const b = JSON.parse(JSON.stringify(brief)) as VisaBrief;

  if (depth === 'quick') {
    // Quick: 1 visa option, no applicationDocs, minimal conflict + notes
    b.visaOptions = b.visaOptions.slice(0, 1).map(opt => {
      const { applicationDocs: _d, applicationUrl: _u, ...rest } = opt;
      void _d; void _u;
      return rest;
    });
    b.entryRequirements.notes = [];
    b.conflictReport.contested = [];
    b.conflictReport.unverified = [];
    b.borderRunAnalysis.recommendedCrossings = b.borderRunAnalysis.recommendedCrossings.slice(0, 1);
    b.metadata.depth = 'quick';
  } else {
    // Standard: 2 visa options, applicationDocs included
    b.visaOptions = b.visaOptions.slice(0, 2);
    b.metadata.depth = 'standard';
  }

  return b;
}

export async function runDryPipeline(
  send: (data: unknown) => void,
  slow = false,
  depth: Depth = 'standard',
): Promise<{ brief: VisaBrief; visaRequest: VisaRequest }> {
  // Step 1: emit parsed situation
  await delay(slow ? 800 : 400);
  send({ type: 'parsed', data: visaRequestFixture as VisaRequest });

  // Step 2: all agents start immediately (they run in parallel in real pipeline)
  for (const entry of AGENT_SEQUENCE) {
    send({ type: 'status', agent: entry.agent, status: 'running' });
  }

  // Step 3: agents complete with staggered delays (simulates parallel execution)
  // slow=true spreads completions ~1.5s apart so the yellow→green animation is visible in dev
  await Promise.all(
    AGENT_SEQUENCE.map(async (entry) => {
      await delay(slow ? entry.slowDelay : entry.fastDelay);
      send({
        type: 'status',
        agent: entry.agent,
        status: 'complete',
        confidence: entry.confidence,
        sourceTier: entry.sourceTier,
        durationMs: entry.durationMs,
      });
    })
  );

  // Step 4: conflict resolution
  await delay(slow ? 1500 : 600);
  const fullBrief = visaBriefFixture as unknown as VisaBrief;
  send({ type: 'conflict', data: fullBrief.conflictReport as ConflictReport });

  // Step 5: return depth-stripped fixture — caller sends complete event with briefId after saving
  await delay(slow ? 1000 : 800);
  const brief = stripToDepth(fullBrief, depth);
  return { brief, visaRequest: visaRequestFixture as VisaRequest };
}
