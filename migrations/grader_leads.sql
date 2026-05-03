-- ════════════════════════════════════════════════════════════════════════
-- Grader email-capture leads (free → paid funnel)
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS grader_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    score int,
    ats_score int,
    grade_letter text,
    user_agent text,
    ip text,
    referer text,
    converted_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grader_leads_email ON grader_leads(email);
CREATE INDEX IF NOT EXISTS idx_grader_leads_created ON grader_leads(created_at DESC);

-- Server-only writes via service role; no anon access.
ALTER TABLE grader_leads ENABLE ROW LEVEL SECURITY;
