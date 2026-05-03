-- ════════════════════════════════════════════════════════════════════════
-- Grader leads — drip campaign columns + unsubscribe support
-- Run in Supabase SQL Editor for project: jjiizicwjldusuteffnb
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE grader_leads
    ADD COLUMN IF NOT EXISTS drip_count    int         NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_drip_at  timestamptz,
    ADD COLUMN IF NOT EXISTS unsubscribed  boolean     NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS unsub_token   text;

-- Backfill tokens for existing rows
UPDATE grader_leads
   SET unsub_token = encode(gen_random_bytes(16), 'hex')
 WHERE unsub_token IS NULL;

-- Make tokens unique + indexed for fast lookup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grader_leads_unsub_token_key'
    ) THEN
        ALTER TABLE grader_leads
            ADD CONSTRAINT grader_leads_unsub_token_key UNIQUE (unsub_token);
    END IF;
END$$;

-- Index that supports the drip-eligibility query
CREATE INDEX IF NOT EXISTS idx_grader_leads_drip_eligible
    ON grader_leads (drip_count, created_at)
    WHERE unsubscribed = false AND converted_at IS NULL;
