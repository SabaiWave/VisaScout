import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { render } from '@react-email/render';
import { getResend, getFromAddress } from '@/src/lib/email';
import { trackEvent } from '@/src/lib/analytics';
import { getSupabase } from '@/src/lib/supabase';
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

  const clerkUserId = event.data.id as string;
  const emailAddresses = event.data.email_addresses as Array<{ email_address: string }> | undefined;
  const email = emailAddresses?.[0]?.email_address ?? null;

  if (event.type === 'user.created') {
    await trackEvent('user.signup', { userId: clerkUserId, email });

    if (email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visascout.io';
      try {
        const html = await render(WelcomeEmail({ appUrl: `${appUrl}/app` }));
        await getResend().emails.send({
          from: getFromAddress(),
          to: email,
          subject: 'Welcome to VisaScout — your first brief is free',
          html,
        });
      } catch (err) {
        console.error('[clerk-webhook] welcome email failed', { email, err });
      }
    }
  }

  if (event.type === 'user.updated' && email) {
    await getSupabase()
      .from('users')
      .update({ email })
      .eq('clerk_user_id', clerkUserId);
  }

  if (event.type === 'user.deleted') {
    const supabase = getSupabase();

    // Find internal user row
    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userRow) {
      // Anonymize briefs first — FK constraint prevents deleting user row otherwise
      await supabase
        .from('briefs')
        .update({ user_id: null })
        .eq('user_id', userRow.id);

      // Hard delete the user row — Clerk already deleted them upstream
      await supabase
        .from('users')
        .delete()
        .eq('id', userRow.id);
    }

    await trackEvent('user.deleted', { userId: clerkUserId });
  }

  return new Response('ok', { status: 200 });
}
