-- 2026-04-17 — Rate-limit counter table + RPC for Phase 7 security.

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket      TEXT NOT NULL,
  key         TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  expires_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (bucket, key)
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON rate_limit_counters (expires_at);

CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_bucket         TEXT,
  p_key            TEXT,
  p_limit          INT,
  p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot TEXT;
  v_cnt  INT;
BEGIN
  DELETE FROM rate_limit_counters WHERE expires_at < now() - interval '10 minutes';

  v_slot := p_key || ':' || floor(extract(epoch FROM now()) / p_window_seconds)::text;

  INSERT INTO rate_limit_counters AS r (bucket, key, count, expires_at)
    VALUES (p_bucket, v_slot, 1, now() + make_interval(secs => p_window_seconds * 2))
  ON CONFLICT (bucket, key) DO UPDATE
    SET count = r.count + 1
  RETURNING count INTO v_cnt;

  RETURN v_cnt <= p_limit;
END $$;

COMMENT ON FUNCTION public.rate_limit_check(TEXT, TEXT, INT, INT) IS
  'Fixed-window rate limiter. Returns true if the request should be allowed.';
