import { getSupabase } from './supabase';
import { getOrCreateUser } from './users';

// Lazy — evaluated at call time so Next.js build doesn't fail on missing env vars
export function getFreeDailyLimit(): number {
  return parseInt(process.env.MAX_BRIEFS_USER ?? '1', 10);
}
export function getAdminDailyLimit(): number {
  return parseInt(process.env.MAX_BRIEFS_ADMIN ?? '50', 10);
}

export async function checkFreeTierCap(clerkUserId: string, limit: number = getFreeDailyLimit()): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { id: internalUserId } = await getOrCreateUser(clerkUserId);
  const { data } = await getSupabase()
    .from('free_brief_daily')
    .select('count')
    .eq('user_id', internalUserId)
    .eq('date', today)
    .maybeSingle();

  const count = (data as { count: number } | null)?.count ?? 0;
  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
  };
}

export async function incrementFreeTierCount(clerkUserId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { id: internalUserId } = await getOrCreateUser(clerkUserId);
  await getSupabase().rpc('increment_free_daily_count', {
    p_user_id: internalUserId,
    p_date: today,
  });
}

export async function logIpAbuse(ip: string, userId: string, reason: string): Promise<void> {
  await getSupabase()
    .from('ip_abuse_log')
    .insert({ ip, user_id: userId, reason });
}
