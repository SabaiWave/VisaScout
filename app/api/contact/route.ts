import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

let resend: Resend;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    await getResend().emails.send({
      from: 'VisaScout <hello@visascout.io>',
      to: 'sabaiwave.inbox@gmail.com',
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
