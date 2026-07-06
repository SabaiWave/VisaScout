import { stripToDepth } from '../../lib/dryRun';
import type { VisaBrief } from '../../types/index';
import visaBriefFixture from '../../__fixtures__/visaBrief.json';

const fixture = visaBriefFixture as unknown as VisaBrief;

describe('stripToDepth', () => {
  describe('deep', () => {
    it('returns brief unchanged', () => {
      const result = stripToDepth(fixture, 'deep');
      expect(result).toBe(fixture);
    });

    it('preserves all 3 visa options', () => {
      const result = stripToDepth(fixture, 'deep');
      expect(result.visaOptions).toHaveLength(3);
    });

    it('preserves applicationDocs on TR visa', () => {
      const result = stripToDepth(fixture, 'deep');
      const tr = result.visaOptions.find(o => o.name === 'Tourist Visa (TR)');
      expect(tr?.applicationDocs).toBeDefined();
      expect(tr?.applicationDocs!.length).toBeGreaterThan(0);
    });

    it('preserves applicationUrl', () => {
      const result = stripToDepth(fixture, 'deep');
      const tr = result.visaOptions.find(o => o.name === 'Tourist Visa (TR)');
      expect(tr?.applicationUrl).toBeDefined();
    });
  });

  describe('standard', () => {
    it('limits to 2 visa options', () => {
      const result = stripToDepth(fixture, 'standard');
      expect(result.visaOptions).toHaveLength(2);
    });

    it('preserves applicationDocs on TR visa', () => {
      const result = stripToDepth(fixture, 'standard');
      const tr = result.visaOptions.find(o => o.name === 'Tourist Visa (TR)');
      expect(tr?.applicationDocs).toBeDefined();
      expect(tr?.applicationDocs!.length).toBeGreaterThan(0);
    });

    it('sets metadata.depth to standard', () => {
      const result = stripToDepth(fixture, 'standard');
      expect(result.metadata.depth).toBe('standard');
    });

    it('does not mutate original fixture', () => {
      stripToDepth(fixture, 'standard');
      expect(fixture.visaOptions).toHaveLength(3);
    });
  });

  describe('quick', () => {
    it('limits to 1 visa option', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.visaOptions).toHaveLength(1);
    });

    it('keeps best-fit option (first)', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.visaOptions[0].suitability).toBe('best');
    });

    it('strips applicationDocs from visa option', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.visaOptions[0].applicationDocs).toBeUndefined();
    });

    it('strips applicationUrl from visa option', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.visaOptions[0].applicationUrl).toBeUndefined();
    });

    it('empties entryRequirements.notes', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.entryRequirements.notes).toHaveLength(0);
    });

    it('empties conflictReport.contested', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.conflictReport.contested).toHaveLength(0);
    });

    it('empties conflictReport.unverified', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.conflictReport.unverified).toHaveLength(0);
    });

    it('limits borderRun recommendedCrossings to 1', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.borderRunAnalysis.recommendedCrossings).toHaveLength(1);
    });

    it('sets metadata.depth to quick', () => {
      const result = stripToDepth(fixture, 'quick');
      expect(result.metadata.depth).toBe('quick');
    });

    it('does not mutate original fixture', () => {
      stripToDepth(fixture, 'quick');
      expect(fixture.visaOptions).toHaveLength(3);
      expect(fixture.entryRequirements.notes.length).toBeGreaterThan(0);
    });
  });
});
