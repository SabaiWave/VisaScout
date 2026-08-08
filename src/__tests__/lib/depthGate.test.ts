import { redactForDepth } from '../../lib/depthGate';
import type { VisaBrief } from '../../types/index';
import visaBriefFixture from '../../__fixtures__/visaBrief.json';

const fixture = visaBriefFixture as unknown as VisaBrief;

describe('redactForDepth', () => {
  describe('standard / deep', () => {
    it('returns the brief unchanged for standard', () => {
      const result = redactForDepth(fixture, 'standard');
      expect(result).toBe(fixture);
    });

    it('returns the brief unchanged for deep', () => {
      const result = redactForDepth(fixture, 'deep');
      expect(result).toBe(fixture);
    });
  });

  describe('quick', () => {
    it('empties borderRunAnalysis — no real crossing data leaks', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.borderRunAnalysis.eligible).toBe(false);
      expect(result.borderRunAnalysis.recommendedCrossings).toEqual([]);
      expect(result.borderRunAnalysis.enforcementPosture).toBe('');
      expect(result.borderRunAnalysis.warnings).toEqual([]);
    });

    it('empties contingency — no real guidance leaks', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.contingency.deniedEntrySteps).toEqual([]);
      expect(result.contingency.overstayScenario).toBe('');
      expect(result.contingency.emergencyContacts).toEqual([]);
    });

    it('empties all three conflictReport detail arrays — including confirmed', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.conflictReport.confirmed).toEqual([]);
      expect(result.conflictReport.contested).toEqual([]);
      expect(result.conflictReport.unverified).toEqual([]);
    });

    it('preserves conflictReport.overallConfidence — not gated content, just a quality label', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.conflictReport.overallConfidence).toBe(fixture.conflictReport.overallConfidence);
    });

    it('preserves confidenceScore.overall — computed upstream from real data, not gated', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.confidenceScore.overall).toBe(fixture.confidenceScore.overall);
    });

    it('leaves always-visible sections untouched', () => {
      const result = redactForDepth(fixture, 'quick');
      expect(result.parsedSituation).toBe(fixture.parsedSituation);
      expect(result.recommendedAction).toEqual(fixture.recommendedAction);
      expect(result.visaOptions).toEqual(fixture.visaOptions);
      expect(result.entryRequirements).toEqual(fixture.entryRequirements);
    });

    it('does not mutate the input brief', () => {
      const before = JSON.parse(JSON.stringify(fixture));
      redactForDepth(fixture, 'quick');
      expect(fixture).toEqual(before);
    });
  });
});
