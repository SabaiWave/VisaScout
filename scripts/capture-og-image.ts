import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import path from 'path';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
// Wider viewport so two-column hero layout renders at full width
const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;

async function main() {
  const url = process.argv[2] ?? 'http://localhost:3000';
  console.log(`Capturing OG image from ${url} ...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for web fonts
  await page.evaluate(() => document.fonts.ready);
  // Wait for h1 to be rendered and visible (Framer Motion animates it in)
  await page.waitForSelector('h1', { state: 'visible', timeout: 20000 });
  // Let entrance animations fully complete
  await page.waitForTimeout(1500);

  // Hide nav bar — OG images show product, not chrome
  await page.evaluate(() => {
    const nav = document.querySelector('nav') ?? document.querySelector('header');
    if (nav) (nav as HTMLElement).style.display = 'none';
  });

  // Crop: horizontally centered, top 630px
  const x = Math.round((VIEWPORT_WIDTH - OG_WIDTH) / 2);
  const screenshot = await page.screenshot({
    clip: { x, y: 0, width: OG_WIDTH, height: OG_HEIGHT },
    type: 'png',
  });

  const outPath = path.join(process.cwd(), 'public', 'og-image.png');
  writeFileSync(outPath, screenshot);

  await browser.close();
  console.log(`✓ Saved to public/og-image.png (${OG_WIDTH}x${OG_HEIGHT})`);
}

main();
