import {
  DESTINATIONS,
  SUPPORTED_DESTINATION_NAMES,
  SCHENGEN_MEMBERS,
  getGovDomains,
  ENABLED_REGIONS,
} from '../../config/destinations';

describe('DESTINATIONS', () => {
  it('contains all 10 SEA destinations', () => {
    const seaDestinations = DESTINATIONS.filter((d) => d.region === 'SEA');
    expect(seaDestinations).toHaveLength(10);
    const seaNames = seaDestinations.map((d) => d.name);
    expect(seaNames).toContain('Thailand');
    expect(seaNames).toContain('Vietnam');
    expect(seaNames).toContain('Indonesia');
    expect(seaNames).toContain('Malaysia');
    expect(seaNames).toContain('Philippines');
    expect(seaNames).toContain('Cambodia');
    expect(seaNames).toContain('Laos');
    expect(seaNames).toContain('Myanmar');
    expect(seaNames).toContain('Singapore');
    expect(seaNames).toContain('Brunei');
  });

  it('contains Japan and South Korea', () => {
    const eastAsiaDestinations = DESTINATIONS.filter((d) => d.region === 'East Asia');
    expect(eastAsiaDestinations).toHaveLength(2);
    const eastAsiaNames = eastAsiaDestinations.map((d) => d.name);
    expect(eastAsiaNames).toContain('Japan');
    expect(eastAsiaNames).toContain('South Korea');
  });

  it('contains at least 4 Schengen members with schengenMember:true', () => {
    const schengenDestinations = DESTINATIONS.filter((d) => d.schengenMember === true);
    expect(schengenDestinations.length).toBeGreaterThanOrEqual(4);
    const schengenNames = schengenDestinations.map((d) => d.name);
    expect(schengenNames).toContain('Germany');
    expect(schengenNames).toContain('Portugal');
    expect(schengenNames).toContain('Spain');
  });

  it('contains Mexico and Colombia', () => {
    const latinAmericaDestinations = DESTINATIONS.filter((d) => d.region === 'Latin America');
    expect(latinAmericaDestinations).toHaveLength(2);
    const latinAmericaNames = latinAmericaDestinations.map((d) => d.name);
    expect(latinAmericaNames).toContain('Mexico');
    expect(latinAmericaNames).toContain('Colombia');
  });

  it('SUPPORTED_DESTINATION_NAMES derives from DESTINATIONS', () => {
    expect(SUPPORTED_DESTINATION_NAMES).toHaveLength(DESTINATIONS.length);
    DESTINATIONS.forEach((dest) => {
      expect(SUPPORTED_DESTINATION_NAMES).toContain(dest.name);
    });
  });

  it('SCHENGEN_MEMBERS only contains entries with schengenMember:true', () => {
    SCHENGEN_MEMBERS.forEach((memberName) => {
      const dest = DESTINATIONS.find((d) => d.name === memberName);
      expect(dest).toBeDefined();
      expect(dest?.schengenMember).toBe(true);
    });
  });

  it('getGovDomains() returns non-empty array for every destination', () => {
    DESTINATIONS.forEach((dest) => {
      const domains = getGovDomains(dest.name);
      expect(domains).toBeDefined();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  it('every destination has at least 3 visaTypes', () => {
    DESTINATIONS.forEach((dest) => {
      expect(dest.visaTypes.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('every destination has at least one govDomain', () => {
    DESTINATIONS.forEach((dest) => {
      expect(dest.govDomains.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('getGovDomains() returns fallback for unknown destination', () => {
    const domains = getGovDomains('UnknownCountry');
    expect(domains).toEqual(['.gov']);
  });

  it('getGovDomains() returns correct domains for Germany', () => {
    const domains = getGovDomains('Germany');
    expect(domains).toContain('bamf.de');
    expect(domains).toContain('auswaertiges-amt.de');
  });

  it('getGovDomains() returns correct domains for Thailand', () => {
    const domains = getGovDomains('Thailand');
    expect(domains).toContain('immigration.go.th');
    expect(domains).toContain('thaievisa.go.th');
  });

  it('Japan has region East Asia and destination notes', () => {
    const japan = DESTINATIONS.find((d) => d.name === 'Japan');
    expect(japan).toBeDefined();
    expect(japan?.region).toBe('East Asia');
    expect(japan?.notes).toBeDefined();
    expect(japan?.notes?.length).toBeGreaterThan(0);
  });

  it('South Korea has region East Asia and destination notes', () => {
    const korea = DESTINATIONS.find((d) => d.name === 'South Korea');
    expect(korea).toBeDefined();
    expect(korea?.region).toBe('East Asia');
    expect(korea?.notes).toBeDefined();
    expect(korea?.notes?.length).toBeGreaterThan(0);
  });

  it('Mexico has Latin America region and destination notes', () => {
    const mexico = DESTINATIONS.find((d) => d.name === 'Mexico');
    expect(mexico).toBeDefined();
    expect(mexico?.region).toBe('Latin America');
    expect(mexico?.notes).toBeDefined();
    expect(mexico?.notes).toContain('FMM');
  });

  it('Colombia has Latin America region and destination notes', () => {
    const colombia = DESTINATIONS.find((d) => d.name === 'Colombia');
    expect(colombia).toBeDefined();
    expect(colombia?.region).toBe('Latin America');
    expect(colombia?.notes).toBeDefined();
    expect(colombia?.notes).toContain('M-10');
  });

  it('ENABLED_REGIONS contains all four regions', () => {
    expect(ENABLED_REGIONS).toContain('SEA');
    expect(ENABLED_REGIONS).toContain('East Asia');
    expect(ENABLED_REGIONS).toContain('Schengen');
    expect(ENABLED_REGIONS).toContain('Latin America');
  });
});
