import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ErrorTestPage() {
  if (!process.env.DEBUG_ALLOWED) notFound();
  throw new Error('[DEBUG] Intentional test error — triggered via /debug/error');
}
