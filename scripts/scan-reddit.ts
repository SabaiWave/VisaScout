// === CONFIG — edit these to add/remove subreddits and keywords ===

// Your Reddit username — used in User-Agent (Reddit API best practice)
const REDDIT_USERNAME = 'your_reddit_username'  // ← change this

// General nomad/expat subs — visa questions from any destination
const SUBREDDITS_GENERAL = [
  'digitalnomad',
  'expats',
  'IWantOut',
  'solotravel',
  'backpacking',
  'LongTermTravel',
  'SEABackpacking',
]

// Destination-specific subs (match VisaScout supported countries)
const SUBREDDITS_DESTINATIONS = [
  // SEA
  'ThailandTourism',
  'Thailand',
  'VietnamTourism',
  'vietnam',
  'Indonesia',
  'bali',
  'malaysia',
  'Philippines',
  'cambodia',
  // East Asia
  'JapanTravel',
  'koreatravel',
  // Europe
  'germany',
  'portugal',
  'spain',
  'Netherlands',
  // LatAm
  'mexico',
  'Colombia',
]

const SUBREDDITS = [...SUBREDDITS_GENERAL, ...SUBREDDITS_DESTINATIONS]

const KEYWORDS = [
  // Core visa terms
  'visa',
  'overstay',
  'border run',
  'visa run',
  'METV',
  'tourist visa',
  'visa extension',
  'immigration',
  'work permit',
  'entry requirements',
  // Digital nomad visas
  'digital nomad visa',
  'nomad visa',
  'remote work visa',
  'freelance visa',
  // Long stay
  'long stay',
  'long term visa',
  'retirement visa',
  'golden visa',
  'permanent residence',
  // Entry types
  'e-visa',
  'visa on arrival',
  'VOA',
  'schengen',
  'multiple entry',
  'visa free',
  // Common enforcement language
  'overstay fine',
  'stamp out',
  '90 day',
  '180 day',
  '30 day',
  'passport',
]

const MAX_POST_AGE_HOURS = 48       // change to 96+ to look further back
const MAX_RESULTS_PER_SUB = 25      // max posts per subreddit (Reddit API cap: 100)
const UNANSWERED_THRESHOLD = 2      // posts with ≤ this many comments → [UNANSWERED] (OAuth mode only)
// ================================================================

import * as fs from 'fs'
import * as path from 'path'

const USER_AGENT = `script:visascout-scanner:1.0 (by /u/${REDDIT_USERNAME})`

const QUESTION_STARTERS = [
  'how', 'can i', 'can we', 'should i', 'does', 'do i', 'is it', 'is there',
  'anyone', 'what is', 'what are', 'which', 'when', 'where can', 'has anyone',
  'advice', 'help',
]

interface Post {
  id: string
  subreddit: string
  title: string
  body: string
  permalink: string
  ageHours: number
  numComments?: number     // available in OAuth mode only
  matchedKeywords: string[]
  isQuestion: boolean
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`
  if (hours < 24) return `${Math.round(hours)}h ago`
  return `${Math.round(hours / 24)}d ago`
}

type Category = 'priority' | 'worthLook' | 'noise'

function categorize(post: Post): Category {
  const hasCount = post.numComments !== undefined
  const unanswered = hasCount ? post.numComments! <= UNANSWERED_THRESHOLD : true
  if (post.isQuestion && unanswered) return 'priority'
  if (post.isQuestion || unanswered) return 'worthLook'
  return 'noise'
}

function bodyPreview(body: string, maxChars = 120): string {
  const cleaned = body.replace(/\[link\]|\[comments\]/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length < 20) return ''
  return cleaned.length <= maxChars ? cleaned : cleaned.slice(0, maxChars).trimEnd() + '…'
}

function formatPost(post: Post, cat: Category): string {
  const commentPart = post.numComments !== undefined ? ` — ${post.numComments} comment${post.numComments === 1 ? '' : 's'}` : ''
  const header = `[r/${post.subreddit}] ${formatAge(post.ageHours)}${commentPart}`
  const title = `"${post.title}"`
  const lines = [header, title]
  // Show body preview only for priority posts where it adds context
  if (cat === 'priority') {
    const preview = bodyPreview(post.body)
    if (preview) lines.push(preview)
  }
  lines.push(`→ ${post.permalink}`)
  return lines.join('\n')
}

function renderSection(title: string, posts: Post[], cat: Category): string {
  if (posts.length === 0) return ''
  const items = posts.map(p => formatPost(p, cat)).join('\n\n')
  return `── ${title} ${'─'.repeat(Math.max(0, 44 - title.length))}\n\n${items}`
}

// ── OAuth mode (with REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET) ────────────────

async function getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`OAuth token fetch failed: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

interface RedditJsonChild {
  data: {
    id: string
    title: string
    selftext: string
    permalink: string
    url: string
    created_utc: number
    num_comments: number
    is_self: boolean
  }
}

async function fetchSubredditOAuth(subreddit: string, token: string, nowMs: number): Promise<Post[]> {
  const url = `https://oauth.reddit.com/r/${subreddit}/new.json?limit=${MAX_RESULTS_PER_SUB}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
  })
  if (res.status === 429) throw new Error('rate limited (429)')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json() as { data: { children: RedditJsonChild[] } }
  const posts: Post[] = []

  for (const { data: item } of json.data.children) {
    const ageHours = (nowMs - item.created_utc * 1000) / 3_600_000
    if (ageHours > MAX_POST_AGE_HOURS) continue
    if (!item.is_self && !item.selftext) continue

    const searchText = `${item.title} ${item.selftext}`
    const matched = matchKeywords(searchText)
    if (matched.length === 0) continue

    posts.push({
      id: item.id,
      subreddit,
      title: item.title,
      body: item.selftext,
      permalink: `https://reddit.com${item.permalink}`,
      ageHours,
      numComments: item.num_comments,
      matchedKeywords: matched,
      isQuestion: detectQuestion(item.title),
    })
  }

  return posts
}

// ── RSS fallback mode (no credentials needed, but rate-limited) ───────────────

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseAtomFeed(xml: string): Array<{ id: string; title: string; body: string; permalink: string; published: string }> {
  const entries = []
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = match[1]
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/)
    const linkMatch = block.match(/<link href="([^"]+)"/)
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/)
    const contentMatch = block.match(/<content type="html">([\s\S]*?)<\/content>/)
    const idMatch = block.match(/<id>([^<]+)<\/id>/)
    if (!titleMatch || !linkMatch || !publishedMatch || !idMatch) continue
    entries.push({
      id: idMatch[1].replace('t3_', ''),
      title: decodeHtmlEntities(titleMatch[1]),
      body: contentMatch ? stripHtml(contentMatch[1]) : '',
      permalink: linkMatch[1],
      published: publishedMatch[1],
    })
  }
  return entries
}

const RSS_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function fetchSubredditRss(subreddit: string, nowMs: number): Promise<Post[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.rss?limit=${MAX_RESULTS_PER_SUB}`
  const res = await fetch(url, { headers: { 'User-Agent': RSS_UA } })
  if (res.status === 429) throw new Error('rate limited (429) — try again in a few minutes')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const xml = await res.text()
  const entries = parseAtomFeed(xml)
  const posts: Post[] = []

  for (const entry of entries) {
    const ageHours = (nowMs - new Date(entry.published).getTime()) / 3_600_000
    if (ageHours > MAX_POST_AGE_HOURS) continue
    const hasBody = entry.body.replace(/\[link\]|\[comments\]/g, '').trim().length > 30
    const searchText = `${entry.title} ${hasBody ? entry.body : ''}`
    const matched = matchKeywords(searchText)
    if (matched.length === 0) continue
    posts.push({
      id: entry.id,
      subreddit,
      title: entry.title,
      body: entry.body,
      permalink: entry.permalink,
      ageHours,
      matchedKeywords: matched,
      isQuestion: detectQuestion(entry.title),
    })
  }

  return posts
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (MAX_POST_AGE_HOURS <= 0) {
    console.error('MAX_POST_AGE_HOURS must be a positive number.')
    process.exit(1)
  }

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const useOAuth = Boolean(clientId && clientSecret)

  if (!useOAuth) {
    console.warn('⚠ No Reddit OAuth credentials found. Running in RSS mode (rate limits may apply).')
    console.warn('  Set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET in .env.local for full access.\n')
  }

  let token: string | undefined
  if (useOAuth) {
    try {
      token = await getOAuthToken(clientId!, clientSecret!)
    } catch (err) {
      console.error(`OAuth token fetch failed: ${(err as Error).message}`)
      process.exit(1)
    }
  }

  const subreddits = [...new Set(SUBREDDITS)]
  const nowMs = Date.now()
  const seen = new Set<string>()
  const results: Post[] = []

  console.log(`Mode: ${useOAuth ? 'OAuth (full access)' : 'RSS (fallback)'}`)
  console.log(`Scanning ${subreddits.length} subreddits...\n`)

  for (let i = 0; i < subreddits.length; i++) {
    const sub = subreddits[i]
    try {
      const posts = useOAuth
        ? await fetchSubredditOAuth(sub, token!, nowMs)
        : await fetchSubredditRss(sub, nowMs)

      for (const post of posts) {
        if (seen.has(post.id)) continue
        seen.add(post.id)
        results.push(post)
      }
      process.stdout.write('.')
    } catch (err) {
      process.stdout.write('\n')
      console.warn(`⚠ r/${sub} — fetch failed, skipping (${(err as Error).message})`)
    }

    if (i < subreddits.length - 1) await sleep(useOAuth ? 500 : 4000)
  }

  process.stdout.write('\n')

  // Sort by recency within each category (categorize() handles section placement)
  results.sort((a, b) => a.ageHours - b.ageHours)

  const runTime = new Date().toLocaleString('en-US', { hour12: false })

  const priority = results.filter(p => categorize(p) === 'priority')
  const worthLook = results.filter(p => categorize(p) === 'worthLook')
  const noise = results.filter(p => categorize(p) === 'noise')

  const header = [
    `=== VISA SCOUT — Reddit Opportunity Scan ===`,
    `Run: ${runTime}  ·  ${subreddits.length} subs scanned  ·  ${results.length} posts found  [${useOAuth ? 'OAuth' : 'RSS'}]`,
  ].join('\n')

  let body: string
  if (results.length === 0) {
    body = `No matching posts found in the last ${MAX_POST_AGE_HOURS}h. Try expanding keywords or increasing MAX_POST_AGE_HOURS.`
  } else {
    const sections = [
      renderSection('ANSWER THESE (unanswered questions)', priority, 'priority'),
      renderSection('WORTH A LOOK', worthLook, 'worthLook'),
      renderSection('NOISE', noise, 'noise'),
    ].filter(Boolean)
    body = sections.join('\n\n')
  }

  const output = [header, body, '──────────────────────────────────────────\nDone. Pick your threads and answer manually.'].join('\n\n')

  console.log('\n' + output)

  const outputDir = path.join(process.cwd(), 'outputs')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(path.join(outputDir, 'reddit-scan-latest.md'), ['```', output, '```'].join('\n'), 'utf-8')
}

main()
