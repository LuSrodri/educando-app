-- Drop column if it exists from previous failed attempts
ALTER TABLE activities DROP COLUMN IF EXISTS semantic_slug;

-- Add semantic_slug as the last block of the UUID (always 12 hex chars, no hyphens)
-- split_part() is natively IMMUTABLE — no wrapper needed
ALTER TABLE activities
ADD COLUMN semantic_slug text GENERATED ALWAYS AS (
  split_part(id::text, '-', 5)
) STORED;

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_activities_semantic_slug ON activities (semantic_slug);
