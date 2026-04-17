-- educando.app - Database Schema (post-identity simplification)
-- Source of truth lives under supabase/migrations/. This file is a snapshot.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Core directory table.
CREATE TABLE IF NOT EXISTS activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_path        TEXT NOT NULL,
  image_media_type  TEXT NOT NULL DEFAULT 'image/png',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  title             TEXT,
  theme             TEXT,
  short_description TEXT,
  long_description  TEXT,
  bncc_codes        TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  type              TEXT NOT NULL DEFAULT 'activity'
                       CHECK (type IN ('activity', 'support_material')),
  source_url        TEXT,
  source_provider   TEXT NOT NULL DEFAULT 'internal'
                       CHECK (source_provider IN ('internal', 'tavily')),
  quality_score     REAL,
  search_vector     tsvector
);

CREATE INDEX IF NOT EXISTS idx_activities_search_vector ON activities USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_activities_title_trgm    ON activities USING GIN (title  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_theme_trgm    ON activities USING GIN (theme  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_bncc_codes    ON activities USING GIN (bncc_codes);
CREATE INDEX IF NOT EXISTS idx_activities_type          ON activities (type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at    ON activities (created_at DESC);

-- Search telemetry (no per-user identifier; aggregate only).
CREATE TABLE IF NOT EXISTS search_queries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query             TEXT NOT NULL,
  normalized_query  TEXT NOT NULL,
  results_count     INTEGER NOT NULL DEFAULT 0,
  external_fetched  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click telemetry.
CREATE TABLE IF NOT EXISTS activity_clicks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  referrer          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fixed-window rate limiter backed by RPC public.rate_limit_check.
CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket      TEXT NOT NULL,
  key         TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  expires_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (bucket, key)
);

-- Storage bucket (public read).
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;
