-- ════════════════════════════════════════════════════════════════════════
-- Profile self-update: let users INSERT and UPDATE their own profile row
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
--
-- Why
--   The dashboard exposes an inline edit for display_name. Saving it from
--   the client uses upsert(), which RLS treats as INSERT-on-conflict.
--   Without an INSERT policy that allows id = auth.uid(), the save fails
--   with "new row violates row-level security policy for table profiles".
--
-- Safety
--   The predicate restricts both inserts and updates to a row whose id
--   equals the caller's auth uid. A user cannot create or modify another
--   user's profile. Existing SELECT policy is untouched.
--
-- Idempotency
--   DROP POLICY IF EXISTS before CREATE so this is safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

-- INSERT: a user can create the row whose id matches their auth uid.
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
CREATE POLICY "users_insert_own_profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- UPDATE: a user can modify only their own profile row, and the new row
-- must still belong to them.
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
