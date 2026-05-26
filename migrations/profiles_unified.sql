-- Unified user profile fields. Set once on /account.html, consumed by
-- the tailor form, STAR coach, Career Roadmap, and (later) job matching.
-- All nullable so existing rows stay valid. Idempotent.
--
-- Apply by pasting into Supabase SQL Editor.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS current_title       text,
    ADD COLUMN IF NOT EXISTS years_experience    integer,
    ADD COLUMN IF NOT EXISTS target_salary_min   integer,
    ADD COLUMN IF NOT EXISTS target_salary_max   integer,
    ADD COLUMN IF NOT EXISTS target_location     text,
    ADD COLUMN IF NOT EXISTS open_to_remote      boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS work_auth           text;

-- Light sanity checks. Drop-and-recreate so changing the rule is one paste.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_years_experience_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_years_experience_check
    CHECK (years_experience IS NULL OR (years_experience >= 0 AND years_experience <= 60));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_salary_range_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_salary_range_check
    CHECK (
        target_salary_min IS NULL
        OR target_salary_max IS NULL
        OR target_salary_min <= target_salary_max
    );

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_work_auth_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_work_auth_check
    CHECK (
        work_auth IS NULL
        OR work_auth IN ('us_citizen', 'green_card', 'h1b', 'opt_cpt', 'needs_sponsorship', 'other')
    );
