-- ════════════════════════════════════════════════════════════════════════
-- Dashboard self-reads: let users read their own session + pack rows
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
--
-- Why
--   The account dashboard shows the user's tailoring count and pack credits.
--   Both come from tables protected by RLS, so today the page proxies
--   through n8n with the service-role key. With these two SELECT policies
--   in place, the user's own JWT can read just their own rows. account.html
--   can then query Supabase directly and the n8n hop disappears entirely
--   for dashboard loads.
--
-- Safety
--   SELECT only. Existing INSERT / UPDATE / DELETE policies on these tables
--   are not touched, so writes still require the service role. The
--   predicates restrict reads to rows that belong to the requesting user.
--
-- Idempotency
--   Uses DROP POLICY IF EXISTS before CREATE so this file is safe to run
--   more than once.
-- ════════════════════════════════════════════════════════════════════════

-- 1. resumego_sessions: a user can SELECT their own rows
DROP POLICY IF EXISTS "users_read_own_sessions" ON public.resumego_sessions;
CREATE POLICY "users_read_own_sessions"
    ON public.resumego_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. resumego_packs: a user can SELECT packs whose user_email matches
--    their auth email (compared case-insensitively to handle stored case
--    variants vs the lower-cased email Supabase puts in the JWT).
DROP POLICY IF EXISTS "users_read_own_packs" ON public.resumego_packs;
CREATE POLICY "users_read_own_packs"
    ON public.resumego_packs
    FOR SELECT
    TO authenticated
    USING (lower(auth.jwt() ->> 'email') = lower(user_email));

-- Sanity check after running
--   select count(*) from resumego_sessions;            -- should equal your tailorings
--   select code, uses_remaining from resumego_packs;   -- should list only your own packs
