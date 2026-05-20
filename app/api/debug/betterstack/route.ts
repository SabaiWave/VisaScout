export const runtime = 'nodejs';

const BETTERSTACK_URL = 'https://s2405383.eu-fsn-3.betterstackdata.com';

export async function GET() {
  if (!process.env.DEBUG_ALLOWED) {
    return new Response('Not found', { status: 404 });
  }

  const token = process.env.BETTERSTACK_SOURCE_TOKEN;
  if (!token) {
    return Response.json({ ok: false, error: 'BETTERSTACK_SOURCE_TOKEN not set' }, { status: 500 });
  }

  const dt = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

  const res = await fetch(BETTERSTACK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dt, message: 'Hello from VisaScout dev tools!' }),
  });

  if (!res.ok) {
    return Response.json({ ok: false, status: res.status, statusText: res.statusText }, { status: 502 });
  }

  return Response.json({ ok: true, message: 'Log sent to BetterStack.', dt });
}
