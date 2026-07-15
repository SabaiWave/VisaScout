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
const DAYS_BACK = 7           // how far back to search (Tavily days param)
const MAX_RESULTS_PER_QUERY = 10  // Tavily results per search query
// Tavily's `days` filter uses re-indexing date, not post creation date.
// Old posts that get new comments resurface as "recent". We filter on publishedDate
// when Tavily returns it. When publishedDate is null (common for Reddit), we move
// posts to a separate UNVERIFIED DATE section rather than mixing with dated results.
const SHOW_UNDATED_SECTION = true   // set false to drop undated posts entirely
// ==============

import { tavily } from '@tavily/core'
import * as fs from 'fs'
import * as path from 'path'

// Date cutoff for `after:` operator — computed at runtime
function getDateCutoff(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysBack)
  return d.toISOString().slice(0, 10)  // YYYY-MM-DD
}

// Targeted queries — `after:` operator tells Google to filter by indexed date.
// We don't use `includeDomains` here so the `site:` operator works in the query.
// Note: `after:` is a Google search operator; Tavily may or may not pass it through.
function buildQueries(afterDate: string): string[] {
  return [
    `site:reddit.com Thailand visa tourist extension border run question after:${afterDate}`,
    `site:reddit.com Vietnam visa e-visa entry requirements question after:${afterDate}`,
    `site:reddit.com Bali Indonesia tourist visa extension question after:${afterDate}`,
    `site:reddit.com Malaysia Philippines Cambodia visa question after:${afterDate}`,
    `site:reddit.com Japan Korea tourist visa requirements question after:${afterDate}`,
    `site:reddit.com digital nomad visa remote work question help after:${afterDate}`,
    `site:reddit.com border run visa run overstay question after:${afterDate}`,
    `site:reddit.com Schengen visa Germany Portugal Spain Netherlands question after:${afterDate}`,
    `site:reddit.com Mexico Colombia tourist visa long stay question after:${afterDate}`,
    `site:reddit.com visa on arrival extension overstay fine question after:${afterDate}`,
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
  // Date from Tavily publishedDate (confirmed) or Reddit ID estimate (~estimated).
  // null = couldn't determine either way.
  estimatedDate: Date | null
  dateIsEstimated: boolean
}

// Reddit post ID calibration — derived from confirmed data points:
// Post 1cqrtt2 confirmed ~2 years old on 2026-07-16 → reference date 2024-07-16
// Post 1uw24qd appeared in after:2026-07-08 search with very high ID → anchor for rate
const REDDIT_CALIBRATION = {
  refIdInt: parseInt('1cqrtt2', 36),   // 2,947,343,806
  refDate: new Date('2024-07-16'),      // confirmed creation date (approximate)
  ratePerDay: 1_501_053,               // IDs created per day (site-wide estimate)
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
  // No comment count from Tavily — categorize by question + keyword signal only
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
  const header = `[r/${post.subreddit}${dateTag}]`
  const title = `"${post.title}"`
  const lines = [header, title]
  if (cat === 'priority') {
    const preview = bodyPreview(post.body)
    if (preview) lines.push(preview)
  }
  lines.push(`→ ${post.url}`)
  return lines.join('\n')
}

function renderSection(title: string, posts: Post[], cat: Category): string {
  if (posts.length === 0) return ''
  const label = `── ${title} [${posts.length}] `
  const divider = '─'.repeat(Math.max(0, 52 - label.length))
  const items = posts.map((p, i) => `${i + 1}. ${formatPost(p, cat)}`).join('\n\n')
  return `${label}${divider}\n\n${items}`
}

async function main() {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.error('TAVILY_API_KEY not set. Run via: bash scripts/run.sh scripts/scan-reddit-tavily.ts')
    process.exit(1)
  }

  const client = tavily({ apiKey })
  const seen = new Set<string>()
  const results: Post[] = []

  const afterDate = getDateCutoff(DAYS_BACK)
  const QUERIES = buildQueries(afterDate)

  console.log(`Searching ${QUERIES.length} queries via Tavily (last ${DAYS_BACK} days, after:${afterDate})...\n`)

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i]
    try {
      const response = await client.search(query, {
        maxResults: MAX_RESULTS_PER_QUERY,
        // No includeDomains — site:reddit.com is in the query string.
        // No days — conflicts with after: operator parsed from query string.
        includeAnswer: false,
      })

      for (const r of response.results ?? []) {
        if (seen.has(r.url)) continue
        // Skip non-thread URLs (subreddit listings, profiles, etc.)
        if (!r.url.match(/reddit\.com\/r\/[^/]+\/comments\//)) continue

        // Filter by actual published date — Tavily's `days` param uses indexing date,
        // not post creation date. Old posts that get re-commented resurface as "recent".
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDate: string | undefined = (r as any).publishedDate ?? (r as any).published_date
        // Determine date: Tavily publishedDate (confirmed) or Reddit ID estimate
        const tavilyDate = parsePublishedDate(rawDate)
        const idEstimate = tavilyDate ? null : estimateDateFromRedditId(r.url)
        const estimatedDate: Date | null = tavilyDate ?? idEstimate?.date ?? null
        const dateIsEstimated = !tavilyDate && !!idEstimate

        // Drop posts with a known/estimated date that's too old
        if (estimatedDate !== null && !isWithinDays(estimatedDate, DAYS_BACK)) continue

        seen.add(r.url)

        const title = r.title ?? ''
        const body = r.content ?? ''
        const searchText = `${title} ${body}`
        const matched = matchKeywords(searchText)

        results.push({
          url: r.url,
          subreddit: extractSubreddit(r.url),
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
      console.warn(`⚠ Query failed, skipping: "${query}" — ${(err as Error).message}`)
    }
  }

  process.stdout.write('\n')

  const runTime = new Date().toLocaleString('en-US', { hour12: false })

  // Split: posts with known/estimated date vs truly undatable (short ID, parse failure)
  const dated = results.filter(p => p.estimatedDate !== null)
  const undated = results.filter(p => p.estimatedDate === null)
  const estimatedCount = dated.filter(p => p.dateIsEstimated).length
  const confirmedCount = dated.length - estimatedCount

  const priority = dated.filter(p => categorize(p) === 'priority')
  const worthLook = dated.filter(p => categorize(p) === 'worthLook')
  const noise = dated.filter(p => categorize(p) === 'noise')

  const dateLine = confirmedCount > 0
    ? `${confirmedCount} confirmed + ${estimatedCount} ID-estimated (last ${DAYS_BACK}d)`
    : `${estimatedCount} ID-estimated (last ${DAYS_BACK}d)`

  const totalActionable = priority.length + worthLook.length
  const header = [
    `=== VISA SCOUT — Reddit Opportunity Scan (Tavily) ===`,
    `Run: ${runTime}  ·  ${QUERIES.length} queries  ·  ${dated.length} posts ${dateLine}  ·  ${undated.length} undated`,
    `Actionable: ${totalActionable} (${priority.length} answer these · ${worthLook.length} worth a look · ${noise.length} noise)`,
    `Note: ~YYYY-MM-DD = date estimated from Reddit post ID (±2 days). No comment count available.`,
  ].join('\n')

  let body: string
  if (dated.length === 0 && undated.length === 0) {
    body = `No matching posts found. Try increasing DAYS_BACK or adding queries.`
  } else {
    const sections = [
      renderSection('ANSWER THESE (questions with visa keywords)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
      renderSection('NOISE', noise, 'noise'),
    ]
    if (SHOW_UNDATED_SECTION && undated.length > 0) {
      sections.push(renderSection(
        `UNVERIFIED DATE (${undated.length} posts — very old or unparseable ID)`,
        undated,
        'worthLook'
      ))
    }
    body = sections.filter(Boolean).join('\n\n')
  }

  const output = [
    header,
    body,
    '──────────────────────────────────────────\nDone. Pick your threads and answer manually.',
  ].join('\n\n')

  console.log('\n' + output)

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
