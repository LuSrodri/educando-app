-- Expand search_queries with pipeline observability columns so anomalies like
-- "enrichment never triggered" or "classifier rejected everything" are answerable
-- in SQL instead of guesswork from HTTP status codes.

ALTER TABLE public.search_queries
  ALTER COLUMN results_count DROP NOT NULL,
  ALTER COLUMN external_fetched DROP NOT NULL;

ALTER TABLE public.search_queries
  ADD COLUMN outcome TEXT NOT NULL DEFAULT 'ok'
    CHECK (outcome IN (
      'ok',
      'search_rate_limited',
      'moderation_rejected',
      'turnstile_failed',
      'enrichment_rate_limited',
      'error'
    )),
  ADD COLUMN moderation_reason TEXT,
  ADD COLUMN page INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN enrichment_triggered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN candidates_inspected INTEGER,
  ADD COLUMN candidates_rejected INTEGER,
  ADD COLUMN candidates_failed INTEGER,
  ADD COLUMN duration_ms INTEGER;

CREATE INDEX idx_search_queries_outcome_created
  ON public.search_queries (outcome, created_at DESC);

CREATE INDEX idx_search_queries_enriched
  ON public.search_queries (created_at DESC)
  WHERE enrichment_triggered = true;
