import { getSupabase } from './supabase';

export const FREE_DAILY_LIMIT = parseInt(process.env.MAX_BRIEFS_USER ?? '1', 10);
export const ADMIN_DAILY_LIMIT = parseInt(process.env.MAX_BRIEFS_ADMIN ?? '50', 10);

export async function checkFreeTierCap(userId: string, limit: number = FREE_DAILY_LIMIT): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await getSupabase()
    .from('free_brief_daily')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const count = (data as { count: number } | null)?.count ?? 0;
  return {
    allowed: count < limit,
    remaining: Math.max(0, limit - count),
  };
}

export async function incrementFreeTierCount(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await getSupabase().rpc('increment_free_daily_count', {
    p_user_id: userId,
    p_date: today,
  });
}

export async function logIpAbuse(ip: string, userId: string, reason: string): Promise<void> {
  await getSupabase()
    .from('ip_abuse_log')
    .insert({ ip, user_id: userId, reason });
}
