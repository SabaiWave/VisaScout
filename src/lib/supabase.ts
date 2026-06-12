import { createClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, any, any> | null = null;

// Server-side singleton using the service role key.
// Lazy — not initialized at module load so Next.js build succeeds without env vars.
// Never expose this client to the browser — service role bypasses RLS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabase(): SupabaseClient<any, any, any> {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    _client = createClient(url, key, { db: { schema: 'visascout' }, auth: { persistSession: false } });
  }
  return _client;
}
