-- Migration owned by another SBW project (YouTube pipeline tool).
-- Stored here so supabase CLI migration history stays in sync on the shared sbw-dev project.
-- DO NOT modify or remove — this file represents remote state, not VisaScout state.

CREATE TABLE IF NOT EXISTS users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   text        UNIQUE NOT NULL,
  email      text        NOT NULL,
  tier       text        NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_owner_policy" ON users
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

CREATE TABLE IF NOT EXISTS channel_configs (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                    text        NOT NULL,
  niche                   text        NOT NULL,
  tone                    text        NOT NULL,
  script_structure        text        NOT NULL DEFAULT 'hook-story-lesson-cta',
  target_duration_min     int         NOT NULL DEFAULT 8,
  forbidden_topics        text[]      NOT NULL DEFAULT '{}',
  voice_id                text        NOT NULL,
  voice_model             text        NOT NULL DEFAULT 'eleven_multilingual_v2',
  yt_title_template       text        NOT NULL DEFAULT '{topic} | {channel}',
  yt_description_template text        NOT NULL DEFAULT '',
  yt_tags                 text[]      NOT NULL DEFAULT '{}',
  yt_category_id          text        NOT NULL DEFAULT '22',
  yt_privacy              text        NOT NULL DEFAULT 'private',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE channel_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_configs_owner_policy" ON channel_configs
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON channel_configs TO authenticated;
CREATE INDEX IF NOT EXISTS idx_channel_configs_user_id ON channel_configs(user_id);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  config_id       uuid        REFERENCES channel_configs(id) ON DELETE SET NULL,
  topic           text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending',
  research_result jsonb,
  script_result   jsonb,
  voice_result    jsonb,
  publish_result  jsonb,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipeline_runs_owner_policy" ON pipeline_runs
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON pipeline_runs TO authenticated;
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_user_id   ON pipeline_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_config_id ON pipeline_runs(config_id);

CREATE TABLE IF NOT EXISTS usage_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id     uuid        REFERENCES pipeline_runs(id) ON DELETE SET NULL,
  event_type text        NOT NULL,
  chars_used int,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_logs_owner_policy" ON usage_logs
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON usage_logs TO authenticated;
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_run_id  ON usage_logs(run_id);

CREATE TABLE IF NOT EXISTS user_youtube_tokens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  access_token  text        NOT NULL,
  refresh_token text        NOT NULL,
  token_expiry  timestamptz NOT NULL,
  scope         text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_youtube_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_youtube_tokens_owner_policy" ON user_youtube_tokens
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON user_youtube_tokens TO authenticated;
