-- Security fix: revoke insert_brief execution from anon and authenticated roles.
-- The function is SECURITY DEFINER (runs as table owner) — granting it to anon
-- allows any holder of the anon key to bypass the briefs_insert_service_role_only
-- RLS policy and insert arbitrary rows. Service role only.
revoke execute on function visascout.insert_brief(jsonb) from anon, authenticated;
grant execute on function visascout.insert_brief(jsonb) to service_role;
