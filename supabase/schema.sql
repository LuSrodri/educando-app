-- educando.app - Database Schema
-- Free model: 3 activities per fortnight (quinzena), no login required
-- daily_usage.usage_date stores the fortnight start date (YYYY-MM-01 or YYYY-MM-16)
-- Paid model: R$14,90/10 atividades or R$24,90/20 atividades via Mercado Pago PIX
-- Paid activities (is_paid=true) are private — not shown in community or posted to Pinterest

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  improved_prompt TEXT,
  image_path TEXT NOT NULL,
  image_media_type TEXT NOT NULL DEFAULT 'image/png',
  is_paid BOOLEAN NOT NULL DEFAULT false,  -- true = private, not in community/Pinterest
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_browser_id ON activities(browser_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Browsers table
CREATE TABLE IF NOT EXISTS browsers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Daily usage table
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(browser_id, usage_date)
);

-- Paid credits table (one row per browser_id)
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

-- Mercado Pago PIX payments
CREATE TABLE IF NOT EXISTS mercadopago_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id       TEXT NOT NULL,
  mp_payment_id    BIGINT UNIQUE,
  mp_external_ref  TEXT NOT NULL UNIQUE,
  pack             TEXT NOT NULL,
  amount_cents     INTEGER NOT NULL,
  credits_to_grant INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  qr_code          TEXT,
  qr_code_base64   TEXT,
  pix_expires_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mp_payments_browser_id ON mercadopago_payments(browser_id);
CREATE INDEX IF NOT EXISTS idx_mp_payments_ext_ref    ON mercadopago_payments(mp_external_ref);
CREATE INDEX IF NOT EXISTS idx_mp_payments_status     ON mercadopago_payments(status);

-- Drop deprecated tables
DROP TABLE IF EXISTS credits;

-- =========================================
-- STORAGE
-- =========================================
-- Bucket para armazenar imagens das atividades
-- Caminho: {browser_id}/{activity_id}/activity.png
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

-- Politica: qualquer um pode ler (imagens sao publicas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public read access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'activities');
  END IF;
END $$;

-- Politica: service role pode inserir/atualizar/deletar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service role insert"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'activities');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service role update"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'activities');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Service role delete"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'activities');
  END IF;
END $$;
