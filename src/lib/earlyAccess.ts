import { getSupabase } from './supabase';

export async function isEarlyAccessUser(userId: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from('early_access_users')
    .select('id')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .single();
  return !!data;
}

export type RedeemResult =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 409 | 500 };

export async function redeemEarlyAccessCode(
  userId: string,
  code: string,
): Promise<RedeemResult> {
  const validCodes = (process.env.INVITE_CODES ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!validCodes.includes(code)) {
    return { ok: false, error: 'Invalid invite code.', status: 400 };
  }

  // Idempotent — if user already has active access, treat as success
  const { data: alreadyMember } = await getSupabase()
    .from('early_access_users')
    .select('id')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .single();

  if (alreadyMember) {
    return { ok: true };
  }

  // Code is single-use — check if consumed by any account (active or revoked)
  const { data: codeUsed } = await getSupabase()
    .from('early_access_users')
    .select('id')
    .eq('code_used', code)
    .single();

  if (codeUsed) {
    return { ok: false, error: 'This invite code has already been used.', status: 409 };
  }

  // Check for a revoked row for this user — re-activate with new code rather than insert (unique constraint on user_id)
  const { data: revokedRow } = await getSupabase()
    .from('early_access_users')
    .select('id')
    .eq('user_id', userId)
    .not('revoked_at', 'is', null)
    .single();

  if (revokedRow) {
    const { error } = await getSupabase()
      .from('early_access_users')
      .update({ code_used: code, revoked_at: null, redeemed_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) {
      return { ok: false, error: 'Failed to redeem code. Please try again.', status: 500 };
    }
    return { ok: true };
  }

  const { error } = await getSupabase()
    .from('early_access_users')
    .insert({ user_id: userId, code_used: code });

  if (error) {
    return { ok: false, error: 'Failed to redeem code. Please try again.', status: 500 };
  }

  return { ok: true };
}

export async function incrementEarlyAccessUsage(userId: string): Promise<void> {
  await getSupabase().rpc('increment_early_access_usage', { p_user_id: userId });
}

export async function revokeEarlyAccess(userId: string): Promise<void> {
  await getSupabase()
    .from('early_access_users')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);
}
