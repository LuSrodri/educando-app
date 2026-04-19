#!/usr/bin/env node
// Removes explicit object paths from the `activities` storage bucket.
// Usage: node scripts/purge-storage-paths.mjs "path/one.png" "path/two.jpg" ...
// Direct SQL delete is blocked by storage.protect_delete; this uses the Storage API.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(projectRoot, ".env");
if (!existsSync(envPath)) {
  console.error("[purge] .env not found at", envPath);
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("[purge] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("[purge] no paths provided — pass storage paths as args");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "activities";

const { data, error } = await supabase.storage.from(BUCKET).remove(paths);
if (error) {
  console.error("[purge] error:", error.message);
  process.exit(1);
}
const deleted = new Set((data ?? []).map((d) => d.name));
for (const p of paths) {
  console.log(deleted.has(p) ? `  removed:   ${p}` : `  not_found: ${p}`);
}
console.log(`[purge] done: ${deleted.size}/${paths.length} removed`);
