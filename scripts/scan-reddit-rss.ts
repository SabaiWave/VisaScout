// Reddit RSS scanner — no auth, no OAuth, no Tavily. Uses public /new/.rss feeds.
// Post creation timestamps come from <published> in the Atom feed — reliable date filter.
//
// Run: bash scripts/run.sh scripts/scan-reddit-rss.ts

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'

// === CONFIG ===
const DAYS_BACK = 7             // filter posts older than this
const DELAY_MS = 800            // delay between Reddit requests (rate limit courtesy)
const MAX_RETRIES = 2           // retry failed requests once
// ==============

const SUBREDDITS = [
  'ThailandTourism',
  'ThailandExpats',
  'digitalnomad',
  'SEABackpacking',
  'visas',
  'expats',
  'bali',
  'Vietnam',
  'Cambodia',
  'Philippines_Expats',
  'japanresidents',
  'malaysia',
  'indonesia',
  'portugal',
  'germany',
  'netherlands',
  'AmerExit',
  'digitalnomadEurope',
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
  publishedDate: Date
  matchedKeywords: string[]
  isQuestion: boolean
}

type Category = 'priority' | 'worthLook' | 'noise'

// ── Atom XML parsing ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : null
}

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*>`))
  return match ? match[1] : null
}

function parseAtomFeed(xml: string, subreddit: string): Post[] {
  const posts: Post[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAYS_BACK)

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]

    // Creation date: <published> preferred, <updated> fallback
    const pubRaw = extractTag(entry, 'published') ?? extractTag(entry, 'updated')
    if (!pubRaw) continue
    const publishedDate = new Date(pubRaw)
    if (isNaN(publishedDate.getTime())) continue
    if (publishedDate < cutoff) continue  // post is too old

    // Post URL: <link rel="alternate" href="...">
    const url = extractAttr(entry, 'link', 'href')
    if (!url || !url.includes('/comments/')) continue

    const titleRaw = extractTag(entry, 'title') ?? ''
    const title = stripHtml(titleRaw)

    const contentRaw = extractTag(entry, 'content') ?? ''
    const body = stripHtml(contentRaw).slice(0, 300)

    const searchText = `${title} ${body}`
    const matchedKeywords = KEYWORDS.filter(kw => searchText.toLowerCase().includes(kw.toLowerCase()))
    const isQuestion = title.includes('?') || QUESTION_STARTERS.some(w => {
      const lower = title.toLowerCase().trim()
      return lower.startsWith(w) || lower.includes(` ${w} `)
    })

    posts.push({ url, subreddit, title, body, publishedDate, matchedKeywords, isQuestion })
  }

  return posts
}

// ── Fetch with retry ──────────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchRss(subreddit: string, attempt = 0): Promise<Post[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new/.rss`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VisaScout/1.0 personal-gtm-tool (no-auth RSS scan)' },
    })
    if (res.status === 429 || res.status === 503) {
      if (attempt < MAX_RETRIES) {
        await sleep(2000 * (attempt + 1))
        return fetchRss(subreddit, attempt + 1)
      }
      throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`)
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    return parseAtomFeed(xml, subreddit)
  } catch (err) {
    throw new Error(`${subreddit}: ${(err as Error).message}`)
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────

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

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatPost(post: Post, cat: Category): string {
  const lines = [
    `[r/${post.subreddit} · ${formatDate(post.publishedDate)}]`,
    `"${post.title}"`,
  ]
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const results: Post[] = []
  const seen = new Set<string>()
  const failed: string[] = []

  console.log(`Scanning ${SUBREDDITS.length} subreddits via RSS (last ${DAYS_BACK} days)...\n`)

  for (const sub of SUBREDDITS) {
    try {
      const posts = await fetchRss(sub)
      let added = 0
      for (const p of posts) {
        if (!seen.has(p.url)) {
          seen.add(p.url)
          results.push(p)
          added++
        }
      }
      process.stdout.write(added > 0 ? `+${added}`.padStart(4) : '   .')
    } catch (err) {
      failed.push((err as Error).message)
      process.stdout.write('  ✗')
    }
    process.stdout.write(` r/${sub}\n`)
    await sleep(DELAY_MS)
  }

  const runTime = new Date().toLocaleString('en-US', { hour12: false })
  const priority = results.filter(p => categorize(p) === 'priority')
  const worthLook = results.filter(p => categorize(p) === 'worthLook')
  const noise = results.filter(p => categorize(p) === 'noise')

  const headerLines = [
    `=== VISA SCOUT — Reddit Opportunity Scan (RSS) ===`,
    `Run: ${runTime}  ·  ${SUBREDDITS.length} subreddits  ·  ${results.length} posts (last ${DAYS_BACK}d, creation-date-filtered)`,
  ]
  if (failed.length > 0) {
    headerLines.push(`Errors (${failed.length}): ${failed.join('; ')}`)
  }
  const header = headerLines.join('\n')

  let body: string
  if (results.length === 0) {
    body = `No posts found in the last ${DAYS_BACK} days. Try increasing DAYS_BACK.`
  } else {
    body = [
      renderSection('ANSWER THESE (questions with visa keywords)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
      renderSection('NOISE', noise, 'noise'),
    ].filter(Boolean).join('\n\n')
  }

  const output = [
    header,
    body,
    `──────────────────────────────────────────\nDone. ${results.length} posts from last ${DAYS_BACK}d with verified creation dates.`,
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
  const filename = `reddit-scan-rss-${stamp}.md`
  fs.writeFileSync(path.join(outputDir, filename), ['```', output, '```'].join('\n'), 'utf-8')
  console.log(`\nSaved → outputs/scans/${filename}`)
}

main()
