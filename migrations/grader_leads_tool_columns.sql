-- Adds the three "tool_*" columns that landed in prod via the SQL editor
-- without a migration file. Captures the schema so future restores work.
-- Idempotent — uses ADD COLUMN IF NOT EXISTS.
--
-- Context:
--   - `tool_score`   numeric — composite score across grader + adjacent tools
--   - `tool_payload` jsonb   — raw output from each tool that touched this lead
--   - `tools_used`   text[]  — list of tool slugs the lead has interacted with
-- These power the "have you tried our other tools" cross-promo logic.

ALTER TABLE public.grader_leads
    ADD COLUMN IF NOT EXISTS tool_score numeric;

ALTER TABLE public.grader_leads
    ADD COLUMN IF NOT EXISTS tool_payload jsonb;

ALTER TABLE public.grader_leads
    ADD COLUMN IF NOT EXISTS tools_used text[];

-- Index `tools_used` so we can filter "has touched tool X" cheaply
CREATE INDEX IF NOT EXISTS grader_leads_tools_used_idx
    ON public.grader_leads USING gin (tools_used);
