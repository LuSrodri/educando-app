-- Migration: paid credits, Mercado Pago payments, activity visibility
-- Run this in Supabase SQL editor after deploying the updated app

-- 1. Add is_paid flag to activities (false = free credit, goes to community + Pinterest)
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_activities_is_paid ON activities(is_paid);

-- 2. Table: paid_credits
-- One row per browser_id; balance is decremented on each paid generation
CREATE TABLE IF NOT EXISTS paid_credits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id   TEXT NOT NULL,
  balance      INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_bought INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(browser_id)
);

CREATE INDEX IF NOT EXISTS idx_paid_credits_browser_id ON paid_credits(browser_id);

-- 3. Table: mercadopago_payments
-- Tracks each PIX payment attempt (pending → approved | rejected)
CREATE TABLE IF NOT EXISTS mercadopago_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id       TEXT NOT NULL,
  mp_payment_id    BIGINT UNIQUE,           -- filled after MP API responds
  mp_external_ref  TEXT NOT NULL UNIQUE,    -- our UUID, sent as external_reference to MP
  pack             TEXT NOT NULL,           -- '1', '10' or '20'
  amount_cents     INTEGER NOT NULL,        -- 490, 1490 or 2490
  credits_to_grant INTEGER NOT NULL,        -- 1, 10 or 20
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  qr_code          TEXT,                   -- PIX copia-e-cola string
  qr_code_base64   TEXT,                   -- PNG QR code image (base64)
  pix_expires_at   TIMESTAMPTZ,            -- 30 min from creation
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_payments_browser_id   ON mercadopago_payments(browser_id);
CREATE INDEX IF NOT EXISTS idx_mp_payments_ext_ref      ON mercadopago_payments(mp_external_ref);
CREATE INDEX IF NOT EXISTS idx_mp_payments_status       ON mercadopago_payments(status);

-- 4. Enable RLS on new tables (service_role via SUPABASE_SERVICE_ROLE_KEY bypasses RLS)
ALTER TABLE paid_credits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_payments ENABLE ROW LEVEL SECURITY;

-- No anon access to payment/credit tables — all operations go through Next.js API routes
-- using the service_role key, which bypasses RLS entirely.

-- 5. Atomic decrement function for paid credits
CREATE OR REPLACE FUNCTION decrement_paid_credits(p_browser_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
    FROM paid_credits
   WHERE browser_id = p_browser_id
   FOR UPDATE;

  IF v_balance IS NULL OR v_balance < 1 THEN
    RAISE EXCEPTION 'insufficient_paid_credits';
  END IF;

  UPDATE paid_credits
     SET balance    = balance - 1,
         updated_at = now()
   WHERE browser_id = p_browser_id;

  RETURN v_balance - 1;
END;
$$;
