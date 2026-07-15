// Converts a VisaScout brief into a natural Reddit comment.
//
// Usage:
//   Full auto (recommended):
//     bash scripts/run.sh scripts/humanize-comment.ts <brief-url> <reddit-url>
//     → fetches both brief (Supabase) and Reddit post (Tavily), no manual input needed
//
//   Brief URL only:
//     bash scripts/run.sh scripts/humanize-comment.ts <brief-url>
//     → fetches brief, then prompts you to paste the Reddit post
//
//   File mode (fallback):
//     bash scripts/run.sh scripts/humanize-comment.ts
//     → picks up .md/.txt files from outputs/briefs/, prompts for Reddit post

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { tavily } from '@tavily/core'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const BRIEFS_DIR = path.join(process.cwd(), 'outputs', 'briefs')
const BRIEFS_USED_DIR = path.join(process.cwd(), 'outputs', 'briefs', 'used')
const COMMENTS_DIR = path.join(process.cwd(), 'outputs', 'comments')

const BRIEF_EXCLUDE_NAMES = ['README.md', 'README.txt']

const SYSTEM_PROMPT = `You are a knowledgeable traveler and digital nomad who has lived in Southeast Asia for years. You answer visa questions on Reddit helpfully and naturally — like a real person sharing genuine experience, not a product or service.

Rules you must follow:
- Never use the word "AI" or mention any AI tools
- Never sound like a product pitch or advertisement
- Write like a real person: conversational, direct, occasionally informal
- Lead with the most useful information for their specific situation
- Use the visa intelligence brief provided as your source of truth — but translate it into natural human language
- Include specific details (visa names, durations, fees, border crossing names) — specificity builds trust
- If the brief mentions uncertainty or conflicting sources, reflect that honestly ("last I heard..." or "this was the rule as of early 2025 but worth double-checking")
- End with a soft, natural mention of visascout.io — frame it as a tool you use or found useful, not a promotion. Example: "I've been using visascout.io to get structured breakdowns like this — free tier covers most questions."
- Never end with "Hope this helps!" or similar filler
- Target length: 150-300 words. Long enough to be genuinely useful, short enough to actually be read.
- Do not use bullet points unless the question specifically calls for a list — Reddit prose reads better`

// ── URL mode: fetch brief from Supabase ──────────────────────────────────────

function extractBriefId(input: string): string | null {
  // Matches UUID in any URL position: /brief/uuid or just the UUID itself
  const match = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  return match ? match[0] : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatBriefForLLM(brief: any, nationality: string, destination: string): string {
  const lines: string[] = [
    `NATIONALITY: ${nationality}`,
    `DESTINATION: ${destination}`,
    '',
  ]

  if (brief.parsedSituation?.parsedSummary) {
    lines.push(`SITUATION: ${brief.parsedSituation.parsedSummary}`)
  }

  if (brief.recommendedAction) {
    const ra = brief.recommendedAction
    lines.push('', 'RECOMMENDED ACTION:')
    if (ra.action) lines.push(`  Action: ${ra.action}`)
    if (ra.deadline) lines.push(`  Deadline: ${ra.deadline}`)
    if (ra.rationale) lines.push(`  Rationale: ${ra.rationale}`)
    if (ra.stalePolicyWarning) lines.push(`  Warning: ${ra.stalePolicyWarning}`)
  }

  if (brief.visaOptions?.length) {
    lines.push('', 'VISA OPTIONS:')
    for (const opt of brief.visaOptions) {
      lines.push(`  ${opt.name} (${opt.suitability})`)
      if (opt.duration) lines.push(`    Duration: ${opt.duration}`)
      if (opt.cost) lines.push(`    Cost: ${opt.cost}`)
      if (opt.pros?.length) lines.push(`    Pros: ${opt.pros.join('; ')}`)
      if (opt.cons?.length) lines.push(`    Cons: ${opt.cons.join('; ')}`)
    }
  }

  if (brief.entryRequirements) {
    const er = brief.entryRequirements
    lines.push('', 'ENTRY REQUIREMENTS:')
    if (er.documents?.length) lines.push(`  Documents: ${er.documents.join(', ')}`)
    if (er.proofOfFunds) lines.push(`  Proof of funds: ${er.proofOfFunds}`)
    if (er.onwardTicket) lines.push(`  Onward ticket: ${er.onwardTicket}`)
  }

  if (brief.borderRun) {
    const br = brief.borderRun
    lines.push('', 'BORDER RUN:')
    if (br.eligibility) lines.push(`  Eligibility: ${br.eligibility}`)
    if (br.enforcementPosture) lines.push(`  Enforcement: ${br.enforcementPosture}`)
    if (br.limits) lines.push(`  Limits: ${br.limits}`)
  }

  if (brief.recentChanges?.length) {
    lines.push('', 'RECENT CHANGES:')
    for (const change of brief.recentChanges.slice(0, 3)) {
      if (change.summary) lines.push(`  - ${change.summary}`)
    }
  }

  if (brief.conflictReport?.overallConfidence) {
    lines.push('', `CONFIDENCE: ${brief.conflictReport.overallConfidence.toUpperCase()}`)
  }

  if (brief.contingency?.overstayScenario) {
    lines.push('', `OVERSTAY SCENARIO: ${brief.contingency.overstayScenario}`)
  }

  return lines.join('\n')
}

async function fetchBriefFromUrl(briefUrl: string): Promise<{ content: string; label: string } | null> {
  const briefId = extractBriefId(briefUrl)
  if (!briefId) {
    console.error(`Could not extract brief ID from: ${briefUrl}`)
    return null
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.')
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { db: { schema: 'visascout' } })
  const { data, error } = await supabase
    .from('briefs')
    .select('brief_markdown, nationality, destination')
    .eq('id', briefId)
    .single()

  if (error || !data) {
    console.error(`Brief not found (${briefId}): ${error?.message ?? 'no data'}`)
    return null
  }

  if (!data.brief_markdown) {
    console.error('Brief exists but has no content yet (still generating?).')
    return null
  }

  let brief: unknown
  try {
    brief = JSON.parse(data.brief_markdown)
  } catch {
    console.error('Could not parse brief_markdown as JSON.')
    return null
  }

  const content = formatBriefForLLM(brief, data.nationality ?? '', data.destination ?? '')
  const label = `${data.nationality ?? '?'} → ${data.destination ?? '?'} (fetched from visascout.io)`
  return { content, label }
}

// ── Reddit fetch: extract post content via Tavily ────────────────────────────

async function fetchRedditPost(redditUrl: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.warn('TAVILY_API_KEY not set — falling back to manual post paste.')
    return null
  }

  try {
    const client = tavily({ apiKey })
    const result = await client.extract([redditUrl])
    const page = result.results?.[0]
    if (!page?.rawContent) {
      console.warn('Tavily returned no content for that URL — falling back to manual paste.')
      return null
    }
    // Trim to first 2000 chars — enough context for the LLM without bloat
    return page.rawContent.slice(0, 2000).trim()
  } catch (err) {
    console.warn(`Reddit fetch failed (${(err as Error).message}) — falling back to manual paste.`)
    return null
  }
}

// ── File mode: scan outputs/briefs/ ──────────────────────────────────────────

function findBriefs(): string[] {
  if (!fs.existsSync(BRIEFS_DIR)) {
    fs.mkdirSync(BRIEFS_DIR, { recursive: true })
    return []
  }
  return fs.readdirSync(BRIEFS_DIR)
    .filter(f => {
      const ext = path.extname(f).toLowerCase()
      if (ext !== '.md' && ext !== '.txt') return false
      if (BRIEF_EXCLUDE_NAMES.includes(f)) return false
      return true
    })
    .map(f => path.join(BRIEFS_DIR, f))
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function promptMultiLine(label: string): Promise<string> {
  console.log(`\n${label}`)
  console.log('(Press Enter twice when done)\n> ')

  return new Promise(resolve => {
    const lines: string[] = []
    let emptyCount = 0
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

    rl.on('line', line => {
      if (line === '') {
        emptyCount++
        if (emptyCount >= 2) {
          rl.close()
          resolve(lines.join('\n').trim())
        }
      } else {
        emptyCount = 0
        lines.push(line)
        process.stdout.write('> ')
      }
    })
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set. Run via: bash scripts/run.sh scripts/humanize-comment.ts')
    process.exit(1)
  }

  const urlArg = process.argv[2]
  const redditUrlArg = process.argv[3]
  let briefContent: string
  let briefFileToArchive: string | null = null  // only set in file mode

  if (urlArg) {
    // ── URL mode ──
    console.log(`Fetching brief from: ${urlArg}`)
    const result = await fetchBriefFromUrl(urlArg)
    if (!result) process.exit(1)
    console.log(`Using brief: ${result.label}`)
    briefContent = result.content
  } else {
    // ── File mode ──
    const briefs = findBriefs()

    if (briefs.length === 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('No briefs found in outputs/briefs/')
      console.log('')
      console.log('Option A — pass the brief URL directly (recommended):')
      console.log('  bash scripts/run.sh scripts/humanize-comment.ts https://visascout.io/brief/[id]')
      console.log('')
      console.log('Option B — drop a file in outputs/briefs/ and re-run:')
      console.log('  Save the brief as .md or .txt, place in outputs/briefs/')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      process.exit(0)
    }

    let briefPath: string
    if (briefs.length === 1) {
      briefPath = briefs[0]
      console.log(`Using brief: ${path.relative(process.cwd(), briefPath)}`)
    } else {
      console.log('\nMultiple briefs found:')
      briefs.forEach((f, i) => console.log(`  ${i + 1}. ${path.relative(process.cwd(), f)}`))
      const choice = await prompt('\nPick a number: ')
      const idx = parseInt(choice, 10) - 1
      if (isNaN(idx) || idx < 0 || idx >= briefs.length) {
        console.error('Invalid selection.')
        process.exit(1)
      }
      briefPath = briefs[idx]
    }

    try {
      briefContent = fs.readFileSync(briefPath, 'utf-8')
    } catch (err) {
      console.error(`Could not read brief: ${(err as Error).message}`)
      process.exit(1)
    }

    briefFileToArchive = briefPath
  }

  // ── Get Reddit question ──
  let question = ''

  if (redditUrlArg) {
    console.log(`Fetching Reddit post: ${redditUrlArg}`)
    const fetched = await fetchRedditPost(redditUrlArg)
    if (fetched) {
      question = fetched
      console.log(`Reddit post fetched (${fetched.length} chars)\n`)
    }
  }

  while (!question) {
    question = await promptMultiLine('Paste the Reddit post or question you\'re answering:')
    if (!question) console.log('Question cannot be empty. Try again.')
  }

  // ── Call Anthropic ──
  console.log('\nGenerating comment...\n')
  const client = new Anthropic({ apiKey })

  let comment: string
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Reddit question/post:\n${question}\n\nVisaScout brief:\n${briefContent}\n\nWrite a Reddit comment answering this question based on the brief above.`,
        },
      ],
    })
    const block = response.content[0]
    comment = block.type === 'text' ? block.text.trim() : ''
    if (!comment) throw new Error('Empty response from API')
  } catch (err) {
    console.error(`API call failed: ${(err as Error).message}`)
    if (briefFileToArchive) console.error('Brief was NOT archived — fix the error and retry.')
    process.exit(1)
  }

  // ── Save comment ──
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('')

  console.log('=== REDDIT COMMENT — READY TO PASTE ===\n')
  console.log(comment)
  console.log('\n========================================')
  console.log(`Characters: ${comment.length}`)

  if (!fs.existsSync(COMMENTS_DIR)) fs.mkdirSync(COMMENTS_DIR, { recursive: true })
  const commentFilename = `comment-${stamp}.md`
  fs.writeFileSync(path.join(COMMENTS_DIR, commentFilename), comment, 'utf-8')
  console.log(`Comment saved:   outputs/comments/${commentFilename}`)

  // ── Archive brief (file mode only) ──
  if (briefFileToArchive) {
    if (!fs.existsSync(BRIEFS_USED_DIR)) fs.mkdirSync(BRIEFS_USED_DIR, { recursive: true })
    const archiveDest = path.join(BRIEFS_USED_DIR, path.basename(briefFileToArchive))
    fs.renameSync(briefFileToArchive, archiveDest)
    console.log(`Brief archived:  outputs/briefs/used/${path.basename(briefFileToArchive)}`)
  }
}

main()
