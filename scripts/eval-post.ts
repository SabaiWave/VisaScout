// Evaluates a Reddit/Quora/forum post and tells you whether it's worth answering with VisaScout.
//
// Usage:
//   With post URL (Tavily fetches content):
//     bash scripts/run.sh scripts/eval-post.ts <post-url>
//
//   Paste mode:
//     bash scripts/run.sh scripts/eval-post.ts
//     → prompts you to paste the post
//
// Output:
//   VERDICT: YES / PARTIAL / NO
//   If YES/PARTIAL: nationality, destination(s), freeform text ready for VisaScout,
//   and a focus instruction ready for humanize-comment.ts.

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { tavily } from '@tavily/core'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const EVALS_DIR = path.join(process.cwd(), 'outputs', 'evals')

const SUPPORTED_DESTINATIONS = [
  // SEA
  'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines',
  'Cambodia', 'Laos', 'Myanmar', 'Singapore', 'Brunei',
  // East Asia
  'Japan', 'South Korea',
  // Schengen
  'Germany', 'Portugal', 'Spain', 'Netherlands', 'France', 'Italy',
  'Greece', 'Czech Republic', 'Poland', 'Croatia', 'Hungary', 'Schengen',
  // Middle East
  'United Arab Emirates', 'Turkey',
  // South Asia
  'India',
  // Caucasus
  'Georgia',
  // Latin America
  'Mexico', 'Colombia', 'Argentina', 'Brazil', 'Peru', 'Costa Rica',
  // Oceania
  'Australia', 'New Zealand',
]

const SYSTEM_PROMPT = `You are a triage agent for VisaScout (visascout.io), a visa intelligence tool for digital nomads and long-stay travelers.

VisaScout's scope:
- Supported destinations (36 total): ${SUPPORTED_DESTINATIONS.join(', ')}
- Covers: tourist/visitor visas, working holiday visas, digital nomad visas, long-stay options, entry requirements, border runs, recent policy changes
- Does NOT cover: citizenship applications, asylum/refugee claims, US immigration (green card, H-1B, F-1), UK/Canada/EU immigration pathways, employer-sponsored work visas requiring a job offer in hand, purely home-country application process tips (VFS appointments, document checklists for applying from abroad)
- Best fit: traveler already planning the trip or currently in-country, asking about visa options, duration, extensions, entry requirements
- Lower GTM fit: person applying from home for a standard work/study visa (consulate process tips) — VisaScout can still help with the "what visa" question but not "how to submit the form"

Your job: evaluate the post and output a structured assessment.

Output format (use exactly these labels, in this order):

VERDICT: YES | PARTIAL | NO

REASON: [1-2 sentences explaining the verdict]

[If VERDICT is YES or PARTIAL, include the following. If multi-destination, repeat NATIONALITY through FOCUS INSTRUCTION for each destination, labeled DESTINATION 1 and DESTINATION 2.]

NATIONALITY: [normalized country name — never a demonym. "American" → "United States", "Pakistani" → "Pakistan"]
DESTINATION: [canonical destination name matching the supported list above]
FREEFORM: [2-4 sentence freeform context to paste into VisaScout's freeform field — describe the user's situation, intent, and any constraints mentioned. Write in third person: "User is a Pakistani national planning to visit Australia..."]
DEPTH: quick | standard | deep
DEPTH REASON: [one sentence explaining why]
FOCUS INSTRUCTION: [what to tell humanize-comment.ts to focus on, or "none" if the full brief is relevant. Example: "Only address tourist visa and entry requirements. Skip working holiday visa — not relevant to this post."]

Depth selection rules (default to quick — it covers most questions):
- quick (Scout, free): single visa option question, basic entry requirements, straightforward nationality/destination combo. Use this unless there's a clear reason not to.
- standard (Intel, $9.99): question involves comparing multiple visa options, border run eligibility matters, or recent policy changes are likely relevant (destination has been in the news).
- deep (Dossier, $14.99): genuinely complex situation — multiple prior visits, overstay history, conflicting sources likely, or high-stakes long-term decision. Reserve for edge cases only.

Verdict rules:
- YES: clear visa intelligence question, supported destination, genuine traveler need
- PARTIAL: partially in scope (e.g. one of two destinations is supported, or question mixes in-scope and out-of-scope topics)
- NO: unsupported destination, purely home-application process, citizenship/asylum, or content marketing post`

async function fetchPost(url: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.warn('TAVILY_API_KEY not set — falling back to paste mode.')
    return null
  }
  try {
    const client = tavily({ apiKey })
    const result = await client.extract([url])
    const page = result.results?.[0]
    if (!page?.rawContent) {
      console.warn('Tavily returned no content — falling back to paste mode.')
      return null
    }
    return page.rawContent.slice(0, 3000).trim()
  } catch (err) {
    console.warn(`Fetch failed (${(err as Error).message}) — falling back to paste mode.`)
    return null
  }
}

function promptLine(question: string): Promise<string> {
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
        if (emptyCount >= 2) { rl.close(); resolve(lines.join('\n').trim()) }
      } else {
        emptyCount = 0
        lines.push(line)
        process.stdout.write('> ')
      }
    })
  })
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set. Run via: bash scripts/run.sh scripts/eval-post.ts')
    process.exit(1)
  }

  const urlArg = process.argv[2]
  let postText = ''

  if (urlArg) {
    console.log(`Fetching post: ${urlArg}`)
    const fetched = await fetchPost(urlArg)
    if (fetched) {
      postText = fetched
      console.log(`Post fetched (${fetched.length} chars)\n`)
    }
  }

  while (!postText) {
    postText = await promptMultiLine('Paste the post or question to evaluate:')
    if (!postText) console.log('Post cannot be empty. Try again.')
  }

  console.log('\nEvaluating...\n')

  const client = new Anthropic({ apiKey })
  let evaluation: string

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Post to evaluate:\n\n${postText}`,
        },
      ],
    })
    const block = response.content[0]
    evaluation = block.type === 'text' ? block.text.trim() : ''
    if (!evaluation) throw new Error('Empty response from API')
  } catch (err) {
    console.error(`API call failed: ${(err as Error).message}`)
    process.exit(1)
  }

  const LINE = '─'.repeat(62)
  console.log(`\n${LINE}`)
  console.log('  POST EVAL — VISASCOUT')
  console.log(LINE)
  console.log(evaluation)
  console.log(LINE)

  if (!fs.existsSync(EVALS_DIR)) fs.mkdirSync(EVALS_DIR, { recursive: true })

  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('')

  const filename = `eval-${stamp}.md`
  const fileContent = [`# Post Eval — ${stamp}`, '', '## Post', '', postText, '', '## Evaluation', '', evaluation].join('\n')
  fs.writeFileSync(path.join(EVALS_DIR, filename), fileContent, 'utf-8')
  console.log(`\nSaved → outputs/evals/${filename}`)
}

main()
