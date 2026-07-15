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
// ==============

import { tavily } from '@tavily/core'
import * as fs from 'fs'
import * as path from 'path'

// Targeted queries — each searches reddit.com for recent visa discussions
const QUERIES = [
  'Thailand visa tourist extension border run question',
  'Vietnam visa e-visa entry requirements question',
  'Bali Indonesia tourist visa extension question',
  'Malaysia Philippines Cambodia visa question',
  'Japan Korea tourist visa requirements question',
  'digital nomad visa remote work question help',
  'border run visa run overstay question',
  'Schengen visa Germany Portugal Spain Netherlands question',
  'Mexico Colombia tourist visa long stay question',
  'visa on arrival extension overstay fine question',
]

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
  const header = `[r/${post.subreddit}]`
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
  const items = posts.map(p => formatPost(p, cat)).join('\n\n')
  return `── ${title} ${'─'.repeat(Math.max(0, 44 - title.length))}\n\n${items}`
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

  console.log(`Searching ${QUERIES.length} queries via Tavily (last ${DAYS_BACK} days)...\n`)

  for (let i = 0; i < QUERIES.length; i++) {
    const query = QUERIES[i]
    try {
      const response = await client.search(query, {
        maxResults: MAX_RESULTS_PER_QUERY,
        includeDomains: ['reddit.com'],
        days: DAYS_BACK,
        includeAnswer: false,
      })

      for (const r of response.results ?? []) {
        if (seen.has(r.url)) continue
        // Skip non-thread URLs (subreddit listings, profiles, etc.)
        if (!r.url.match(/reddit\.com\/r\/[^/]+\/comments\//)) continue
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

  const priority = results.filter(p => categorize(p) === 'priority')
  const worthLook = results.filter(p => categorize(p) === 'worthLook')
  const noise = results.filter(p => categorize(p) === 'noise')

  const header = [
    `=== VISA SCOUT — Reddit Opportunity Scan (Tavily) ===`,
    `Run: ${runTime}  ·  ${QUERIES.length} queries  ·  ${results.length} posts found  [Tavily / last ${DAYS_BACK}d]`,
    `Note: No comment count available — "ANSWER THESE" = unanswered question signal only.`,
  ].join('\n')

  let body: string
  if (results.length === 0) {
    body = `No matching posts found. Try increasing DAYS_BACK or adding queries.`
  } else {
    const sections = [
      renderSection('ANSWER THESE (questions with visa keywords)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
      renderSection('NOISE', noise, 'noise'),
    ].filter(Boolean)
    body = sections.join('\n\n')
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
