import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

// Output: app/apple-icon.png (180×180) — Next.js file convention, auto-serves as apple-touch-icon
const TARGET = { file: path.join('app', 'apple-icon.png'), size: 180 };

async function main() {
  const svgRaw = readFileSync(path.join(process.cwd(), 'app', 'icon.svg'), 'utf-8');

  // Remove explicit width/height so CSS controls scaling; keep viewBox for proportional render
  const svg = svgRaw.replace(/\s*width="[^"]*"/, '').replace(/\s*height="[^"]*"/, '');

  const { size, file } = TARGET;
  const html = `<!DOCTYPE html>
<html>
<head>
<style>
* { margin: 0; padding: 0; }
html, body { width: ${size}px; height: ${size}px; overflow: hidden; }
svg { display: block; width: ${size}px; height: ${size}px; }
</style>
</head>
<body>${svg}</body>
</html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const screenshot = await page.screenshot({
    clip: { x: 0, y: 0, width: size, height: size },
    type: 'png',
  });

  writeFileSync(path.join(process.cwd(), file), screenshot);
  await browser.close();
  console.log(`✓ ${file} (${size}×${size})`);
}

main();
