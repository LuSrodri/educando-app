-- Enable RLS on tables that were left exposed in the public schema.
-- All four are written only server-side via SUPABASE_SERVICE_ROLE_KEY, which
-- bypasses RLS, so no policies are needed — anon/authenticated are denied.
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities_backup_20260417 ENABLE ROW LEVEL SECURITY;
