# scripts/

Utility scripts for VisaScout. Run from the project root.

---

## scan-reddit.ts — Reddit Opportunity Scanner

Scans subreddits for recent visa-related threads worth answering. Outputs a prioritized list to the terminal and to `outputs/reddit-scan-latest.md`.

### Setup (one-time, ~2 minutes)

1. Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click **"create another app"** at the bottom
3. Fill in:
   - **Name:** VisaScout Scanner (or anything)
   - **Type:** select **"script"**
   - **Redirect URI:** `http://localhost` (required by the form, not actually used)
4. Click **Create app**
5. Note the two values:
   - **client_id** — the short string directly under your app name (e.g. `abc123XYZ`)
   - **client_secret** — labeled "secret" in the app settings
6. Add to `.env.local`:
   ```
   REDDIT_CLIENT_ID=abc123XYZ
   REDDIT_CLIENT_SECRET=your_secret_here
   ```
7. Edit `REDDIT_USERNAME` at the top of `scripts/scan-reddit.ts` to your Reddit username

### Run

```bash
bash scripts/run.sh scripts/scan-reddit.ts
```

This loads `.env.local` automatically. Without Reddit credentials the script falls back to RSS mode, which is rate-limited and may miss some subreddits.

### Customize

- **Add/remove subreddits:** Edit `SUBREDDITS_GENERAL` or `SUBREDDITS_DESTINATIONS` at the top of the script
- **Add/remove keywords:** Edit the `KEYWORDS` array
- **Look further back:** Increase `MAX_POST_AGE_HOURS` (default: 48). Run with 96 to catch the last 4 days.

### Output

Terminal + `outputs/reddit-scan-latest.md` (overwrites on each run, gitignored).

**Priority tags:**
- `[UNANSWERED]` — ≤2 comments. Answer these first — you can be first with a quality reply.
- `[?]` — title detected as a question (seeking advice, not an announcement or trip report)

### What to do with results

Read the posts manually. Pick the ones where you can add real value. Write a helpful answer and include a soft link to visascout.io where relevant. Never automate posting — quality beats volume at this stage.

---

## Other scripts

| Script | Purpose | How to run |
|--------|---------|------------|
| `test-pipeline.ts` | Run the full agent pipeline locally | `bash scripts/run.sh scripts/test-pipeline.ts` |
| `test-email.ts` | Send a test email via Resend | `bash scripts/run.sh scripts/test-email.ts` |
| `backfill-user-emails.ts` | One-time: populate email column for existing users | `bash scripts/run.sh scripts/backfill-user-emails.ts` |
| `audit-destinations.ts` | Verify Tavily domain lists cover all supported destinations | `bash scripts/run.sh scripts/audit-destinations.ts` |
| `capture-og-image.ts` | Capture OG image via Playwright | `npx tsx scripts/capture-og-image.ts` |
| `generate-app-icons.ts` | Generate favicon + app icons | `npx tsx scripts/generate-app-icons.ts` |
