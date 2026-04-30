import { recordUsage, estimateCost, printCostSummary, resetUsage } from '../../lib/cost';

describe('cost tracking', () => {
  beforeEach(() => {
    resetUsage();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    it('logs usage to console when recording', () => {
      recordUsage({ agent: 'officialPolicy', inputTokens: 500, outputTokens: 200, tavilySearches: 1 });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('officialPolicy')
      );
    });

    it('includes token counts in log output', () => {
      recordUsage({ agent: 'recentChanges', inputTokens: 1000, outputTokens: 500, tavilySearches: 2 });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('1000in')
      );
    });
  });

  describe('printCostSummary', () => {
    it('prints summary after recording usage', () => {
      recordUsage({ agent: 'orchestrator', inputTokens: 200, outputTokens: 100, tavilySearches: 0 });
      recordUsage({ agent: 'synthesis', inputTokens: 2000, outputTokens: 1500, tavilySearches: 0 });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      printCostSummary();

      const calls = consoleSpy.mock.calls.map((c) => String(c[0]));
      expect(calls.some((c) => c.includes('=== Cost Summary ==='))).toBe(true);
      expect(calls.some((c) => c.includes('Total input tokens:'))).toBe(true);
      expect(calls.some((c) => c.includes('Total output tokens:'))).toBe(true);
      expect(calls.some((c) => c.includes('Estimated total cost:'))).toBe(true);
    });

    it('prints zero totals when no usage has been recorded', () => {
      printCostSummary();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('$0.0000'));
    });

    it('aggregates tokens across multiple agent calls', () => {
      recordUsage({ agent: 'a', inputTokens: 100, outputTokens: 50, tavilySearches: 1 });
      recordUsage({ agent: 'b', inputTokens: 200, outputTokens: 100, tavilySearches: 2 });

      jest.clearAllMocks();
      printCostSummary();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('300'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('3'));
    });
  });

  describe('resetUsage', () => {
    it('clears accumulated usage so printCostSummary starts fresh', () => {
      recordUsage({ agent: 'test', inputTokens: 999, outputTokens: 999, tavilySearches: 10 });
      resetUsage();

      jest.clearAllMocks();
      printCostSummary();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('$0.0000'));
    });
  });
});
