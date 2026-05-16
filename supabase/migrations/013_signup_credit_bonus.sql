-- ╭──────────────────────────────────────────────────────────────────────────╮
-- │ 013_signup_credit_bonus.sql                                              │
-- │ Concede 1 crédito ao novo usuário no momento do sign up.                 │
-- │ Usuários já existentes permanecem com o saldo atual (a migração não      │
-- │ aplica retroativo: o trigger roda apenas em INSERT em auth.users).       │
-- ╰──────────────────────────────────────────────────────────────────────────╯

-- Idempotência: garante no máximo um bônus de signup por usuário, mesmo que o
-- trigger seja re-executado por algum motivo no futuro.
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_signup_bonus_unique
  ON public.credit_ledger(user_id)
  WHERE kind = 'adjustment' AND reason = 'signup_bonus';

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

  INSERT INTO public.credit_ledger (user_id, delta, kind, reason)
  VALUES (NEW.id, 1, 'adjustment', 'signup_bonus')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;
