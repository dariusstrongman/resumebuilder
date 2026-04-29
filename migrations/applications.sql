-- ════════════════════════════════════════════════════════════════════════
-- Applications tracker (Pro feature)
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
    company text,
    role text,
    status text NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied','interview','offer','rejected','ghosted','withdrawn')),
    applied_at timestamptz NOT NULL DEFAULT now(),
    follow_up_at timestamptz,
    notes text,
    source_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_user_id ON applications(user_id, applied_at DESC);
CREATE INDEX idx_applications_followup ON applications(user_id, follow_up_at)
    WHERE follow_up_at IS NOT NULL;

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users CRUD own applications" ON applications
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_applications_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION public.touch_applications_updated_at();
