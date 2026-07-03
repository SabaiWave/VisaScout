import { getSupabase } from './supabase';

export async function hasInviteAccess(clerkUserId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .not('invite_code', 'is', null)
    .is('invite_revoked_at', null)
    .single();
  return !!data;
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 409 | 500 };

export async function redeemInviteCode(
  clerkUserId: string,
  code: string,
): Promise<RedeemResult> {
  const validCodes = (process.env.INVITE_CODES ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!validCodes.includes(code)) {
    return { ok: false, error: 'Invalid invite code.', status: 400 };
  }

  // Idempotent — if user already has active invite access, treat as success
  const { data: alreadyActive } = await getSupabase()
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .not('invite_code', 'is', null)
    .is('invite_revoked_at', null)
    .single();

  if (alreadyActive) return { ok: true };

  // Code is single-use — check if consumed by any account (active or revoked)
  const { data: codeUsed } = await getSupabase()
    .from('users')
    .select('id')
    .eq('invite_code', code)
    .single();

  if (codeUsed) {
    return { ok: false, error: 'This invite code has already been used.', status: 409 };
  }

  // Check for existing user row (free user being upgraded, or previously revoked)
  const { data: existingUser } = await getSupabase()
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existingUser) {
    const { error } = await getSupabase()
      .from('users')
      .update({
        invite_code: code,
        invited_at: new Date().toISOString(),
        invite_revoked_at: null,
      })
      .eq('clerk_user_id', clerkUserId);
    if (error) return { ok: false, error: 'Failed to redeem code. Please try again.', status: 500 };
    return { ok: true };
  }

  // New user — insert
  const { error } = await getSupabase()
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      invite_code: code,
      invited_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: 'Failed to redeem code. Please try again.', status: 500 };
  return { ok: true };
}

export async function incrementInviteUsage(clerkUserId: string): Promise<void> {
  await getSupabase().rpc('increment_invite_usage', { p_user_id: clerkUserId });
}

export async function revokeInviteAccess(clerkUserId: string): Promise<void> {
  await getSupabase()
    .from('users')
    .update({ invite_revoked_at: new Date().toISOString() })
    .eq('clerk_user_id', clerkUserId)
    .not('invite_code', 'is', null)
    .is('invite_revoked_at', null);
}
