// Tavily-based Reddit visa scanner — alternative to scan-reddit.ts
// No Reddit credentials needed. Uses TAVILY_API_KEY from .env.local via scripts/run.sh.
//
// Tradeoff vs scan-reddit.ts:
//   + No OAuth setup required
//   - No comment count → can't detect truly unanswered posts
//   - Search-ranked results, not strictly chronological
//
// Run: bash scripts/run.sh scripts/scan-reddit-tavily.ts

// === CONFIG ===
const DAYS_BACK = 7               // how far back to search (Tavily re-index window)
const MAX_RESULTS_PER_QUERY = 20  // Tavily results per search query
const TAVILY_COST_PER_SEARCH = 0.005  // USD per query (estimate — verify at tavily.com/pricing)
// Tavily's `days` filter uses re-indexing date, not post creation date.
// Old posts that get new comments resurface as "recent". We filter on publishedDate
// when Tavily returns it. When publishedDate is null (common for Reddit), we move
// posts to a separate UNVERIFIED DATE section rather than mixing with dated results.
const SHOW_UNDATED_SECTION = true  // set false to drop undated posts entirely
// ==============

import { tavily } from '@tavily/core'
import * as fs from 'fs'
import * as path from 'path'

function buildQueries(): string[] {
  // No `after:` date operator — it's a Google operator that Tavily may not pass through.
  // Date filtering is handled by Tavily's `days` param + our ID-based estimation filter.
  return [
    // Broad topic queries
    `site:reddit.com Thailand visa tourist extension border run question`,
    `site:reddit.com Vietnam visa e-visa entry requirements question`,
    `site:reddit.com Bali Indonesia tourist visa extension question`,
    `site:reddit.com Malaysia Philippines Cambodia visa question`,
    `site:reddit.com Japan Korea tourist visa requirements question`,
    `site:reddit.com digital nomad visa remote work question help`,
    `site:reddit.com border run visa run overstay question`,
    `site:reddit.com Schengen visa Germany Portugal Spain Netherlands question`,
    `site:reddit.com Mexico Colombia tourist visa long stay question`,
    `site:reddit.com visa on arrival extension overstay fine question`,
    // Subreddit-targeted queries — higher signal, less noise
    `site:reddit.com/r/ThailandTourism visa extension border run`,
    `site:reddit.com/r/digitalnomad visa question Southeast Asia`,
    `site:reddit.com/r/bali visa extension VOA question`,
    `site:reddit.com/r/SEABackpacking visa entry question`,
    `site:reddit.com/r/expats visa long stay digital nomad`,
  ]
}

const KEYWORDS = [
  'visa', 'overstay', 'border run', 'visa run', 'METV', 'tourist visa',
  'visa extension', 'immigration', 'work permit', 'entry requirements',
  'digital nomad visa', 'nomad visa', 'remote work visa',
  'e-visa', 'visa on arrival', 'VOA', 'schengen', 'multiple entry',
  'visa free', 'overstay fine', '90 day', '180 day', '30 day',
]

const QUESTION_STARTERS = [
  'how', 'can i', 'can we', 'should i', 'does', 'do i', 'is it', 'is there',
  'anyone', 'what is', 'what are', 'which', 'when', 'where can', 'has anyone',
  'advice', 'help',
]

interface Post {
  url: string
  subreddit: string
  title: string
  body: string
  matchedKeywords: string[]
  isQuestion: boolean
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

type Category = 'priority' | 'worthLook' | 'noise'

function extractSubreddit(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^/]+)/)
  return match ? match[1] : 'unknown'
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

function categorize(post: Post): Category {
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
  const kwTag = post.matchedKeywords.length > 0 ? ` · [${post.matchedKeywords.slice(0, 3).join(', ')}]` : ''
  const header = `[r/${post.subreddit}${dateTag}${kwTag}]`
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

  const startMs = Date.now()
  const client = tavily({ apiKey })
  const seen = new Set<string>()
  const results: Post[] = []

  // Funnel counters
  let rawCount = 0
  let dupeCount = 0
  let nonThreadCount = 0
  let tooOldCount = 0

  // Breakdown maps
  const subredditMap = new Map<string, number>()
  const keywordMap = new Map<string, number>()

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
        // 90-day ID filter — Tavily `days` re-indexes old posts when they get new comments.
        // Without this, 2022 posts resurface and pollute results. Posts with no estimable
        // date (null) pass through to the undated section rather than being dropped.
        if (estimatedDate !== null && !isWithinDays(estimatedDate, 90)) { tooOldCount++; continue }

        seen.add(r.url)

        const title = r.title ?? ''
        const body = r.content ?? ''
        const searchText = `${title} ${body}`
        const matched = matchKeywords(searchText)
        const sub = extractSubreddit(r.url)

        subredditMap.set(sub, (subredditMap.get(sub) ?? 0) + 1)
        for (const kw of matched) {
          keywordMap.set(kw, (keywordMap.get(kw) ?? 0) + 1)
        }

        results.push({
          url: r.url,
          subreddit: sub,
          title,
          body,
          matchedKeywords: matched,
          isQuestion: detectQuestion(title),
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
  const noise = dated.filter(p => categorize(p) === 'noise').sort(byDateDesc)
  const totalActionable = priority.length + worthLook.length
  const keptCount = results.length

  const topSubs = topEntries(subredditMap, 8)
  const topKws = topEntries(keywordMap, 6)

  const header = [
    HEAVY,
    `  VISA SCOUT — Reddit Opportunity Scan (Tavily)`,
    HEAVY,
    ``,
    `  Run       ${runTime}`,
    `  Period    Last ${DAYS_BACK} days`,
    `  Duration  ${durationSec}s   Cost ~$${costEst} (${QUERIES.length} queries × $${TAVILY_COST_PER_SEARCH})`,
    ``,
    `  Funnel    ${rawCount} raw  →  ${keptCount} kept`,
    `            (${dupeCount} dupes  ·  ${nonThreadCount} non-thread  ·  ${tooOldCount} >90d old)`,
    `  Results   ${dated.length} dated (${confirmedCount} confirmed · ${estimatedCount} ID-estimated)  ·  ${undated.length} undated`,
    ``,
    `  Actionable  ${totalActionable}  (${priority.length} answer these · ${worthLook.length} worth a look · ${noise.length} noise)`,
    HEAVY,
  ].join('\n')

  let body: string
  if (dated.length === 0 && undated.length === 0) {
    body = `  No matching posts found. Try increasing DAYS_BACK or expanding queries.`
  } else {
    const sections = [
      renderSection('ANSWER THESE  (unanswered questions)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
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

  const statsFooter = [
    LINE,
    `  STATS`,
    LINE,
    topSubs ? `  Subreddits  ${topSubs}` : `  Subreddits  (none with results)`,
    topKws   ? `  Keywords    ${topKws}`   : `  Keywords    (no matches)`,
    ``,
    `  Note: ~YYYY-MM-DD = date estimated from Reddit post ID (±2 days).`,
    `        Cost estimate uses $${TAVILY_COST_PER_SEARCH}/query — verify at tavily.com/pricing.`,
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
