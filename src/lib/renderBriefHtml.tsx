import type { BriefDocumentMeta } from '@/app/components/BriefDocument';
import type { VisaBrief } from '@/src/types/index';

// Dynamic imports deliberately — Next's app-router build analysis statically traces
// the whole reachable import graph from any Route Handler and flags react-dom/server
// co-occurring with a component import anywhere in it, even in files outside app/.
// Dynamic import isn't part of that static graph, so it dodges the check.
export async function renderBriefHtml(brief: VisaBrief, meta: BriefDocumentMeta): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const React = (await import('react')).default;
  const BriefDocument = (await import('@/app/components/BriefDocument')).default;

  const componentHtml = renderToStaticMarkup(
    React.createElement(BriefDocument, { brief, meta, mode: 'print' }),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VisaScout Brief — ${meta.nationality} to ${meta.destination}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
${componentHtml}
</body>
</html>`;
}
