-- educando.app - Database Schema
-- Simplified schema: free-only, no credits, no versions

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  browser_id TEXT NOT NULL,
  original_prompt TEXT NOT NULL,
  improved_prompt TEXT,
  image_path TEXT NOT NULL,
  image_media_type TEXT NOT NULL DEFAULT 'image/png',
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
