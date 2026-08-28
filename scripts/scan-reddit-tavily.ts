// Tavily-based Reddit visa scanner — alternative to scan-reddit.ts
// No Reddit credentials needed. Uses TAVILY_API_KEY from .env.local via scripts/run.sh.
//
// Tradeoff vs scan-reddit.ts:
//   + No OAuth setup required
//   - No comment count → can't detect truly unanswered posts
//   - Search-ranked results, not strictly chronological
//
// Run: bash scripts/run.sh scripts/scan-reddit-tavily.ts
//
// ─── ADDING A DESTINATION ───────────────────────────────────────────────────
// 1. src/config/destinations.ts — add the destination config entry
// 2. scripts/scan-config.ts     — add subreddits + city keywords for that destination
// 3. buildQueries() below       — add at least one targeted Tavily query
// ────────────────────────────────────────────────────────────────────────────

import {
  SUBREDDIT_ALLOWLIST,
  SUBREDDIT_DESTINATION_MAP,
  SUPPORTED_DESTINATIONS,
  DESTINATION_KEYWORDS,
} from './scan-config'
import { tavily } from '@tavily/core'
import * as fs from 'fs'
import * as path from 'path'

// === CONFIG ===
const DAYS_BACK = 7               // how far back to search (Tavily re-index window)
const MAX_POST_AGE_DAYS = 45      // drop posts older than this (ID-estimated) — tighter = fresher leads
const MAX_RESULTS_PER_QUERY = 20  // Tavily results per search query
const TAVILY_COST_PER_SEARCH = 0.005  // USD per query (estimate — verify at tavily.com/pricing)
// Tavily's `days` filter uses re-indexing date, not post creation date.
// Old posts that get new comments resurface as "recent". We filter on publishedDate
// when Tavily returns it. When publishedDate is null (common for Reddit), we move
// posts to a separate UNVERIFIED DATE section rather than mixing with dated results.
const SHOW_UNDATED_SECTION = true  // set false to drop undated posts entirely

// SUBREDDIT_ALLOWLIST, SUBREDDIT_DESTINATION_MAP, SUPPORTED_DESTINATIONS, DESTINATION_KEYWORDS
// are all derived from src/config/destinations.ts + scripts/scan-config.ts — imported above.
// Do not hardcode destination lists here.

// Signals that indicate applying for a visa from home (not in-country management).
// These posts are lower GTM priority — VisaScout's pitch is in-country visa intelligence.
// Posts matching these get bucketed as APPLICATION POSTS, not ANSWER THESE.
const HOME_APPLICATION_SIGNALS = [
  'vfs', 'embassy appointment', 'consulate appointment',
  'applying for visa', 'applied for visa', 'visa application',
  'visa applicant', 'visa granted', 'visa approved',
  'application approved', 'application rejected', 'application denied',
  'granted se', 'granted me', 'single entry instead', 'multiple entry instead',
  'how to apply for', 'document requirements', 'required documents',
  'appointment slot', 'application form',
  'f1 visa', 'h1b', 'h-1b', 'student visa application', 'work visa application',
]

// Signals that indicate a guide/listicle/content marketing post, not a genuine question.
// These show up on r/digitalnomadlife etc. as SEO content — not GTM opportunities.
const CONTENT_POST_SIGNALS = [
  'beginner guide', 'complete guide', 'ultimate guide', 'complete beginner',
  'how to start', 'how to become', 'everything you need to know',
  'things i wish i knew', 'things you need to know', 'tips for beginners',
  'step by step', 'comprehensive guide', '2026 guide', 'guide 2026',
]
// ==============

const SEEN_POSTS_FILE = path.join(process.cwd(), 'outputs', 'scans', 'seen-posts.json')

function loadSeenPosts(): Set<string> {
  try {
    if (!fs.existsSync(SEEN_POSTS_FILE)) return new Set()
    const data = JSON.parse(fs.readFileSync(SEEN_POSTS_FILE, 'utf-8'))
    return new Set<string>(data.urls ?? [])
  } catch { return new Set() }
}

function saveSeenPosts(existing: Set<string>, newUrls: string[]): void {
  const all = [...new Set([...existing, ...newUrls])]
  fs.writeFileSync(SEEN_POSTS_FILE, JSON.stringify({ urls: all }, null, 2), 'utf-8')
}

function buildQueries(): string[] {
  // No `after:` date operator — it's a Google operator that Tavily may not pass through.
  // Date filtering is handled by Tavily's `days` param + our ID-based estimation filter.
  // NOTE: When adding a destination to src/config/destinations.ts, add at least one
  //       broad query here and a subreddit-targeted query if a good sub exists.
  return [
    // === SEA — broad destination queries ===
    `site:reddit.com Thailand visa tourist extension border run question`,
    `site:reddit.com Vietnam visa e-visa entry requirements question`,
    `site:reddit.com Indonesia Bali tourist visa extension VOA question`,
    `site:reddit.com Malaysia visa tourist entry requirements question`,
    `site:reddit.com Philippines visa tourist entry requirements question`,
    `site:reddit.com Cambodia Laos Myanmar tourist visa entry question`,
    `site:reddit.com Singapore visa entry requirements question`,
    // === East Asia ===
    `site:reddit.com Japan tourist visa requirements question`,
    `site:reddit.com Korea tourist visa requirements question`,
    // === Europe — Schengen ===
    `site:reddit.com Schengen visa 90 day rule Germany question`,
    `site:reddit.com Portugal D7 visa digital nomad NHR question`,
    `site:reddit.com Spain Netherlands France tourist visa question`,
    `site:reddit.com Italy visa long stay elective residency question`,
    `site:reddit.com Greece digital nomad visa golden visa question`,
    `site:reddit.com Czech Republic Prague visa residence permit question`,
    `site:reddit.com Poland Krakow Warsaw visa residence permit question`,
    `site:reddit.com Croatia digital nomad visa Schengen question`,
    `site:reddit.com Hungary Budapest digital nomad white card visa question`,
    // === Middle East ===
    `site:reddit.com Dubai UAE visa residence golden visa freelancer question`,
    `site:reddit.com Turkey Istanbul visa residence permit e-visa question`,
    // === South Asia ===
    `site:reddit.com India visa e-tourist long stay entry requirements question`,
    // === Caucasus ===
    `site:reddit.com Georgia Tbilisi visa free 365 days residence question`,
    // === Latin America ===
    `site:reddit.com Mexico Colombia tourist visa long stay question`,
    `site:reddit.com Argentina Buenos Aires visa rentista long stay question`,
    `site:reddit.com Brazil digital nomad visa VITEM entry requirements question`,
    `site:reddit.com Peru Lima visa tourist entry requirements question`,
    `site:reddit.com Costa Rica rentista pensionado visa long stay question`,
    // === Cross-destination / nomad themes ===
    `site:reddit.com digital nomad visa remote work question help`,
    `site:reddit.com border run visa run overstay question`,
    `site:reddit.com visa on arrival extension overstay fine question`,
    // === Subreddit-targeted — tourism/expat subs only, dedicated result pool ===
    `site:reddit.com/r/ThailandTourism visa extension border run`,
    `site:reddit.com/r/ThailandExpats visa LTR retirement extension`,
    `site:reddit.com/r/digitalnomad visa question`,
    `site:reddit.com/r/digitalnomadlife visa entry question`,
    `site:reddit.com/r/bali visa extension VOA question`,
    `site:reddit.com/r/SEABackpacking visa entry question`,
    `site:reddit.com/r/expats visa long stay digital nomad`,
    `site:reddit.com/r/travel visa question entry requirements`,
    `site:reddit.com/r/VietnamTourism visa entry question`,
    `site:reddit.com/r/PinoyTraveller visa stay extension`,
    `site:reddit.com/r/JapanTourism visa requirements question`,
    `site:reddit.com/r/PortugalExpats D7 visa digital nomad question`,
    `site:reddit.com/r/GermanyExpats visa long stay question`,
    `site:reddit.com/r/ItalyTravel visa long stay residency question`,
    `site:reddit.com/r/dubai visa residency golden visa freelancer question`,
    `site:reddit.com/r/indiatravel visa e-tourist entry question`,
    `site:reddit.com/r/costarica visa rentista pensionado long stay question`,
  ]
}

const KEYWORDS = [
  // Generic
  'visa', 'overstay', 'border run', 'visa run', 'tourist visa', 'visa extension',
  'entry requirements', 'immigration', 'work permit', 'multiple entry',
  'e-visa', 'visa on arrival', 'VOA', 'visa free', 'overstay fine',
  'visa exemption', 're-entry permit', 'entry ban', 'blacklist',
  'proof of funds', 'onward ticket', 'immigration officer',
  // Duration markers
  '90 day', '90-day rule', '180 day', '30 day', '60 day',
  // Nomad / long-stay
  'digital nomad visa', 'nomad visa', 'remote work visa', 'LTR visa', 'retirement visa',
  // Destination-specific
  'METV', 'STV', 'schengen', 'D7 visa', 'NHR', 'golden visa',
]

const QUESTION_STARTERS = [
  'how', 'can i', 'can we', 'should i', 'does', 'do i', 'is it', 'is there',
  'anyone', 'what is', 'what are', 'which', 'when', 'where can', 'has anyone',
  'advice', 'help', 'thinking about', 'planning to', 'looking for',
  'wondering', 'need help', 'want to', 'trying to', 'confused about',
  'question about', 'need advice',
]

interface Post {
  url: string
  subreddit: string
  destination: string | null
  title: string
  body: string
  matchedKeywords: string[]
  isQuestion: boolean
  isHomeApplication: boolean
  isContentPost: boolean
  estimatedDate: Date | null
  dateIsEstimated: boolean
}

// Reddit post ID calibration — derived from confirmed data points:
// Post 1cqrtt2 confirmed ~2 years old on 2026-07-16 → reference date 2024-07-16
// Post 1uw24qd appeared in after:2026-07-08 search with very high ID → anchor for rate
const REDDIT_CALIBRATION = {
  refIdInt: parseInt('1cqrtt2', 36),
  refDate: new Date('2024-07-16'),
  ratePerDay: 1_501_053,
}

function estimateDateFromRedditId(url: string): { date: Date; estimated: boolean } | null {
  const idMatch = url.match(/reddit\.com\/r\/[^/]+\/comments\/([a-z0-9]+)\//i)
  if (!idMatch) return null
  const idInt = parseInt(idMatch[1], 36)
  if (isNaN(idInt)) return null
  const { refIdInt, refDate, ratePerDay } = REDDIT_CALIBRATION
  const diffDays = (idInt - refIdInt) / ratePerDay
  const estimated = new Date(refDate.getTime() + diffDays * 24 * 60 * 60 * 1000)
  return { date: estimated, estimated: true }
}

function parsePublishedDate(raw: string | undefined | null): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function isWithinDays(date: Date | null, days: number): boolean {
  if (!date) return false
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return date >= cutoff
}

function formatDate(date: Date, estimated: boolean): string {
  const iso = date.toISOString().slice(0, 10)
  return estimated ? `~${iso}` : iso
}

type Category = 'priority' | 'worthLook' | 'homeApp' | 'noise'

function extractSubreddit(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^/]+)/)
  return match ? match[1] : 'unknown'
}

function detectDestination(subreddit: string, title: string, body: string): string | null {
  const fromSub = SUBREDDIT_DESTINATION_MAP[subreddit.toLowerCase()]
  if (fromSub) return fromSub
  const text = `${title} ${body}`.toLowerCase()
  for (const [kw, dest] of DESTINATION_KEYWORDS) {
    if (text.includes(kw)) return dest
  }
  return null
}

function matchKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()))
}

function detectQuestion(title: string): boolean {
  const lower = title.toLowerCase().trim()
  if (lower.includes('?')) return true
  return QUESTION_STARTERS.some(w => lower.startsWith(w) || lower.includes(` ${w} `))
}

function detectHomeApplication(title: string, body: string): boolean {
  const text = `${title} ${body.slice(0, 300)}`.toLowerCase()
  return HOME_APPLICATION_SIGNALS.some(s => text.includes(s))
}

function detectContentPost(title: string): boolean {
  const lower = title.toLowerCase()
  return CONTENT_POST_SIGNALS.some(s => lower.includes(s))
}

function categorize(post: Post): Category {
  if (post.isContentPost) return 'noise'
  // Detected destination is unsupported → VisaScout can't help, skip
  if (post.destination && !SUPPORTED_DESTINATIONS.has(post.destination)) return 'noise'
  if (post.isHomeApplication) return 'homeApp'
  if (post.isQuestion && post.matchedKeywords.length > 0) return 'priority'
  if (post.isQuestion || post.matchedKeywords.length > 0) return 'worthLook'
  return 'noise'
}

function bodyPreview(body: string, maxChars = 120): string {
  const cleaned = body.replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length < 20) return ''
  return cleaned.length <= maxChars ? cleaned : cleaned.slice(0, maxChars).trimEnd() + '…'
}

function formatPost(post: Post, cat: Category): string {
  const dateTag = post.estimatedDate
    ? ` · ${formatDate(post.estimatedDate, post.dateIsEstimated)}`
    : ''
  const destTag = post.destination ? ` · ${post.destination}` : ''
  const kwTag = post.matchedKeywords.length > 0 ? ` · [${post.matchedKeywords.slice(0, 3).join(', ')}]` : ''
  const header = `[r/${post.subreddit}${dateTag}${destTag}${kwTag}]`
  const title = `"${post.title}"`
  const lines = [header, title]
  if (cat === 'priority') {
    const preview = bodyPreview(post.body)
    if (preview) lines.push(preview)
  }
  lines.push(`→ ${post.url}`)
  return lines.join('\n')
}

const LINE = '─'.repeat(62)
const HEAVY = '═'.repeat(62)

function renderSection(title: string, posts: Post[], cat: Category): string {
  if (posts.length === 0) return ''
  const label = `  ${title}`
  const count = `[${posts.length}]`
  const pad = Math.max(0, 60 - label.length - count.length)
  const heading = `${LINE}\n${label}  ${' '.repeat(pad)}${count}\n${LINE}`
  const items = posts.map((p, i) => `${i + 1}. ${formatPost(p, cat)}`).join('\n\n')
  return `${heading}\n\n${items}`
}

function topEntries(map: Map<string, number>, n: number): string {
  return [...map.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k} (${v})`)
    .join('  ·  ')
}

async function main() {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.error('TAVILY_API_KEY not set. Run via: bash scripts/run.sh scripts/scan-reddit-tavily.ts')
    process.exit(1)
  }

  const seenPosts = loadSeenPosts()
  const startMs = Date.now()
  const client = tavily({ apiKey })
  const seen = new Set<string>()
  const results: Post[] = []

  // Funnel counters
  let rawCount = 0
  let dupeCount = 0
  let nonThreadCount = 0
  let tooOldCount = 0
  let wrongSubCount = 0
  let alreadySeenCount = 0

  // Breakdown maps
  const subredditMap = new Map<string, number>()
  const keywordMap = new Map<string, number>()
  const destinationMap = new Map<string, number>()

  const QUERIES = buildQueries()

  console.log(`Scanning ${QUERIES.length} queries via Tavily (last ${DAYS_BACK}d)...`)

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i]
    try {
      const response = await client.search(query, {
        maxResults: MAX_RESULTS_PER_QUERY,
        days: DAYS_BACK,
        includeAnswer: false,
      })

      for (const r of response.results ?? []) {
        rawCount++

        if (seen.has(r.url)) { dupeCount++; continue }
        if (!r.url.match(/reddit\.com\/r\/[^/]+\/comments\//)) { nonThreadCount++; continue }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDate: string | undefined = (r as any).publishedDate ?? (r as any).published_date
        const tavilyDate = parsePublishedDate(rawDate)
        const idEstimate = tavilyDate ? null : estimateDateFromRedditId(r.url)
        const estimatedDate: Date | null = tavilyDate ?? idEstimate?.date ?? null
        const dateIsEstimated = !tavilyDate && !!idEstimate
        // Age filter — Tavily `days` re-indexes old posts when they get new comments.
        // MAX_POST_AGE_DAYS tighter than 90d → fresher GTM leads, fewer stale threads.
        if (estimatedDate !== null && !isWithinDays(estimatedDate, MAX_POST_AGE_DAYS)) { tooOldCount++; continue }

        const sub = extractSubreddit(r.url)
        if (!SUBREDDIT_ALLOWLIST.has(sub.toLowerCase())) { wrongSubCount++; continue }

        if (seenPosts.has(r.url)) { alreadySeenCount++; continue }

        seen.add(r.url)

        const title = r.title ?? ''
        const body = r.content ?? ''
        const searchText = `${title} ${body}`
        const matched = matchKeywords(searchText)
        const destination = detectDestination(sub, title, body)

        subredditMap.set(sub, (subredditMap.get(sub) ?? 0) + 1)
        if (destination) destinationMap.set(destination, (destinationMap.get(destination) ?? 0) + 1)
        for (const kw of matched) {
          keywordMap.set(kw, (keywordMap.get(kw) ?? 0) + 1)
        }

        results.push({
          url: r.url,
          subreddit: sub,
          destination,
          title,
          body,
          matchedKeywords: matched,
          isQuestion: detectQuestion(title),
          isHomeApplication: detectHomeApplication(title, body),
          isContentPost: detectContentPost(title),
          estimatedDate,
          dateIsEstimated,
        })
      }
      process.stdout.write('.')
    } catch (err) {
      process.stdout.write('\n')
      console.warn(`  ⚠ Query ${i + 1} failed: ${(err as Error).message}`)
    }
  }

  process.stdout.write('\n\n')

  const durationMs = Date.now() - startMs
  const durationSec = (durationMs / 1000).toFixed(1)
  const costEst = (QUERIES.length * TAVILY_COST_PER_SEARCH).toFixed(3)

  const runTime = new Date().toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })

  const dated = results.filter(p => p.estimatedDate !== null)
  const undated = results.filter(p => p.estimatedDate === null)
  const confirmedCount = dated.filter(p => !p.dateIsEstimated).length
  const estimatedCount = dated.filter(p => p.dateIsEstimated).length

  const byDateDesc = (a: Post, b: Post) =>
    (b.estimatedDate?.getTime() ?? 0) - (a.estimatedDate?.getTime() ?? 0)

  const priority = dated.filter(p => categorize(p) === 'priority').sort(byDateDesc)
  const worthLook = dated.filter(p => categorize(p) === 'worthLook').sort(byDateDesc)
  const homeApp = dated.filter(p => categorize(p) === 'homeApp').sort(byDateDesc)
  const noise = dated.filter(p => categorize(p) === 'noise').sort(byDateDesc)
  const totalActionable = priority.length + worthLook.length
  const keptCount = results.length

  const topSubs = topEntries(subredditMap, 8)
  const topKws = topEntries(keywordMap, 6)
  const topDests = topEntries(destinationMap, 8)

  const header = [
    HEAVY,
    `  VISA SCOUT — Reddit Opportunity Scan (Tavily)`,
    HEAVY,
    ``,
    `  Run       ${runTime}`,
    `  Period    Last ${DAYS_BACK} days  ·  Max post age ${MAX_POST_AGE_DAYS}d`,
    `  Duration  ${durationSec}s   Cost ~$${costEst} (${QUERIES.length} queries × $${TAVILY_COST_PER_SEARCH})`,
    ``,
    `  Funnel    ${rawCount} raw  →  ${keptCount} kept`,
    `            (${dupeCount} dupes  ·  ${nonThreadCount} non-thread  ·  ${tooOldCount} >45d old  ·  ${wrongSubCount} off-topic sub  ·  ${alreadySeenCount} already seen)`,
    `  Results   ${dated.length} dated (${confirmedCount} confirmed · ${estimatedCount} ID-estimated)  ·  ${undated.length} undated`,
    ``,
    `  Actionable  ${totalActionable}  (${priority.length} answer these · ${worthLook.length} worth a look · ${homeApp.length} applications · ${noise.length} noise)`,
    HEAVY,
  ].join('\n')

  let body: string
  if (dated.length === 0 && undated.length === 0) {
    body = `  No matching posts found. Try increasing DAYS_BACK or expanding queries.`
  } else {
    const sections = [
      renderSection('ANSWER THESE  (in-country visa questions)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
      renderSection('APPLICATION POSTS  (applying from home — lower GTM priority)', homeApp, 'homeApp'),
      renderSection('NOISE', noise, 'noise'),
    ]
    if (SHOW_UNDATED_SECTION && undated.length > 0) {
      sections.push(renderSection(
        `UNVERIFIED DATE  (very old or unparseable ID)`,
        undated,
        'worthLook'
      ))
    }
    body = sections.filter(Boolean).join('\n\n')
  }

  // Mark actionable posts as seen so future runs skip them
  const actionableUrls = [...priority, ...worthLook].map(p => p.url)
  if (actionableUrls.length > 0) saveSeenPosts(seenPosts, actionableUrls)

  const statsFooter = [
    LINE,
    `  STATS`,
    LINE,
    topSubs  ? `  Subreddits    ${topSubs}`    : `  Subreddits    (none with results)`,
    topDests ? `  Destinations  ${topDests}`   : `  Destinations  (none detected)`,
    topKws   ? `  Keywords      ${topKws}`     : `  Keywords      (no matches)`,
    ``,
    `  Note: ~YYYY-MM-DD = date estimated from Reddit post ID (±2 days).`,
    `        Cost estimate uses $${TAVILY_COST_PER_SEARCH}/query — verify at tavily.com/pricing.`,
    `        Actionable posts written to outputs/scans/seen-posts.json (delete to reset).`,
    HEAVY,
    `  Done. Review threads above and respond manually.`,
    HEAVY,
  ].join('\n')

  const output = [header, body, statsFooter].join('\n\n')

  console.log(output)

  const outputDir = path.join(process.cwd(), 'outputs', 'scans')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('')
  const filename = `reddit-scan-tavily-${stamp}.md`
  fs.writeFileSync(
    path.join(outputDir, filename),
    ['```', output, '```'].join('\n'),
    'utf-8'
  )
  console.log(`\nSaved → outputs/scans/${filename}`)
}

main()
