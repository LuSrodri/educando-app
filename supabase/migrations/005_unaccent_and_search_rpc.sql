-- 2026-04-17 — Accent-insensitive search.
-- Adds the unaccent extension, rewires the search_vector trigger to normalise
-- its inputs, rebuilds existing vectors, and exposes a search_activities RPC
-- used by /api/search.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE OR REPLACE FUNCTION activities_refresh_search_vector() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', public.immutable_unaccent(COALESCE(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', public.immutable_unaccent(COALESCE(NEW.theme, ''))), 'B') ||
    setweight(to_tsvector('portuguese', public.immutable_unaccent(COALESCE(NEW.short_description, ''))), 'C') ||
    setweight(to_tsvector('portuguese', public.immutable_unaccent(COALESCE(NEW.long_description, ''))), 'C') ||
    setweight(to_tsvector('simple', array_to_string(COALESCE(NEW.bncc_codes, '{}'::TEXT[]), ' ')), 'B');
  RETURN NEW;
END $$;

UPDATE activities SET title = title WHERE title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_title_unaccent_trgm
  ON activities USING GIN (public.immutable_unaccent(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_activities_theme_unaccent_trgm
  ON activities USING GIN (public.immutable_unaccent(theme) gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_activities(
  q text DEFAULT '',
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  WITH q_norm AS (
    SELECT
      public.immutable_unaccent(btrim(coalesce(q, ''))) AS qn,
      upper(regexp_replace(btrim(coalesce(q, '')), '\s+', '', 'g')) AS bncc_try
  ),
  matched AS (
    SELECT
      a.*,
      CASE
        WHEN (SELECT qn FROM q_norm) = '' THEN 0::real
        ELSE ts_rank(
          a.search_vector,
          websearch_to_tsquery('portuguese', (SELECT qn FROM q_norm))
        )
      END AS rank
    FROM activities a
    WHERE a.title IS NOT NULL
      AND (
        (SELECT qn FROM q_norm) = ''
        OR a.search_vector @@ websearch_to_tsquery('portuguese', (SELECT qn FROM q_norm))
        OR public.immutable_unaccent(coalesce(a.title, '')) ILIKE '%' || (SELECT qn FROM q_norm) || '%'
        OR public.immutable_unaccent(coalesce(a.theme, '')) ILIKE '%' || (SELECT qn FROM q_norm) || '%'
        OR (SELECT bncc_try FROM q_norm) = ANY(a.bncc_codes)
      )
  ),
  paged AS (
    SELECT
      id, image_path, image_media_type, created_at, updated_at,
      title, theme, short_description, long_description,
      bncc_codes, type, source_url, source_provider, quality_score,
      rank
    FROM matched
    ORDER BY rank DESC, created_at DESC
    LIMIT p_limit OFFSET GREATEST(p_offset, 0)
  )
  SELECT jsonb_build_object(
    'data',
      coalesce(
        (SELECT jsonb_agg(to_jsonb(p) - 'rank' ORDER BY p.rank DESC, p.created_at DESC) FROM paged p),
        '[]'::jsonb
      ),
    'total', (SELECT count(*) FROM matched)
  );
$$;

COMMENT ON FUNCTION public.search_activities(text, int, int) IS
  'Accent-insensitive directory search. Returns {"data": [...], "total": int}.';
