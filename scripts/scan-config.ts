// scripts/scan-config.ts — scan-specific metadata for each destination
//
// Pipeline config lives in src/config/destinations.ts (govDomains, visaTypes, notes, etc.)
// This file adds GTM scan metadata: subreddits + city keywords for Reddit post detection.
//
// ─── MAINTENANCE RULE ─────────────────────────────────────────────────────────
// When adding a destination to src/config/destinations.ts:
//   1. Add an entry here in OVERRIDES (subreddits + cityKeywords)
//   2. Add at least one query in buildQueries() in scan-reddit-tavily.ts
//   3. If a good destination-specific subreddit exists, add it to SUBREDDIT_ALLOWLIST
//      by putting it here — the allowlist auto-derives from this file.
//
// When removing a destination:
//   1. Remove its entry from OVERRIDES below
//   2. Remove its query from buildQueries() in scan-reddit-tavily.ts
// ──────────────────────────────────────────────────────────────────────────────

import { DESTINATIONS } from '../src/config/destinations'

interface SubredditEntry {
  name: string;            // subreddit name, lowercase, no r/ prefix
  mapsToDestination: boolean; // true = all posts in this sub map to this destination
}

interface ScanOverride {
  subreddits: SubredditEntry[];
  cityKeywords: string[];  // city/neighborhood keywords not already in destination aliases
}

// Per-destination scan overrides — keyed by canonical destination name (must match destinations.ts)
const OVERRIDES: Partial<Record<string, ScanOverride>> = {
  // ─── SEA ──────────────────────────────────────────────────────────────────
  'Thailand': {
    subreddits: [
      { name: 'thailandtourism', mapsToDestination: true },
      { name: 'thailandexpats', mapsToDestination: true },
      { name: 'thaivisa', mapsToDestination: true },
    ],
    cityKeywords: ['bangkok', 'phuket', 'chiang mai'],
  },
  'Vietnam': {
    subreddits: [{ name: 'vietnamtourism', mapsToDestination: true }],
    cityKeywords: ['hanoi', 'ho chi minh', 'saigon', 'da nang'],
  },
  'Indonesia': {
    subreddits: [{ name: 'bali', mapsToDestination: true }],
    cityKeywords: ['bali', 'jakarta'],
  },
  'Malaysia': {
    subreddits: [],
    cityKeywords: ['kuala lumpur'],
  },
  'Philippines': {
    // pinoytraveller: Filipinos asking about destinations — not specifically Philippines as destination.
    // mapsToDestination: false — destination inferred from post keywords instead.
    subreddits: [{ name: 'pinoytraveller', mapsToDestination: false }],
    cityKeywords: ['manila', 'cebu'],
  },
  'Cambodia': {
    subreddits: [],
    cityKeywords: ['phnom penh', 'siem reap'],
  },
  'Laos': {
    subreddits: [],
    cityKeywords: ['vientiane', 'luang prabang'],
  },
  'Myanmar': {
    subreddits: [],
    cityKeywords: ['rangoon', 'mandalay'],
  },
  // ─── East Asia ────────────────────────────────────────────────────────────
  'Japan': {
    subreddits: [{ name: 'japantourism', mapsToDestination: true }],
    cityKeywords: ['tokyo', 'osaka', 'kyoto'],
  },
  'South Korea': {
    subreddits: [{ name: 'koreatravel', mapsToDestination: true }],
    cityKeywords: ['seoul', 'busan'],
  },
  // ─── Schengen ─────────────────────────────────────────────────────────────
  'Germany': {
    subreddits: [{ name: 'germanyexpats', mapsToDestination: true }],
    cityKeywords: ['berlin', 'munich', 'hamburg'],
  },
  'Portugal': {
    subreddits: [{ name: 'portugalexpats', mapsToDestination: true }],
    cityKeywords: ['lisbon', 'porto'],
  },
  'Spain': {
    subreddits: [],
    cityKeywords: ['barcelona', 'madrid', 'seville', 'valencia'],
  },
  'Netherlands': {
    subreddits: [],
    cityKeywords: ['amsterdam', 'rotterdam'],
  },
  'France': {
    subreddits: [],
    cityKeywords: ['paris', 'marseille', 'lyon'],
  },
  'Italy': {
    subreddits: [{ name: 'italytravel', mapsToDestination: true }],
    cityKeywords: ['rome', 'milan', 'florence', 'venice', 'naples'],
  },
  'Greece': {
    subreddits: [],
    cityKeywords: ['athens', 'thessaloniki', 'mykonos', 'santorini'],
  },
  'Czech Republic': {
    subreddits: [],
    cityKeywords: ['prague', 'brno'],
  },
  'Poland': {
    subreddits: [],
    cityKeywords: ['warsaw', 'krakow', 'wroclaw', 'gdansk'],
  },
  'Croatia': {
    subreddits: [],
    cityKeywords: ['zagreb', 'split', 'dubrovnik'],
  },
  'Hungary': {
    subreddits: [],
    cityKeywords: ['budapest'],
  },
  // ─── Middle East ──────────────────────────────────────────────────────────
  'United Arab Emirates': {
    subreddits: [{ name: 'dubai', mapsToDestination: true }],
    cityKeywords: [],  // 'dubai' and 'abu dhabi' already in aliases — auto-derived
  },
  'Turkey': {
    subreddits: [],
    cityKeywords: ['istanbul', 'ankara', 'izmir', 'antalya'],
  },
  // ─── South Asia ───────────────────────────────────────────────────────────
  'India': {
    subreddits: [{ name: 'indiatravel', mapsToDestination: true }],
    cityKeywords: ['delhi', 'mumbai', 'goa', 'bangalore', 'chennai'],
  },
  // ─── Caucasus ─────────────────────────────────────────────────────────────
  'Georgia': {
    subreddits: [],
    cityKeywords: ['tbilisi', 'batumi'],
  },
  // ─── Latin America ────────────────────────────────────────────────────────
  'Mexico': {
    subreddits: [],
    cityKeywords: ['cdmx', 'oaxaca', 'guadalajara', 'tulum'],
  },
  'Colombia': {
    subreddits: [],
    cityKeywords: ['medellin', 'bogota', 'cartagena', 'cali'],
  },
  'Argentina': {
    subreddits: [],
    cityKeywords: ['buenos aires'],
  },
  'Brazil': {
    subreddits: [],
    cityKeywords: ['sao paulo', 'rio de janeiro', 'florianopolis'],
  },
  'Peru': {
    subreddits: [],
    cityKeywords: ['lima', 'cusco'],
  },
  'Costa Rica': {
    subreddits: [{ name: 'costarica', mapsToDestination: true }],
    cityKeywords: ['san jose'],
  },
}

// Subreddits covering many destinations — always in the allowlist regardless of enabled destinations.
// NOTE: Do NOT add destination-specific subs here — put them in OVERRIDES above.
export const GENERAL_SUBREDDITS = [
  'digitalnomad', 'digitalnomadlife', 'expats', 'livingabroad',
  'travel', 'solotravel', 'backpacking', 'seabackpacking',
  'immigration', 'visas',
]

// ─── Derived exports — auto-update when destinations.ts or OVERRIDES change ──

export const SUBREDDIT_ALLOWLIST = new Set([
  ...GENERAL_SUBREDDITS,
  ...DESTINATIONS.flatMap(d =>
    (OVERRIDES[d.name]?.subreddits ?? []).map(s => s.name.toLowerCase())
  ),
])

export const SUBREDDIT_DESTINATION_MAP: Record<string, string> = Object.fromEntries(
  DESTINATIONS.flatMap(d =>
    (OVERRIDES[d.name]?.subreddits ?? [])
      .filter(s => s.mapsToDestination)
      .map(s => [s.name.toLowerCase(), d.name])
  )
)

// All supported destinations — used to route posts to NOISE when destination not covered.
export const SUPPORTED_DESTINATIONS = new Set(DESTINATIONS.map(d => d.name))

// Destination keyword pairs for post detection.
// Auto-derived from: destination name + readable aliases (2-3 char ISO codes excluded)
//                  + city keywords from OVERRIDES above.
// Short-form demonyms not in aliases are added manually at the bottom.
export const DESTINATION_KEYWORDS: [string, string][] = [
  // Auto-derived from destinations.ts + city overrides above
  ...DESTINATIONS.flatMap(d => [
    [d.name.toLowerCase(), d.name] as [string, string],
    ...d.aliases
      .filter(a => a.length > 3 && !/^[A-Z]{2,3}$/.test(a))  // exclude 2-3 char ISO codes (TH, VN, etc.)
      .map(a => [a.toLowerCase(), d.name] as [string, string]),
    ...(OVERRIDES[d.name]?.cityKeywords ?? [])
      .map(c => [c, d.name] as [string, string]),
  ]),
  // Short-form demonyms not in destination aliases — add here when needed
  ['thai', 'Thailand'],
  ['korean', 'South Korea'],
  // ─── Unsupported destinations — detected so posts route to NOISE ──────────
  // NOTE: These are NOT in destinations.ts — manually maintained here.
  // Add here when a popular destination starts generating noise in scan results.
  ['taiwan', 'Taiwan'], ['hong kong', 'Hong Kong'], ['macau', 'Macau'],
  ['united states', 'USA'], [' usa ', 'USA'], ['canada', 'Canada'],
  ['united kingdom', 'UK'], [' uk ', 'UK'], ['australia', 'Australia'],
  ['china', 'China'],
]
