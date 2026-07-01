import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getResend, getFromAddress } from '@/src/lib/email';

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  message: z.string().min(1).max(2000),
});

// In-memory IP rate limit: 5 requests per 15 minutes
const ipRequests = new Map<string, number[]>();

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = 5;
  const timestamps = (ipRequests.get(ip) ?? []).filter(t => t > now - windowMs);
  if (timestamps.length >= limit) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitResult = checkIpRateLimit(ip);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: rateLimitResult.retryAfter ? { 'Retry-After': String(rateLimitResult.retryAfter) } : {},
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  try {
    const to = process.env.SUPPORT_EMAIL;
    if (!to) throw new Error('SUPPORT_EMAIL not set');

    await getResend().emails.send({
      from: getFromAddress(),
      to,
      replyTo: email,
      subject: `[Contact] ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
