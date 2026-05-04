-- Cart abandonment recovery: track which abandoned checkouts have been emailed.
-- A "pending" row in resumego_sessions older than 1h with a user_email and no
-- recovery_sent_at is an abandonment lead.

ALTER TABLE resumego_sessions
  ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS resumego_sessions_recovery_idx
  ON resumego_sessions (status, recovery_sent_at, created_at)
  WHERE status = 'pending';
