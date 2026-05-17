-- ╭──────────────────────────────────────────────────────────────────────────╮
-- │ 015_narrow_subscription_uniqueness.sql                                   │
-- │ Estreita o índice unique parcial de subscriptions: só 1 sub "vivendo de  │
-- │ verdade" por user. Estados de transição (incomplete, unpaid, paused)    │
-- │ podem coexistir — antigamente bloqueavam UPSERT de novas tentativas.    │
-- ╰──────────────────────────────────────────────────────────────────────────╯

DROP INDEX IF EXISTS public.idx_subscriptions_one_live_per_user;

CREATE UNIQUE INDEX idx_subscriptions_one_live_per_user
  ON public.subscriptions(user_id)
  WHERE status IN ('trialing', 'active', 'past_due');
