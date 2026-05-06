-- Captures the existing `subscriptions` table on jjiizicwjldusuteffnb.
-- Idempotent — safe to re-run. Only creates objects that do not exist.
--
-- This table tracks Stripe subscriptions for Pro users:
--   - One row per active Stripe subscription (or comp grant)
--   - `stripe_subscription_id` of "admin_comp_<user_id>" denotes a manual grant
--   - `current_period_end` 2099-12-31 denotes lifetime/admin grants

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id       text,
    stripe_subscription_id   text,
    plan                     text NOT NULL,
    status                   text NOT NULL,
    current_period_start     timestamptz,
    current_period_end       timestamptz,
    cancel_at_period_end     boolean NOT NULL DEFAULT false,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
    ON public.subscriptions (user_id);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
    ON public.subscriptions (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx
    ON public.subscriptions (status)
    WHERE status = 'active';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
