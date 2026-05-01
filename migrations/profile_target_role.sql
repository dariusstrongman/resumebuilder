-- ════════════════════════════════════════════════════════════════════════
-- Add target_role column to profiles
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
--
-- Why
--   Lets users set "looking for: <role>" on their dashboard so the page
--   feels personal. Down the line this could also feed the tailoring
--   prompt as default context.
--
-- Notes
--   Existing self-update RLS policies on profiles already cover this
--   column (they're granted on the whole row), so no policy changes are
--   needed. Idempotent: ADD COLUMN IF NOT EXISTS.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS target_role text;
