-- Re-grade lift display: keep the prior score around so a returning grader
-- can see the delta (e.g. "+24 points since last time").
-- Populated by the Grader Email workflow inside the upsert leadRow.

ALTER TABLE grader_leads
  ADD COLUMN IF NOT EXISTS previous_score INT,
  ADD COLUMN IF NOT EXISTS previous_graded_at TIMESTAMPTZ;
