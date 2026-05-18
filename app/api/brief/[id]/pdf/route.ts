import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/src/lib/supabase';
import { generateBriefHtml } from '@/src/lib/pdfTemplate';
import type { VisaBrief } from '@/src/types/index';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  brief_markdown: string | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, brief_markdown')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 });
  }

  const row = data as BriefRow;

  if (!row.brief_markdown) {
    return NextResponse.json({ error: 'Brief content not available' }, { status: 404 });
  }

  let brief: VisaBrief;
  try {
    brief = JSON.parse(row.brief_markdown) as VisaBrief;
  } catch {
    return NextResponse.json({ error: 'Failed to parse brief' }, { status: 500 });
  }

  const html = generateBriefHtml(brief, {
    nationality: row.nationality,
    destination: row.destination,
    depth: row.depth,
    createdAt: row.created_at,
  });

  let browser;
  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;

    const localExec = process.env.CHROME_EXECUTABLE_PATH;
    const executablePath = localExec ?? (await chromium.executablePath());
    const args = localExec
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : chromium.args;

    browser = await puppeteer.launch({
      args,
      defaultViewport: { width: 1200, height: 900 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.setContent(html, { waitUntil: 'networkidle2' as any });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
    });

    await browser.close();
    browser = undefined;

    const dateStamp = new Date(row.created_at).toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `visascout-brief-${dateStamp}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    if (process.env.DEBUG_ALLOWED) console.error('[pdf] generation failed', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
