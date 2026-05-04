-- Career Outlook + 90-Day Action Plan (Pro feature).
-- One row per outlook generation. User can have multiple over time.

CREATE TABLE IF NOT EXISTS career_outlooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  intake jsonb NOT NULL,
  outlook jsonb NOT NULL,
  plan jsonb NOT NULL,
  plan_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  checkin_cadence text NOT NULL DEFAULT 'monthly',
  next_checkin_at timestamptz,
  last_checkin_at timestamptz,
  checkins_sent int NOT NULL DEFAULT 0,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS career_outlooks_user_idx ON career_outlooks (user_id);
CREATE INDEX IF NOT EXISTS career_outlooks_email_idx ON career_outlooks (email);
CREATE INDEX IF NOT EXISTS career_outlooks_checkin_idx
  ON career_outlooks (next_checkin_at)
  WHERE cancelled_at IS NULL AND checkins_sent < 3;
CREATE UNIQUE INDEX IF NOT EXISTS career_outlooks_token_idx ON career_outlooks (status_token);

ALTER TABLE career_outlooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS career_outlooks_self_read ON career_outlooks;
CREATE POLICY career_outlooks_self_read ON career_outlooks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS career_outlooks_self_update ON career_outlooks;
CREATE POLICY career_outlooks_self_update ON career_outlooks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
