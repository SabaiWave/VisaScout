import { AsyncLocalStorage } from 'async_hooks';
import { log } from './logger';

export interface AgentUsage {
  agent: string;
  inputTokens: number;
  outputTokens: number;
  tavilySearches: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
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
const CACHE_WRITE_COST_PER_M = 3.75;  // 125% of input cost
const CACHE_READ_COST_PER_M = 0.30;   // 10% of input cost
// Tavily paid tier — ~$0.01 per search
const TAVILY_COST_PER_SEARCH = 0.01;

export function withUsageTracking<T>(fn: () => Promise<T>): Promise<T> {
  return als.run([], fn);
}

export function recordUsage(usage: AgentUsage): void {
  const store = als.getStore();
  if (!store) return;
  store.push(usage);
  const cost = estimateCost(usage);
  log.info('agent cost', {
    agent: usage.agent,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    tavilySearches: usage.tavilySearches,
    cacheWriteTokens: usage.cacheCreationInputTokens ?? 0,
    cacheReadTokens: usage.cacheReadInputTokens ?? 0,
    estimatedCostUsd: cost,
  });
}

export function estimateCost(usage: AgentUsage): number {
  const inputCost = (usage.inputTokens / 1_000_000) * INPUT_COST_PER_M;
  const outputCost = (usage.outputTokens / 1_000_000) * OUTPUT_COST_PER_M;
  const cacheWriteCost = ((usage.cacheCreationInputTokens ?? 0) / 1_000_000) * CACHE_WRITE_COST_PER_M;
  const cacheReadCost = ((usage.cacheReadInputTokens ?? 0) / 1_000_000) * CACHE_READ_COST_PER_M;
  const tavilyCost = usage.tavilySearches * TAVILY_COST_PER_SEARCH;
  return inputCost + outputCost + cacheWriteCost + cacheReadCost + tavilyCost;
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
      cacheCreationInputTokens: acc.cacheCreationInputTokens + (u.cacheCreationInputTokens ?? 0),
      cacheReadInputTokens: acc.cacheReadInputTokens + (u.cacheReadInputTokens ?? 0),
    }),
    { inputTokens: 0, outputTokens: 0, tavilySearches: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 }
  );

  const totalCost = usages.reduce((sum, u) => sum + estimateCost(u), 0);

  log.info('pipeline cost summary', {
    totalInputTokens: totals.inputTokens,
    totalOutputTokens: totals.outputTokens,
    totalTavilySearches: totals.tavilySearches,
    cacheWriteTokens: totals.cacheCreationInputTokens,
    cacheReadTokens: totals.cacheReadInputTokens,
    estimatedCostUsd: totalCost,
  });
}

// No-op — scope management handled by withUsageTracking
export function resetUsage(): void {}
