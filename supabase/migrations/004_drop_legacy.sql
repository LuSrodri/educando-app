-- 2026-04-17 — Drop legacy MP/Pinterest/credit tables, RPCs, and activity columns.
-- Phase 4 cleanup after the pivot; activities_backup_20260417 preserves originals.

UPDATE activities SET is_paid = false WHERE is_paid = true;

DROP TABLE IF EXISTS public.mercadopago_payments CASCADE;
DROP TABLE IF EXISTS public.paid_credits       CASCADE;
DROP TABLE IF EXISTS public.daily_usage        CASCADE;
DROP TABLE IF EXISTS public.browsers           CASCADE;

DROP FUNCTION IF EXISTS public.decrement_paid_credits(text);
DROP FUNCTION IF EXISTS public.grant_paid_credits(integer, text);

ALTER TABLE public.activities
  DROP COLUMN IF EXISTS browser_id,
  DROP COLUMN IF EXISTS original_prompt,
  DROP COLUMN IF EXISTS improved_prompt,
  DROP COLUMN IF EXISTS is_paid,
  DROP COLUMN IF EXISTS semantic_slug;
