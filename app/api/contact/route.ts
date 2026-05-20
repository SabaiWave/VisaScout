import { NextRequest, NextResponse } from 'next/server';
import { getResend, getFromAddress } from '@/src/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

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
    if (process.env.DEBUG_ALLOWED) console.error('[contact]', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
