-- ╭──────────────────────────────────────────────────────────────────────────╮
-- │ 010_user_accounts.sql                                                    │
-- │ Camada de monetização: contas, pagamentos e crédito-razão (ledger).      │
-- │ Padrão: RLS habilitado em tudo; writes via service_role; leitura         │
-- │ escopada por auth.uid().                                                 │
-- ╰──────────────────────────────────────────────────────────────────────────╯

-- ─── 1. profiles ─────────────────────────────────────────────────────────────
-- Espelha campos selecionados de auth.users para uso em FK e queries server-side.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. payment_intents ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE payment_pack_code AS ENUM ('experimentar', 'popular', 'melhor_valor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_intent_status AS ENUM ('pending', 'paid', 'failed', 'canceled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_session_id         TEXT UNIQUE,
  stripe_payment_intent_id  TEXT UNIQUE,
  pack_code                 payment_pack_code NOT NULL,
  credits_amount            INTEGER NOT NULL CHECK (credits_amount > 0),
  amount_brl_cents          INTEGER NOT NULL CHECK (amount_brl_cents > 0),
  status                    payment_intent_status NOT NULL DEFAULT 'pending',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                   TIMESTAMPTZ,
  expires_at                TIMESTAMPTZ,
  metadata                  JSONB NOT NULL DEFAULT '{}'::JSONB
);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user
  ON public.payment_intents(user_id, created_at DESC);

-- ─── 3. credit_ledger (append-only, deltas assinados) ────────────────────────
DO $$ BEGIN
  CREATE TYPE credit_entry_kind AS ENUM ('purchase', 'consume', 'refund', 'expire', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  delta              INTEGER NOT NULL CHECK (delta <> 0),
  kind               credit_entry_kind NOT NULL,
  reason             TEXT,
  payment_intent_id  UUID REFERENCES public.payment_intents(id) ON DELETE RESTRICT,
  activity_id        UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  expires_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user
  ON public.credit_ledger(user_id, created_at DESC);

-- Idempotência: cada payment_intent gera no máximo um lançamento de "purchase".
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_purchase_idempotency
  ON public.credit_ledger(payment_intent_id)
  WHERE kind = 'purchase';

-- ─── 4. activities.user_id (NULL = diretório curado/cron) ────────────────────
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_activities_user
  ON public.activities(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- ─── 5. Função: saldo atual de créditos não-expirados ────────────────────────
CREATE OR REPLACE FUNCTION public.current_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER
  FROM public.credit_ledger
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.current_credit_balance(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_credit_balance(UUID) FROM PUBLIC, anon;

-- ─── 6. Trigger: cria profile automaticamente em auth.users ──────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 7. Trigger: updated_at em profiles ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 8. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger   ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: ler próprio" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles: atualizar próprio" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: insert via service_role" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "profiles: delete via service_role" ON public.profiles
  FOR DELETE USING (auth.role() = 'service_role');

-- payment_intents
CREATE POLICY "payment_intents: ler próprio" ON public.payment_intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_intents: insert via service_role" ON public.payment_intents
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "payment_intents: update via service_role" ON public.payment_intents
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "payment_intents: delete via service_role" ON public.payment_intents
  FOR DELETE USING (auth.role() = 'service_role');

-- credit_ledger
CREATE POLICY "credit_ledger: ler próprio" ON public.credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "credit_ledger: insert via service_role" ON public.credit_ledger
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "credit_ledger: update via service_role" ON public.credit_ledger
  FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "credit_ledger: delete via service_role" ON public.credit_ledger
  FOR DELETE USING (auth.role() = 'service_role');
