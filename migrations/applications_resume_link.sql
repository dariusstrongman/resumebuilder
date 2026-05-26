-- Link each tracked application to the specific resume version used.
-- Unlocks per-resume outcome stats: "this saved resume got 4 interviews
-- in 10 apps, twice the rate of the other version."
-- Idempotent.
--
-- Apply by pasting into Supabase SQL Editor.

ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS resume_session_id uuid
    REFERENCES public.resumego_sessions(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_resume_session_id_idx
    ON public.applications (resume_session_id)
    WHERE resume_session_id IS NOT NULL;
