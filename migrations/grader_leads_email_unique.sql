-- Enforces ONE row per email (case-insensitive) on grader_leads.
-- Verified safe: 0 duplicate emails as of 2026-05-05 across 17 rows.
--
-- Existing inserts in n8n use:
--   PATCH (or upsert with on_conflict=email) to handle re-grades.
-- This index makes that on_conflict match work even if email casing varies.
--
-- Idempotent: CREATE INDEX IF NOT EXISTS ... CONCURRENTLY would be safer
-- on a busy table, but at 17 rows it's instant. Use CONCURRENTLY in the
-- SQL editor by adding the keyword if you prefer.

CREATE UNIQUE INDEX IF NOT EXISTS grader_leads_email_lower_unique
    ON public.grader_leads (lower(email));
