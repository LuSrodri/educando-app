/**
 * One-shot migration: move user-generated images from the public `activities`
 * bucket (legacy path user/{userId}/{activityId}/activity.png) to the private
 * `personalized` bucket (new path {activityId}/activity.png).
 *
 * Runs with: node scripts/migrate-user-images-to-personalized.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

// Load .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env")
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    process.env[key] ??= val
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function migrate() {
  // Find all activities with legacy user/ image paths
  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, image_path, user_id")
    .not("user_id", "is", null)
    .like("image_path", "user/%")

  if (error) {
    console.error("Failed to query activities:", error.message)
    process.exit(1)
  }

  if (!activities?.length) {
    console.log("No legacy images to migrate.")
    return
  }

  console.log(`Found ${activities.length} image(s) to migrate.\n`)

  let ok = 0
  let fail = 0

  for (const activity of activities) {
    const oldPath = activity.image_path
    // Extract activityId from user/{userId}/{activityId}/activity.png
    const parts = oldPath.split("/")
    const activityId = parts[2]
    const newPath = `${activityId}/activity.png`

    process.stdout.write(`  ${activityId}  ${oldPath} → personalized/${newPath} ... `)

    // 1. Download from old bucket
    const { data: blob, error: downloadErr } = await supabase.storage
      .from("activities")
      .download(oldPath)

    if (downloadErr || !blob) {
      console.log(`FAIL (download: ${downloadErr?.message ?? "empty"})`)
      fail++
      continue
    }

    const buffer = Buffer.from(await blob.arrayBuffer())

    // 2. Upload to personalized bucket
    const { error: uploadErr } = await supabase.storage
      .from("personalized")
      .upload(newPath, buffer, { contentType: "image/png", upsert: true })

    if (uploadErr) {
      console.log(`FAIL (upload: ${uploadErr.message})`)
      fail++
      continue
    }

    // 3. Update image_path in activities table
    const { error: updateErr } = await supabase
      .from("activities")
      .update({ image_path: newPath })
      .eq("id", activity.id)

    if (updateErr) {
      // Roll back the upload to avoid orphaned file
      await supabase.storage.from("personalized").remove([newPath])
      console.log(`FAIL (db update: ${updateErr.message})`)
      fail++
      continue
    }

    // 4. Delete old file from activities bucket
    const { error: deleteErr } = await supabase.storage
      .from("activities")
      .remove([oldPath])

    if (deleteErr) {
      // Non-fatal: file is orphaned in old bucket but DB and new bucket are correct
      console.log(`WARN (old file not deleted: ${deleteErr.message}) — DB updated OK`)
    } else {
      console.log("OK")
    }

    ok++
  }

  console.log(`\nDone: ${ok} migrated, ${fail} failed.`)
  if (fail > 0) process.exit(1)
}

migrate()
