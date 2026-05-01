-- ════════════════════════════════════════════════════════════════════════
-- Profile avatar: column + Supabase Storage bucket + storage RLS
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
--
-- What this enables
--   Users can pick a built-in preset avatar OR upload their own image.
--   The chosen value lives in profiles.avatar:
--     * NULL                         → render the initials fallback
--     * "preset:<key>"               → render the matching gradient + emoji
--     * "https://...storage/.../..." → render the uploaded image
--
-- Safety
--   Storage policies restrict each user to their own folder (named by
--   their auth uid). Bucket is public-read so the URL can be embedded
--   in <img>. File size capped at 2 MB; only common image types allowed.
--
-- Idempotency
--   ADD COLUMN IF NOT EXISTS, ON CONFLICT DO NOTHING for the bucket
--   row, and DROP POLICY IF EXISTS before each CREATE POLICY.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Profile column
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar text;

-- 2. Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,                                -- public read URLs
    2097152,                             -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
    SET public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Storage RLS: users may write objects only inside a folder named
--    after their own auth uid. Read is wide-open because the bucket is
--    public, so we don't add a SELECT policy.
DROP POLICY IF EXISTS "users_upload_own_avatar" ON storage.objects;
CREATE POLICY "users_upload_own_avatar"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "users_update_own_avatar" ON storage.objects;
CREATE POLICY "users_update_own_avatar"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "users_delete_own_avatar" ON storage.objects;
CREATE POLICY "users_delete_own_avatar"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
