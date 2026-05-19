import { AsyncLocalStorage } from 'async_hooks';

export interface AgentUsage {
  agent: string;
  inputTokens: number;
  outputTokens: number;
  tavilySearches: number;
}

export interface ReportCost {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTavilySearches: number;
  estimatedCostUsd: number;
}

// Per-request isolated storage — prevents concurrent requests corrupting each other's cost logs
const als = new AsyncLocalStorage<AgentUsage[]>();

// claude-sonnet-4-6 pricing (per 1M tokens)
const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;
// Tavily paid tier — ~$0.01 per search
const TAVILY_COST_PER_SEARCH = 0.01;

export function withUsageTracking<T>(fn: () => Promise<T>): Promise<T> {
  return als.run([], fn);
}

export function recordUsage(usage: AgentUsage): void {
  const log = als.getStore();
  if (!log) return;
  log.push(usage);
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

export function calculateReportCost(usages: AgentUsage[]): ReportCost {
  const totalInputTokens = usages.reduce((sum, u) => sum + u.inputTokens, 0);
  const totalOutputTokens = usages.reduce((sum, u) => sum + u.outputTokens, 0);
  const totalTavilySearches = usages.reduce((sum, u) => sum + u.tavilySearches, 0);
  const estimatedCostUsd = usages.reduce((sum, u) => sum + estimateCost(u), 0);
  return { totalInputTokens, totalOutputTokens, totalTavilySearches, estimatedCostUsd };
}

export function getUsageLog(): AgentUsage[] {
  return [...(als.getStore() ?? [])];
}

export function printCostSummary(): void {
  const usages = als.getStore() ?? [];
  const totals = usages.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + u.inputTokens,
      outputTokens: acc.outputTokens + u.outputTokens,
      tavilySearches: acc.tavilySearches + u.tavilySearches,
    }),
    { inputTokens: 0, outputTokens: 0, tavilySearches: 0 }
  );

  const totalCost = usages.reduce((sum, u) => sum + estimateCost(u), 0);

  console.log('\n=== Cost Summary ===');
  console.log(`Total input tokens:  ${totals.inputTokens.toLocaleString()}`);
  console.log(`Total output tokens: ${totals.outputTokens.toLocaleString()}`);
  console.log(`Total Tavily searches: ${totals.tavilySearches}`);
  console.log(`Estimated total cost: $${totalCost.toFixed(4)}`);
  console.log('===================\n');
}

// No-op — scope management handled by withUsageTracking
export function resetUsage(): void {}
