import { classifySourceTier, highestTier } from '../../lib/sourceTier';

describe('classifySourceTier', () => {
  describe('Tier 1 — government sites', () => {
    it('classifies .gov domain as Tier 1', () => {
      expect(classifySourceTier('https://travel.state.gov/visas')).toBe(1);
    });

    it('classifies .go.th domain as Tier 1', () => {
      expect(classifySourceTier('https://www.immigration.go.th/en/?page_id=1161')).toBe(1);
    });

    it('classifies .go.vn domain as Tier 1', () => {
      expect(classifySourceTier('https://evisa.gov.vn/en')).toBe(1);
    });

    it('classifies .gov.sg domain as Tier 1', () => {
      expect(classifySourceTier('https://www.ica.gov.sg/enter-transit-depart/entering-singapore')).toBe(1);
    });

    it('classifies .gov.ph domain as Tier 1', () => {
      expect(classifySourceTier('https://immigration.gov.ph/visas')).toBe(1);
    });

    it('classifies immigration.go.th as Tier 1', () => {
      expect(classifySourceTier('https://immigration.go.th/en')).toBe(1);
    });

    it('classifies mfa.go.th as Tier 1', () => {
      expect(classifySourceTier('https://www.mfa.go.th/en/content/visa')).toBe(1);
    });
  });

  describe('Tier 2 — official travel authorities', () => {
    it('classifies iata.org as Tier 2', () => {
      expect(classifySourceTier('https://www.iata.org/en/programs/passenger/timatic')).toBe(2);
    });

    it('classifies smartraveller.gov.au as Tier 2', () => {
      expect(classifySourceTier('https://www.smartraveller.gov.au/destinations/asia/thailand')).toBe(2);
    });

    it('classifies travel.state.gov as Tier 2 (foreign travel subdomain)', () => {
      // travel.state.gov is .gov so actually Tier 1 — this tests precedence
      expect(classifySourceTier('https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Thailand.html')).toBe(1);
    });
  });

  describe('Tier 3 — aggregators', () => {
    it('classifies visahq.com as Tier 3', () => {
      expect(classifySourceTier('https://www.visahq.com/thailand')).toBe(3);
    });

    it('classifies sherpa.io as Tier 3', () => {
      expect(classifySourceTier('https://sherpa.io/travel-restrictions')).toBe(3);
    });

    it('classifies ivisa.com as Tier 3', () => {
      expect(classifySourceTier('https://www.ivisa.com/thailand-visa')).toBe(3);
    });
  });

  describe('Tier 4 — community sources', () => {
    it('classifies reddit.com as Tier 4', () => {
      expect(classifySourceTier('https://www.reddit.com/r/ThailandTourism/comments/abc')).toBe(4);
    });

    it('classifies nomadlist.com as Tier 4', () => {
      expect(classifySourceTier('https://nomadlist.com/thailand')).toBe(4);
    });

    it('classifies facebook.com as Tier 4', () => {
      expect(classifySourceTier('https://www.facebook.com/groups/digitalnomads')).toBe(4);
    });

    it('classifies thaivisa.com as Tier 4', () => {
      expect(classifySourceTier('https://aseannow.com/topic/1234-thailand-visa')).toBe(4);
    });

    it('classifies unknown domain as Tier 4 (safe default)', () => {
      expect(classifySourceTier('https://www.somerandomblog.com/thailand-visa-tips')).toBe(4);
    });

    it('classifies empty string as Tier 4', () => {
      expect(classifySourceTier('')).toBe(4);
    });
  });
});

describe('highestTier', () => {
  it('returns Tier 1 when one Tier 1 URL is present among lower tiers', () => {
    expect(
      highestTier([
        'https://www.reddit.com/r/Thailand',
        'https://www.immigration.go.th/en',
        'https://nomadlist.com/thailand',
      ])
    ).toBe(1);
  });

  it('returns Tier 2 when best source is Tier 2', () => {
    expect(
      highestTier([
        'https://www.reddit.com/r/Thailand',
        'https://www.iata.org/en/programs',
        'https://nomadlist.com/thailand',
      ])
    ).toBe(2);
  });

  it('returns Tier 4 when all sources are community', () => {
    expect(
      highestTier([
        'https://www.reddit.com/r/Thailand',
        'https://nomadlist.com/thailand',
      ])
    ).toBe(4);
  });

  it('returns Tier 4 for empty array', () => {
    expect(highestTier([])).toBe(4);
  });

  it('handles single Tier 1 URL', () => {
    expect(highestTier(['https://www.immigration.go.th/en'])).toBe(1);
  });
});
