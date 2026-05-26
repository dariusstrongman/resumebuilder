-- Adds `already_customer` flag to grader_leads. Set to true when a row
-- is inserted for an email that already has a complete resumego_session.
-- Keeps `converted_at` semantically clean (= "converted from grader to
-- paid") while still surfacing existing customers who use the grader.
--
-- Idempotent. Apply by pasting into Supabase SQL Editor.

ALTER TABLE public.grader_leads
    ADD COLUMN IF NOT EXISTS already_customer boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS grader_leads_already_customer_idx
    ON public.grader_leads (already_customer)
    WHERE already_customer = true;

-- Backfill: any existing lead whose email matches a complete paid session
-- gets flagged true.
UPDATE public.grader_leads g
SET already_customer = true
WHERE already_customer = false
  AND EXISTS (
    SELECT 1
    FROM public.resumego_sessions s
    WHERE lower(s.user_email) = lower(g.email)
      AND s.status = 'complete'
  );
