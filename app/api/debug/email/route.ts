import { render } from '@react-email/components';
import { getResend, getFromAddress } from '@/src/lib/email';
import WelcomeEmail from '@/src/emails/welcome';

export const runtime = 'nodejs';

export async function GET() {
  if (!process.env.DEBUG_ALLOWED) {
    return new Response('Not found', { status: 404 });
  }

  const to = process.env.SUPPORT_EMAIL;
  if (!to) {
    return Response.json({ ok: false, error: 'SUPPORT_EMAIL not set' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const html = await render(WelcomeEmail({ appUrl }));

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: "You're in. — VisaScout",
    html,
  });

  if (error) {
    if (process.env.DEBUG_ALLOWED) console.error('[debug/email] send failed', error);
    return Response.json({ ok: false, error: 'Failed to send email' }, { status: 500 });
  }

  return Response.json({ ok: true, messageId: data?.id, to });
}
