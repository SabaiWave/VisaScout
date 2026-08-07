import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import path from 'path';
import { clientConfig } from '../config/client';

// Composes a standalone branded OG/Twitter card (Cartographic Dark) and
// screenshots it with Playwright. Self-contained HTML — does not depend on
// a running dev server or the live landing page's current render state.
// Per CLAUDE.md: next/og (Satori) can't do this layout reliably (large
// condensed display type + inline SVG glyph), so Playwright chromium is
// used instead, same pattern as scripts/generate-app-icons.ts.

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildHtml(tagline: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${OG_WIDTH}px; height: ${OG_HEIGHT}px; overflow: hidden; background: #060c12; }
  .canvas {
    position: relative;
    width: ${OG_WIDTH}px;
    height: ${OG_HEIGHT}px;
    background:
      radial-gradient(ellipse 50% 60% at 22% 45%, rgba(200,120,10,0.18) 0%, transparent 70%),
      #060c12;
  }
  .corner { position: absolute; width: 28px; height: 28px; }
  .corner.tl { top: 36px; left: 36px; border-top: 1.5px solid #2a4254; border-left: 1.5px solid #2a4254; }
  .corner.tr { top: 36px; right: 36px; border-top: 1.5px solid #2a4254; border-right: 1.5px solid #2a4254; }
  .corner.bl { bottom: 36px; left: 36px; border-bottom: 1.5px solid #2a4254; border-left: 1.5px solid #2a4254; }
  .corner.br { bottom: 36px; right: 36px; border-bottom: 1.5px solid #2a4254; border-right: 1.5px solid #2a4254; }
  .lockup {
    position: absolute;
    left: 96px;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .glyph-row { display: flex; align-items: center; gap: 26px; }
  .glyph { width: 84px; height: 84px; flex-shrink: 0; }
  .wordmark {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 900;
    font-size: 104px;
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    color: #dceaf6;
  }
  .tagline {
    margin-top: 30px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 22px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8fb2c8;
  }
  .url {
    position: absolute;
    right: 96px;
    bottom: 56px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #5f849e;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>
    <div class="lockup">
      <div class="glyph-row">
        <svg class="glyph" viewBox="0 0 32 32">
          <line x1="0" y1="16" x2="32" y2="16" stroke="#c8780a" stroke-width="1.4"/>
          <line x1="16" y1="0" x2="16" y2="32" stroke="#c8780a" stroke-width="1.4"/>
          <circle cx="16" cy="16" r="11.2" fill="none" stroke="#c8780a" stroke-width="1.4"/>
        </svg>
        <div class="wordmark">VisaScout</div>
      </div>
      <div class="tagline">${esc(tagline)}</div>
    </div>
    <div class="url">visascout.io</div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('Composing OG image (Cartographic Dark)...');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
  await page.setContent(buildHtml(clientConfig.tagline), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const screenshot = await page.screenshot({
    clip: { x: 0, y: 0, width: OG_WIDTH, height: OG_HEIGHT },
    type: 'png',
  });

  const outPath = path.join(process.cwd(), 'public', 'og-image.png');
  writeFileSync(outPath, screenshot);

  await browser.close();
  console.log(`Saved to public/og-image.png (${OG_WIDTH}x${OG_HEIGHT})`);
}

main();
