import {
  getRegionContext,
  buildAgentContext,
  SCHENGEN_CONTEXT,
  EAST_ASIA_CONTEXT,
  LATIN_AMERICA_CONTEXT,
  SEA_CONTEXT,
} from '../../prompts/regionContext';
import type { VisaRequest } from '../../types/index';
import type { DestinationConfig } from '../../config/destinations';

describe('getRegionContext', () => {
  it('returns SCHENGEN_CONTEXT when schengenMember:true', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Germany',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Germany',
      parsedSummary: 'test',
      schengenMember: true,
    };
    const context = getRegionContext(req);
    expect(context).toBe(SCHENGEN_CONTEXT);
  });

  it('returns EAST_ASIA_CONTEXT for Japan (region: East Asia)', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Japan',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Japan',
      parsedSummary: 'test',
      region: 'East Asia',
      schengenMember: false,
    };
    const context = getRegionContext(req);
    expect(context).toBe(EAST_ASIA_CONTEXT);
  });

  it('returns EAST_ASIA_CONTEXT for South Korea (region: East Asia)', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'South Korea',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'South Korea',
      parsedSummary: 'test',
      region: 'East Asia',
      schengenMember: false,
    };
    const context = getRegionContext(req);
    expect(context).toBe(EAST_ASIA_CONTEXT);
  });

  it('returns LATIN_AMERICA_CONTEXT for Mexico (region: Latin America)', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Mexico',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Mexico',
      parsedSummary: 'test',
      region: 'Latin America',
      schengenMember: false,
    };
    const context = getRegionContext(req);
    expect(context).toBe(LATIN_AMERICA_CONTEXT);
  });

  it('returns LATIN_AMERICA_CONTEXT for Colombia (region: Latin America)', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Colombia',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Colombia',
      parsedSummary: 'test',
      region: 'Latin America',
      schengenMember: false,
    };
    const context = getRegionContext(req);
    expect(context).toBe(LATIN_AMERICA_CONTEXT);
  });

  it('returns SEA_CONTEXT for Thailand (default — no special region)', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Thailand',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Thailand',
      parsedSummary: 'test',
      region: 'SEA',
      schengenMember: false,
    };
    const context = getRegionContext(req);
    expect(context).toBe(SEA_CONTEXT);
  });

  it('SCHENGEN_CONTEXT includes 90/180 rule text', () => {
    expect(SCHENGEN_CONTEXT).toContain('90/180');
    expect(SCHENGEN_CONTEXT).toContain('rolling window');
  });

  it('SCHENGEN_CONTEXT explicitly states border runs do not work', () => {
    expect(SCHENGEN_CONTEXT).toContain('Border runs DO NOT WORK');
    expect(SCHENGEN_CONTEXT).toContain('Never suggest this as a strategy');
  });

  it('EAST_ASIA_CONTEXT includes K-ETA text', () => {
    expect(EAST_ASIA_CONTEXT).toContain('K-ETA');
  });

  it('LATIN_AMERICA_CONTEXT includes FMM text for Mexico', () => {
    expect(LATIN_AMERICA_CONTEXT).toContain('FMM');
  });

  it('LATIN_AMERICA_CONTEXT includes M-10 text for Colombia', () => {
    expect(LATIN_AMERICA_CONTEXT).toContain('M-10');
  });

  it('SEA_CONTEXT mentions border runs as acceptable practice', () => {
    expect(SEA_CONTEXT).toContain('Border runs');
  });
});

describe('buildAgentContext', () => {
  it('returns region + country notes when dest.notes set', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Japan',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Japan',
      parsedSummary: 'test',
      region: 'East Asia',
      schengenMember: false,
    };

    const dest: DestinationConfig = {
      name: 'Japan',
      aliases: ['Japan'],
      govDomains: ['mofa.go.jp'],
      visaTypes: ['Tourist', 'Business'],
      region: 'East Asia',
      notes: 'Japan-specific rules here',
    };

    const context = buildAgentContext(req, dest);
    expect(context).toContain(EAST_ASIA_CONTEXT);
    expect(context).toContain('Japan-specific rules here');
    expect(context).toContain('\n\n');
  });

  it('returns region only when dest.notes empty', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Vietnam',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Vietnam',
      parsedSummary: 'test',
      region: 'SEA',
      schengenMember: false,
    };

    const dest: DestinationConfig = {
      name: 'Vietnam',
      aliases: ['Vietnam'],
      govDomains: ['immigration.gov.vn'],
      visaTypes: ['E-Visa', 'Visa on Arrival'],
      region: 'SEA',
    };

    const context = buildAgentContext(req, dest);
    expect(context).toBe(SEA_CONTEXT);
  });

  it('includes destination notes when present for Schengen destination', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Germany',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Germany',
      parsedSummary: 'test',
      schengenMember: true,
    };

    const dest: DestinationConfig = {
      name: 'Germany',
      aliases: ['Germany'],
      govDomains: ['bamf.de'],
      visaTypes: ['Schengen Visa'],
      region: 'Schengen',
      schengenMember: true,
      notes: 'Germany processing requirements',
    };

    const context = buildAgentContext(req, dest);
    expect(context).toContain(SCHENGEN_CONTEXT);
    expect(context).toContain('Germany processing requirements');
  });

  it('returns region only for Schengen when no destination notes', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Portugal',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Portugal',
      parsedSummary: 'test',
      schengenMember: true,
    };

    const dest: DestinationConfig = {
      name: 'Portugal',
      aliases: ['Portugal'],
      govDomains: ['aima.gov.pt'],
      visaTypes: ['Schengen Visa'],
      region: 'Schengen',
      schengenMember: true,
    };

    const context = buildAgentContext(req, dest);
    expect(context).toBe(SCHENGEN_CONTEXT);
  });

  it('includes Latin America context with notes for Mexico', () => {
    const req: VisaRequest = {
      nationality: 'US',
      destination: 'Mexico',
      freeform: '',
      normalizedNationality: 'United States',
      normalizedDestination: 'Mexico',
      parsedSummary: 'test',
      region: 'Latin America',
      schengenMember: false,
    };

    const dest: DestinationConfig = {
      name: 'Mexico',
      aliases: ['Mexico'],
      govDomains: ['inm.gob.mx'],
      visaTypes: ['Tourist'],
      region: 'Latin America',
      notes: 'FMM card requirements',
    };

    const context = buildAgentContext(req, dest);
    expect(context).toContain(LATIN_AMERICA_CONTEXT);
    expect(context).toContain('FMM card requirements');
  });
});
