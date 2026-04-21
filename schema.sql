-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- Creates the session storage table for ResumeGo

CREATE TABLE IF NOT EXISTS resumego_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_session_id text,
    resume_text text,
    job_posting text,
    include_cover_letter boolean DEFAULT false,
    resume_result text,
    cover_letter_result text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Allow service role full access
ALTER TABLE resumego_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON resumego_sessions FOR ALL USING (true) WITH CHECK (true);
