-- 2026-04-17 — Drop fingerprint identity layer. Spam/abuse is now handled by
-- rate limit (IP-keyed), Turnstile (enrichment gate), Cloudflare WAF, and GPT
-- moderation. User identity returns with an auth layer when the paid plan
-- ships.

DROP TABLE IF EXISTS public.security_identities CASCADE;
DROP TABLE IF EXISTS public.saved_activities   CASCADE;

ALTER TABLE public.search_queries  DROP COLUMN IF EXISTS fingerprint_hash;
ALTER TABLE public.activity_clicks DROP COLUMN IF EXISTS fingerprint_hash;

DROP FUNCTION IF EXISTS public.grant_paid_credits(text, integer);
