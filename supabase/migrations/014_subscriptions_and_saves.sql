-- ╭──────────────────────────────────────────────────────────────────────────╮
-- │ 014_subscriptions_and_saves.sql                                          │
-- │ Camada premium: assinatura recorrente (cartão) + atividades salvas.      │
-- │ Stripe é fonte da verdade; espelhamos status local via webhook.          │
-- ╰──────────────────────────────────────────────────────────────────────────╯

-- ─── 1. profiles.stripe_customer_id ──────────────────────────────────────────
-- Stripe Customer fica no nível de user (1:1). Subscriptions são 1:N por user.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- ─── 2. subscriptions ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_interval AS ENUM ('month', 'year');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_subscription_id      TEXT NOT NULL UNIQUE,
  stripe_customer_id          TEXT NOT NULL,
  stripe_price_id             TEXT NOT NULL,
  status                      subscription_status NOT NULL,
  price_brl_cents             INTEGER NOT NULL CHECK (price_brl_cents > 0),
  interval                    subscription_interval NOT NULL DEFAULT 'month',
  current_period_start        TIMESTAMPTZ,
  current_period_end          TIMESTAMPTZ,
  cancel_at_period_end        BOOLEAN NOT NULL DEFAULT false,
  canceled_at                 TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON public.subscriptions(user_id, created_at DESC);

-- Apenas uma assinatura "viva" por user. Status terminais (canceled, incomplete_expired)
-- não bloqueiam novas assinaturas no futuro.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_one_live_per_user
  ON public.subscriptions(user_id)
  WHERE status IN ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused');

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. saved_activities ─────────────────────────────────────────────────────
-- Bookmarks do usuário. Função premium: só assinantes salvam/listam (gate na API).
CREATE TABLE IF NOT EXISTS public.saved_activities (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id  UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_activities_user_created
  ON public.saved_activities(user_id, created_at DESC);

-- ─── 4. View: active_subscriptions ───────────────────────────────────────────
-- Subscriptions consideradas "premium acessível agora". past_due ainda libera
-- — Stripe tenta cobrar de novo automaticamente; só perde acesso após canceled.
CREATE OR REPLACE VIEW public.active_subscriptions AS
  SELECT *
  FROM public.subscriptions
  WHERE status IN ('active', 'trialing', 'past_due')
    AND (current_period_end IS NULL OR current_period_end > now());

-- ─── 5. RPC: is_subscription_active ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing', 'past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_subscription_active(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_subscription_active(UUID) FROM PUBLIC, anon;

-- ─── 6. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_activities  ENABLE ROW LEVEL SECURITY;

-- subscriptions: leitura própria; writes apenas via service_role (webhook + API).
CREATE POLICY "subscriptions: ler próprio" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions: insert via service_role" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "subscriptions: update via service_role" ON public.subscriptions
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "subscriptions: delete via service_role" ON public.subscriptions
  FOR DELETE USING (auth.role() = 'service_role');

-- saved_activities: usuário lê/escreve/deleta os próprios. Gate de assinatura
-- fica na API (mais simples de mudar e auditar do que via RLS dinâmica).
CREATE POLICY "saved_activities: ler próprio" ON public.saved_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_activities: insert próprio" ON public.saved_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_activities: delete próprio" ON public.saved_activities
  FOR DELETE USING (auth.uid() = user_id);
