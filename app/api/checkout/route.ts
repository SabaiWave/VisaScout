import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { getStripe, PRICES } from '@/src/lib/stripe';
import { createShellBrief } from '@/src/lib/saveBrief';
import { hasInviteAccess, redeemInviteCode, incrementInviteUsage } from '@/src/lib/inviteAccess';
import { getSupabase } from '@/src/lib/supabase';
import { log } from '@/src/lib/logger';
import { trackEvent } from '@/src/lib/analytics';
import { checkRateLimit } from '@/src/lib/rateLimit';
import { getOrCreateUser } from '@/src/lib/users';

const CheckoutSchema = z.object({
  nationality: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
  visaType: z.string().max(100).optional(),
  freeform: z.string().min(1).max(2000),
  depth: z.enum(['standard', 'deep']),
  inviteCode: z.string().max(100).optional(),
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rateCheck = await checkRateLimit(userId);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait before trying again.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...(rateCheck.retryAfter ? { 'Retry-After': String(rateCheck.retryAfter) } : {}),
      },
    });
  }

  const user = await getOrCreateUser(userId).catch(() => null);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { nationality, destination, visaType, freeform, depth, inviteCode } = parsed.data;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  let briefId: string;
  try {
    briefId = await createShellBrief({
      nationality,
      destination,
      visaType: visaType || undefined,
      freeform,
      depth,
      userId,
    });
  } catch (err) {
    log.error('createShellBrief failed', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'Failed to initialize brief. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Early access: redeem code at checkout if provided, or detect returning early access user
  let earlyAccess = false;
  if (inviteCode?.trim()) {
    const redeemResult = await redeemInviteCode(userId, inviteCode.trim());
    if (!redeemResult.ok) {
      await log.warn('checkout: invite code rejected', { userId, userEmail: user?.email ?? null, codeAttempted: inviteCode.trim(), reason: redeemResult.error });
      return new Response(JSON.stringify({ error: redeemResult.error }), {
        status: redeemResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    earlyAccess = true;
  } else {
    earlyAccess = await hasInviteAccess(userId);
  }

  if (earlyAccess) {
    try {
      const { error: jobError } = await getSupabase()
        .from('brief_jobs')
        .insert({ brief_id: briefId });

      if (jobError) throw new Error(jobError.message);

      await getSupabase()
        .from('briefs')
        .update({ payment_status: 'queued', funded_by: 'invite' })
        .eq('id', briefId);

      await incrementInviteUsage(userId);

      await trackEvent('invite.brief_started', { userId, briefId, depth, destination, nationality });
      log.info('checkout: invite bypass', { briefId, depth, userId, userEmail: user?.email ?? null, codeUsed: inviteCode?.trim() || 'returning_user' });

      return new Response(
        JSON.stringify({ checkoutUrl: `${baseUrl}/brief/pending?brief_id=${briefId}&depth=${depth}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      log.error('checkout: invite job queue failed', { briefId, error: err instanceof Error ? err.message : String(err) });
      return new Response(JSON.stringify({ error: 'Failed to queue brief. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `VisaScout ${depth.charAt(0).toUpperCase() + depth.slice(1)} Brief` },
          unit_amount: PRICES[depth].amount,
        },
        quantity: 1,
      }],
      metadata: { brief_id: briefId, user_id: userId, nationality, destination, depth },
      success_url: `${baseUrl}/brief/pending?brief_id=${briefId}&depth=${depth}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
    });

    await trackEvent('checkout.started', {
      userId,
      briefId,
      depth,
      destination,
      nationality,
      priceUsd: PRICES[depth].amount / 100,
    });
    log.info('checkout session created', { briefId, depth, destination, userEmail: user?.email ?? null });
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    log.error('stripe checkout creation failed', { error: err instanceof Error ? err.message : String(err), briefId });
    return new Response(JSON.stringify({ error: 'Failed to create checkout session. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
