import { clerkClient } from '@clerk/nextjs/server';
import { getSupabase } from './supabase';

export interface UserRecord {
  id: string;
  clerk_user_id: string;
  email: string | null;
  invite_code: string | null;
  invite_revoked_at: string | null;
  briefs_generated: number;
}

const USER_FIELDS = 'id, clerk_user_id, email, invite_code, invite_revoked_at, briefs_generated';

export async function incrementUserBriefCount(internalUserId: string): Promise<void> {
  await getSupabase().rpc('increment_user_brief_count', { p_user_id: internalUserId });
}

async function fetchClerkEmail(clerkUserId: string): Promise<string | null> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    return user.emailAddresses?.[0]?.emailAddress ?? null;
  } catch {
    return null;
  }
}

export async function getOrCreateUser(clerkUserId: string): Promise<UserRecord> {
  const { data: existing } = await getSupabase()
    .from('users')
    .select(USER_FIELDS)
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (existing) return existing as UserRecord;

  const email = await fetchClerkEmail(clerkUserId);

  const { data: created, error } = await getSupabase()
    .from('users')
    .insert({ clerk_user_id: clerkUserId, email })
    .select(USER_FIELDS)
    .single();

  if (error || !created) throw new Error(`Failed to create user record: ${error?.message ?? 'unknown'}`);
  return created as UserRecord;
}

export async function syncUserEmail(clerkUserId: string): Promise<void> {
  const email = await fetchClerkEmail(clerkUserId);
  if (!email) return;
  await getSupabase()
    .from('users')
    .update({ email })
    .eq('clerk_user_id', clerkUserId);
}
