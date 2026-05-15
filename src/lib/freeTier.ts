import { getSupabase } from './supabase';

export const FREE_DAILY_LIMIT = 1;

export async function checkFreeTierCap(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await getSupabase()
    .from('free_brief_daily')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const count = (data as { count: number } | null)?.count ?? 0;
  return {
    allowed: count < FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - count),
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
