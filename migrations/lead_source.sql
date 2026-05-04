-- Add lead_source so grader_leads can hold leads from multiple free tools
-- (grader, readability checker, etc.) and the drip workflow can route by source.

ALTER TABLE grader_leads
  ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'grader';

UPDATE grader_leads SET lead_source = 'grader' WHERE lead_source IS NULL;

CREATE INDEX IF NOT EXISTS grader_leads_source_idx ON grader_leads (lead_source);
