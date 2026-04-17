-- 2026-04-17 — Pivot for pedagogical directory (Phase 2 migration).
-- Adds directory metadata columns to activities, plus telemetry, saved, and
-- security-identity tables. Legacy columns (browser_id, original_prompt,
-- improved_prompt, is_paid, semantic_slug) are retained until the legacy
-- pre-pivot code paths are fully deleted; a later migration will drop them.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS title             TEXT,
  ADD COLUMN IF NOT EXISTS theme             TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS long_description  TEXT,
  ADD COLUMN IF NOT EXISTS bncc_codes        TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS type              TEXT NOT NULL DEFAULT 'activity'
    CHECK (type IN ('activity', 'support_material')),
  ADD COLUMN IF NOT EXISTS source_url        TEXT,
  ADD COLUMN IF NOT EXISTS source_provider   TEXT NOT NULL DEFAULT 'internal'
    CHECK (source_provider IN ('internal', 'tavily')),
  ADD COLUMN IF NOT EXISTS quality_score     REAL,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS search_vector     tsvector;

CREATE OR REPLACE FUNCTION activities_refresh_search_vector() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.theme, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.short_description, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.long_description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(COALESCE(NEW.bncc_codes, '{}'::TEXT[]), ' ')), 'B');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_activities_search_vector ON activities;
CREATE TRIGGER trg_activities_search_vector
  BEFORE INSERT OR UPDATE OF title, theme, short_description, long_description, bncc_codes
  ON activities
  FOR EACH ROW EXECUTE FUNCTION activities_refresh_search_vector();

CREATE INDEX IF NOT EXISTS idx_activities_search_vector ON activities USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_activities_title_trgm    ON activities USING GIN (title  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_theme_trgm    ON activities USING GIN (theme  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_bncc_codes    ON activities USING GIN (bncc_codes);
CREATE INDEX IF NOT EXISTS idx_activities_type          ON activities (type);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS search_queries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query             TEXT NOT NULL,
  normalized_query  TEXT NOT NULL,
  fingerprint_hash  TEXT,
  results_count     INTEGER NOT NULL DEFAULT 0,
  external_fetched  INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at       ON search_queries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_fingerprint_hash ON search_queries (fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_search_queries_normalized       ON search_queries (normalized_query);

CREATE TABLE IF NOT EXISTS activity_clicks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  fingerprint_hash  TEXT,
  referrer          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_clicks_activity_id      ON activity_clicks (activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_clicks_fingerprint_hash ON activity_clicks (fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_activity_clicks_created_at       ON activity_clicks (created_at DESC);

CREATE TABLE IF NOT EXISTS saved_activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash  TEXT NOT NULL,
  activity_id       UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fingerprint_hash, activity_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_activities_fingerprint_hash ON saved_activities (fingerprint_hash);

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
CREATE INDEX IF NOT EXISTS idx_security_identities_fp_id   ON security_identities (fp_id);
CREATE INDEX IF NOT EXISTS idx_security_identities_ip_hash ON security_identities (ip_hash);
