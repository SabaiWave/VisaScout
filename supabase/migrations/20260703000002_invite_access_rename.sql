-- Rename revoked_at → invite_revoked_at (clarifies relation to invite access)
ALTER TABLE visascout.users RENAME COLUMN revoked_at TO invite_revoked_at;

-- Drop access_type — redundant with invite_code IS NOT NULL as the gate
ALTER TABLE visascout.users DROP COLUMN IF EXISTS access_type;

-- Rename RPC increment_early_access_usage → increment_invite_usage
DROP FUNCTION IF EXISTS visascout.increment_early_access_usage(text);

CREATE OR REPLACE FUNCTION visascout.increment_invite_usage(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE visascout.users
  SET
    briefs_generated = COALESCE(briefs_generated, 0) + 1,
    last_brief_at    = NOW()
  WHERE clerk_user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION visascout.increment_invite_usage(text) TO service_role;
