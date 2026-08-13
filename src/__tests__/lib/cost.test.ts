jest.mock('../../lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { log as logger } from '../../lib/logger';
import { recordUsage, estimateCost, printCostSummary, resetUsage, calculateReportCost, getUsageLog, withUsageTracking } from '../../lib/cost';

const mockLogInfo = logger.info as jest.Mock;

describe('cost tracking', () => {
  beforeEach(() => {
    resetUsage();
    mockLogInfo.mockClear();
  });

  afterEach(() => {
    resetUsage();
  });

  describe('estimateCost', () => {
    it('calculates cost from input and output tokens', () => {
      const cost = estimateCost({ agent: 'test', inputTokens: 1_000_000, outputTokens: 0, tavilySearches: 0 });
      expect(cost).toBeCloseTo(3.0, 5);
    });

    it('calculates output token cost correctly', () => {
      const cost = estimateCost({ agent: 'test', inputTokens: 0, outputTokens: 1_000_000, tavilySearches: 0 });
      expect(cost).toBeCloseTo(15.0, 5);
    });

    it('adds Tavily search cost per search', () => {
      const cost = estimateCost({ agent: 'test', inputTokens: 0, outputTokens: 0, tavilySearches: 1 });
      expect(cost).toBeCloseTo(0.01, 5);
    });

    it('sums all cost components', () => {
      const cost = estimateCost({ agent: 'test', inputTokens: 1_000_000, outputTokens: 1_000_000, tavilySearches: 5 });
      expect(cost).toBeCloseTo(18.05, 5); // 3 + 15 + 0.05
    });

    it('returns 0 for zero usage', () => {
      const cost = estimateCost({ agent: 'test', inputTokens: 0, outputTokens: 0, tavilySearches: 0 });
      expect(cost).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('logs structured agent cost info when recording', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'officialPolicy', inputTokens: 500, outputTokens: 200, tavilySearches: 1 });
        expect(mockLogInfo).toHaveBeenCalledWith('agent cost', expect.objectContaining({ agent: 'officialPolicy' }));
      });
    });

    it('includes token counts in structured log', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'recentChanges', inputTokens: 1000, outputTokens: 500, tavilySearches: 2 });
        expect(mockLogInfo).toHaveBeenCalledWith('agent cost', expect.objectContaining({ inputTokens: 1000 }));
      });
    });
  });

  describe('printCostSummary', () => {
    it('logs structured summary after recording usage', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'orchestrator', inputTokens: 200, outputTokens: 100, tavilySearches: 0 });
        recordUsage({ agent: 'synthesis', inputTokens: 2000, outputTokens: 1500, tavilySearches: 0 });

        mockLogInfo.mockClear();
        printCostSummary();

        expect(mockLogInfo).toHaveBeenCalledWith('pipeline cost summary', expect.objectContaining({
          totalInputTokens: 2200,
          totalOutputTokens: 1600,
          totalTavilySearches: 0,
        }));
      });
    });

    it('logs zero totals when no usage has been recorded', async () => {
      await withUsageTracking(async () => {
        printCostSummary();
        expect(mockLogInfo).toHaveBeenCalledWith('pipeline cost summary', expect.objectContaining({
          estimatedCostUsd: 0,
        }));
      });
    });

    it('aggregates tokens across multiple agent calls', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'a', inputTokens: 100, outputTokens: 50, tavilySearches: 1 });
        recordUsage({ agent: 'b', inputTokens: 200, outputTokens: 100, tavilySearches: 2 });

        mockLogInfo.mockClear();
        printCostSummary();

        expect(mockLogInfo).toHaveBeenCalledWith('pipeline cost summary', expect.objectContaining({
          totalInputTokens: 300,
          totalTavilySearches: 3,
        }));
      });
    });
  });

  describe('resetUsage', () => {
    it('printCostSummary logs zero totals when called outside ALS context', () => {
      // recordUsage outside withUsageTracking is a no-op (ALS store is null)
      recordUsage({ agent: 'test', inputTokens: 999, outputTokens: 999, tavilySearches: 10 });
      resetUsage();

      mockLogInfo.mockClear();
      printCostSummary();

      expect(mockLogInfo).toHaveBeenCalledWith('pipeline cost summary', expect.objectContaining({
        totalInputTokens: 0,
        estimatedCostUsd: 0,
      }));
    });
  });

  describe('calculateReportCost', () => {
    it('returns zero totals for empty array', () => {
      const result = calculateReportCost([]);
      expect(result.totalInputTokens).toBe(0);
      expect(result.totalOutputTokens).toBe(0);
      expect(result.totalTavilySearches).toBe(0);
      expect(result.estimatedCostUsd).toBe(0);
    });

    it('sums tokens and searches across multiple usages', () => {
      const usages = [
        { agent: 'a', inputTokens: 1000, outputTokens: 500, tavilySearches: 2 },
        { agent: 'b', inputTokens: 2000, outputTokens: 1000, tavilySearches: 3 },
      ];
      const result = calculateReportCost(usages);
      expect(result.totalInputTokens).toBe(3000);
      expect(result.totalOutputTokens).toBe(1500);
      expect(result.totalTavilySearches).toBe(5);
    });

    it('calculates estimatedCostUsd correctly', () => {
      const usages = [
        { agent: 'test', inputTokens: 1_000_000, outputTokens: 1_000_000, tavilySearches: 0 },
      ];
      const result = calculateReportCost(usages);
      expect(result.estimatedCostUsd).toBeCloseTo(18.0, 5); // $3 in + $15 out
    });

    it('does not modify the ALS store', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'recorded', inputTokens: 100, outputTokens: 50, tavilySearches: 0 });
        const externalUsages = [{ agent: 'external', inputTokens: 9999, outputTokens: 9999, tavilySearches: 10 }];
        calculateReportCost(externalUsages);

        const usageLog = getUsageLog();
        expect(usageLog).toHaveLength(1);
        expect(usageLog[0].agent).toBe('recorded');
      });
    });
  });

  describe('getUsageLog', () => {
    it('returns a copy of the current log', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'test', inputTokens: 100, outputTokens: 50, tavilySearches: 1 });
        const usageLog = getUsageLog();
        expect(usageLog).toHaveLength(1);
        expect(usageLog[0].agent).toBe('test');
      });
    });

    it('returns empty array when log is empty', () => {
      expect(getUsageLog()).toHaveLength(0);
    });

    it('returned copy does not mutate the internal log', async () => {
      await withUsageTracking(async () => {
        recordUsage({ agent: 'a', inputTokens: 1, outputTokens: 1, tavilySearches: 0 });
        const copy = getUsageLog();
        copy.push({ agent: 'injected', inputTokens: 999, outputTokens: 999, tavilySearches: 0 });
        expect(getUsageLog()).toHaveLength(1);
      });
    });
  });
});
