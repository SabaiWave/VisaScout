/**
 * Backfills email addresses for all visascout.users rows where email IS NULL.
 * Calls Clerk Users API for each row, then updates the DB.
 *
 * Run against dev:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CLERK_SECRET_KEY=... npx tsx scripts/backfill-user-emails.ts
 * Run against prod: same with prod credentials
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clerkKey = process.env.CLERK_SECRET_KEY;

  if (!url || !key || !clerkKey) {
    console.error('Missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CLERK_SECRET_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { db: { schema: 'visascout' } });

  const { data: users, error } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .is('email', null);

  if (error) {
    console.error('Failed to fetch users:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users with null email — nothing to do.');
    return;
  }

  console.log(`Backfilling ${users.length} user(s)...`);

  for (const user of users as { id: string; clerk_user_id: string }[]) {
    try {
      const res = await fetch(`https://api.clerk.com/v1/users/${user.clerk_user_id}`, {
        headers: { Authorization: `Bearer ${clerkKey}` },
      });

      if (!res.ok) {
        console.warn(`  SKIP ${user.clerk_user_id} — Clerk API ${res.status}`);
        continue;
      }

      const clerkUser = await res.json() as { email_addresses?: { email_address: string }[] };
      const email = clerkUser.email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn(`  SKIP ${user.clerk_user_id} — no email on Clerk account`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ email })
        .eq('id', user.id);

      if (updateError) {
        console.error(`  FAIL ${user.clerk_user_id}: ${updateError.message}`);
      } else {
        console.log(`  OK   ${user.clerk_user_id} → ${email}`);
      }
    } catch (err) {
      console.error(`  ERROR ${user.clerk_user_id}:`, err);
    }
  }

  console.log('Done.');
}

main();
