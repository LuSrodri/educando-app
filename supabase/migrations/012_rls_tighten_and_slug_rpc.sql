-- 2026-05-10 — Tighten RLS on activities + define find_activity_by_id_suffix RPC.
--
-- Problem 1: The previous SELECT policy used USING (true), allowing any caller
-- with the anon key to read private user-generated activities directly via the
-- REST API, bypassing the application-layer guards.
--
-- Fix: restrict public reads to curated activities (user_id IS NULL).
-- Authenticated users may additionally read their own activities.
-- service_role (used by all server-side Next.js calls) bypasses RLS entirely
-- and is unaffected by this change.
--
-- Problem 2: getActivityBySlug() in lib/activities.ts called
-- find_activity_by_id_suffix RPC which was never defined, causing silent 404s
-- for all semantic-slug lookups.

-- ── 1. Replace the permissive SELECT policy ─────────────────────────────────

DROP POLICY IF EXISTS "activities: leitura pública" ON activities;

CREATE POLICY "activities: leitura pública"
  ON activities FOR SELECT
  USING (
    user_id IS NULL
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- ── 2. Define find_activity_by_id_suffix ────────────────────────────────────
-- Looks up an activity by the last 12 hex characters of its UUID.
-- UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
-- right(id::text, 12) returns the final 12-char segment, which is what
-- generateMaterialSlug / generatePersonalizadoSlug append to the slug.
-- SECURITY INVOKER: RLS on activities applies to the caller, so anon-key
-- callers only see rows they are allowed to read under the policy above.

CREATE OR REPLACE FUNCTION public.find_activity_by_id_suffix(p_suffix text)
RETURNS SETOF activities
LANGUAGE sql
STABLE
SECURITY INVOKER
PARALLEL SAFE
AS $$
  SELECT *
  FROM activities
  WHERE right(id::text, 12) = lower(p_suffix)
  LIMIT 2;
$$;

COMMENT ON FUNCTION public.find_activity_by_id_suffix(text) IS
  'Returns activity rows whose UUID ends with p_suffix (12 hex chars). '
  'Used by /material/[slug] and /personalizado/[slug] for semantic-slug lookups. '
  'Callers enforce their own ownership / curated-only checks after retrieval.';
