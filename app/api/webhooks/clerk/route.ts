import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { render } from '@react-email/render';
import { getResend, FROM_ADDRESS } from '@/src/lib/email';
import WelcomeEmail from '@/src/emails/welcome';

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook secret not configured', { status: 500 });

  const body = await req.text();
  const headersList = await headers();

  const svixId        = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  let event: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof event;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'user.created') {
    const emailAddresses = event.data.email_addresses as Array<{ email_address: string }> | undefined;
    const email = emailAddresses?.[0]?.email_address;

    if (email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visascout.io';
      try {
        const html = await render(WelcomeEmail({ appUrl: `${appUrl}/app` }));
        await getResend().emails.send({
          from: FROM_ADDRESS,
          to: email,
          subject: 'Welcome to VisaScout — your first brief is free',
          html,
        });
      } catch (err) {
        if (process.env.DEBUG_ALLOWED) {
          console.error('[clerk-webhook] welcome email failed', { email, err });
        }
      }
    }
  }

  return new Response('ok', { status: 200 });
}
