export interface AgentUsage {
  agent: string;
  inputTokens: number;
  outputTokens: number;
  tavilySearches: number;
}

const usageLog: AgentUsage[] = [];

// claude-sonnet-4-6 pricing (per 1M tokens)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;
// Tavily paid tier — ~$0.01 per search
const TAVILY_COST_PER_SEARCH = 0.01;

export function recordUsage(usage: AgentUsage): void {
  usageLog.push(usage);
  const cost = estimateCost(usage);
  console.log(
    `[cost] ${usage.agent}: ${usage.inputTokens}in / ${usage.outputTokens}out tokens` +
      ` | ${usage.tavilySearches} searches | ~$${cost.toFixed(4)}`
  );
}

export function estimateCost(usage: AgentUsage): number {
  const inputCost = (usage.inputTokens / 1_000_000) * INPUT_COST_PER_M;
  const outputCost = (usage.outputTokens / 1_000_000) * OUTPUT_COST_PER_M;
  const tavilyCost = usage.tavilySearches * TAVILY_COST_PER_SEARCH;
  return inputCost + outputCost + tavilyCost;
}

export function printCostSummary(): void {
  const totals = usageLog.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + u.inputTokens,
      outputTokens: acc.outputTokens + u.outputTokens,
      tavilySearches: acc.tavilySearches + u.tavilySearches,
    }),
    { inputTokens: 0, outputTokens: 0, tavilySearches: 0 }
  );

  const totalCost = usageLog.reduce((sum, u) => sum + estimateCost(u), 0);

  console.log('\n=== Cost Summary ===');
  console.log(`Total input tokens:  ${totals.inputTokens.toLocaleString()}`);
  console.log(`Total output tokens: ${totals.outputTokens.toLocaleString()}`);
  console.log(`Total Tavily searches: ${totals.tavilySearches}`);
  console.log(`Estimated total cost: $${totalCost.toFixed(4)}`);
  console.log('===================\n');
}

export function resetUsage(): void {
  usageLog.length = 0;
}
