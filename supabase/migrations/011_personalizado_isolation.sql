-- 2026-04-29 — Isola atividades personalizadas (user_id IS NOT NULL) do diretório público.
-- Atividades geradas por usuários aparecem APENAS em /personalizado/[slug] (auth + ownership).
-- O diretório (`/material/[slug]`, /api/search, listagens em `/`) é restrito ao acervo curado.

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
      AND a.user_id IS NULL
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
  'Accent-insensitive directory search (curated only — user_id IS NULL). Returns {"data": [...], "total": int}.';
