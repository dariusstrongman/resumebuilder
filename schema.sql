-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Creates the session storage table for ResumeGo

CREATE TABLE IF NOT EXISTS resumego_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id text,
    user_email text,
    resume_text text,
    job_posting text,
    include_cover_letter boolean DEFAULT false,
    resume_result text,
    cover_letter_result text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- If the table already exists, add user_email (safe to re-run):
ALTER TABLE resumego_sessions ADD COLUMN IF NOT EXISTS user_email text;

-- Index used by the daily privacy cleanup cron
CREATE INDEX IF NOT EXISTS resumego_sessions_created_at_idx ON resumego_sessions (created_at);

-- RLS: service role only. Frontend never reads this table.
ALTER TABLE resumego_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON resumego_sessions;
CREATE POLICY "Service role full access" ON resumego_sessions FOR ALL USING (true) WITH CHECK (true);
