import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const SIZES = [
  { name: 'apple-touch-icon.png', size: 180, dest: 'public' },
  { name: 'apple-icon.png', size: 180, dest: 'app' },
];

async function main() {
  const svgContent = readFileSync(path.join(process.cwd(), 'app', 'icon.svg'), 'utf-8');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const { name, size, dest } of SIZES) {
    await page.setViewportSize({ width: size, height: size });

    // Render SVG scaled to target size with transparent background
    const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${size}px; height: ${size}px; background: transparent; }
  svg { width: ${size}px; height: ${size}px; }
</style>
</head>
<body>${svgContent.replace(/width="32"/, `width="${size}"`).replace(/height="32"/, `height="${size}"`).replace(/font-size="14"/, `font-size="${Math.round(14 * size / 32)}"`)}</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: size, height: size },
      type: 'png',
      omitBackground: false,
    });

    const outPath = path.join(process.cwd(), dest, name);
    writeFileSync(outPath, screenshot);
    console.log(`✓ ${dest}/${name} (${size}×${size})`);
  }

  await browser.close();
}

main();
