const TIER_1_PATTERNS = [
  /\.gov($|\/)/i,
  /\.go\.th($|\/)/i,
  /\.go\.vn($|\/)/i,
  /\.gov\.sg($|\/)/i,
  /\.gov\.ph($|\/)/i,
  /\.gov\.my($|\/)/i,
  /immigration\.gov/i,
  /mfa\.gov/i,
  /mofa\.go/i,
  /consulate\.gov/i,
  /embassy\.gov/i,
  /evisa\.gov/i,
  /thaiembassy\.com/i,
  /immigration\.go\.th/i,
  /immigration\.gov\.vn/i,
  /immd\.gov\.hk/i,
  /moi\.go\.th/i,
  /boi\.go\.th/i,
];

const TIER_2_PATTERNS = [
  /iata\.org/i,
  /timatic/i,
  /travel\.state\.gov/i,
  /gov\.uk\/foreign-travel/i,
  /smartraveller\.gov\.au/i,
  /travel\.gc\.ca/i,
  /auswaertiges-amt\.de/i,
];

const TIER_3_PATTERNS = [
  /visahq\.com/i,
  /sherpa\.io/i,
  /ivisa\.com/i,
  /visaguide\.world/i,
  /passportindex\.org/i,
  /henleypassportindex/i,
];

const TIER_4_PATTERNS = [
  /reddit\.com/i,
  /nomadlist\.com/i,
  /facebook\.com/i,
  /thaivisa\.com/i,
  /tripadvisor\.com/i,
  /trustpilot\.com/i,
  /expat/i,
];

export function classifySourceTier(url: string): 1 | 2 | 3 | 4 {
  if (TIER_1_PATTERNS.some((p) => p.test(url))) return 1;
  if (TIER_2_PATTERNS.some((p) => p.test(url))) return 2;
  if (TIER_3_PATTERNS.some((p) => p.test(url))) return 3;
  return 4;
}

export function highestTier(urls: string[]): 1 | 2 | 3 | 4 {
  if (urls.length === 0) return 4;
  return urls.reduce<1 | 2 | 3 | 4>((best, url) => {
    const t = classifySourceTier(url);
    return t < best ? t : best;
  }, 4);
}
