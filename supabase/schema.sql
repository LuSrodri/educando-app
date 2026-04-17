-- educando.app - Database Schema (directory pivot, 2026-04-17)
-- This file reflects the current live schema. Migrations are the source of truth
-- under supabase/migrations/.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

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

-- Search telemetry
CREATE TABLE IF NOT EXISTS search_queries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query             TEXT NOT NULL,
  normalized_query  TEXT NOT NULL,
  fingerprint_hash  TEXT,
  results_count     INTEGER NOT NULL DEFAULT 0,
  external_fetched  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click telemetry
CREATE TABLE IF NOT EXISTS activity_clicks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  fingerprint_hash  TEXT,
  referrer          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Saved (replaces the old per-browser history concept)
CREATE TABLE IF NOT EXISTS saved_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash  TEXT NOT NULL,
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fingerprint_hash, activity_id)
);

-- Security identities (Phase 7: fingerprint+IP with rotation throttling)
CREATE TABLE IF NOT EXISTS security_identities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash  TEXT UNIQUE NOT NULL,
  fp_id             TEXT NOT NULL,
  ip_hash           TEXT NOT NULL,
  fp_last_changed   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_last_changed   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;
