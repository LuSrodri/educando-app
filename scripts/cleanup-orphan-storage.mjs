#!/usr/bin/env node
// Deletes storage objects in bucket `activities` whose row was removed during
// the 2026-04-17 purge. Source of truth: activities_backup_20260417 minus activities.
// Uses Supabase Storage API (direct SQL delete is blocked by storage.protect_delete trigger).

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(projectRoot, ".env");
if (!existsSync(envPath)) {
  console.error("[cleanup] .env not found at", envPath);
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
  console.error("[cleanup] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "activities";
const BATCH = 200;

async function fetchOrphanPaths() {
  // Use a raw RPC-style select via PostgREST's `rpc` would require a function.
  // Instead: query activities_backup_20260417 for ids not in activities.
  // PostgREST doesn't support `NOT IN (subquery)` directly, so we page both tables
  // and compute the diff in memory (manageable — ~4500 vs ~770).
  console.log("[cleanup] loading ids from activities (live)...");
  const liveIds = new Set();
  {
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("activities")
        .select("id")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const r of data) liveIds.add(r.id);
      if (data.length < pageSize) break;
      from += pageSize;
    }
  }
  console.log(`[cleanup]   live ids: ${liveIds.size}`);

  console.log("[cleanup] loading (id, image_path) from activities_backup_20260417...");
  const orphanPaths = [];
  {
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("activities_backup_20260417")
        .select("id, image_path")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const r of data) {
        if (!liveIds.has(r.id) && r.image_path) orphanPaths.push(r.image_path);
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }
  }
  const unique = Array.from(new Set(orphanPaths));
  console.log(`[cleanup]   orphan paths (unique): ${unique.length}`);
  return unique;
}

async function removeInBatches(paths) {
  let removed = 0;
  let notFound = 0;
  let errors = 0;
  for (let i = 0; i < paths.length; i += BATCH) {
    const chunk = paths.slice(i, i + BATCH);
    const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
    if (error) {
      console.error(`[cleanup] batch ${i}-${i + chunk.length} error:`, error.message);
      errors += chunk.length;
      continue;
    }
    const deletedNames = new Set((data ?? []).map((d) => d.name));
    removed += deletedNames.size;
    notFound += chunk.length - deletedNames.size;
    process.stdout.write(
      `\r[cleanup] processed ${Math.min(i + BATCH, paths.length)}/${paths.length} | removed=${removed} not_found=${notFound} errors=${errors}`,
    );
  }
  process.stdout.write("\n");
  return { removed, notFound, errors };
}

(async () => {
  const paths = await fetchOrphanPaths();
  if (paths.length === 0) {
    console.log("[cleanup] nothing to delete — exiting clean.");
    return;
  }
  const stats = await removeInBatches(paths);
  console.log("[cleanup] done", stats);
})().catch((e) => {
  console.error("[cleanup] fatal:", e);
  process.exit(1);
});
