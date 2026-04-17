#!/usr/bin/env node
// Phase 3 backfill: derive title / theme / short_description / long_description /
// bncc_codes / type for every activity where title IS NULL, using gpt-5.4-nano.
//
// Inputs fed to the model: original_prompt, improved_prompt, and the activity image
// (fetched from the public Storage URL). Output is a JSON Schema-constrained object.
//
// Usage:
//   node scripts/backfill-directory-metadata.mjs [--limit=N] [--concurrency=N] [--dry-run]

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const LIMIT = args.limit ? Number(args.limit) : null;
const CONCURRENCY = args.concurrency ? Number(args.concurrency) : 10;
const DRY_RUN = args["dry-run"] === "true";
const MODEL = "gpt-5.4-nano";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const env = loadEnv(join(projectRoot, ".env"));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = [
  "Você é um classificador pedagógico brasileiro. Recebe o prompt que originou uma atividade,",
  "uma versão melhorada desse prompt e a imagem final. Devolve metadados em pt-BR para um",
  "diretório de materiais pedagógicos alinhado à BNCC.",
  "",
  "Regras:",
  '- "title": nome curto e claro em pt-BR (3–80 caracteres), sem aspas nem pontuação final.',
  '- "theme": tema/disciplina principal em pt-BR (ex.: "Alfabetização", "Matemática — Tabuada", "Ciências da Natureza", "Educação Socioemocional").',
  '- "short_description": 1 frase (50–200 caracteres) explicando o material.',
  '- "long_description": 2–4 frases (200–900 caracteres) com faixa etária/ano, habilidades trabalhadas e sugestão de uso.',
  '- "bncc_codes": array de códigos BNCC aplicáveis (ex.: "EI03EF01", "EF01LP04", "EF06MA07", "EM13LGG204"). Pode ser vazio se não houver código claramente aplicável. NUNCA invente códigos.',
  '- "type": "activity" se for atividade para o aluno resolver (exercícios, perguntas, espaços para responder); "support_material" se for material de referência/apoio para o professor (pôster, cartaz, tabela, cronograma, lista de referência, ficha de rotina).',
  "",
  "Responda ESTRITAMENTE conforme o JSON Schema fornecido.",
].join("\n");

const JSON_SCHEMA = {
  name: "directory_metadata",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 120 },
      theme: { type: "string", minLength: 2, maxLength: 60 },
      short_description: { type: "string", minLength: 30, maxLength: 240 },
      long_description: { type: "string", minLength: 80, maxLength: 1200 },
      bncc_codes: {
        type: "array",
        items: { type: "string", pattern: "^(EI|EF|EM)[0-9A-Z]{2,10}$" },
      },
      type: { type: "string", enum: ["activity", "support_material"] },
    },
    required: ["title", "theme", "short_description", "long_description", "bncc_codes", "type"],
  },
};

function loadEnv(path) {
  if (!existsSync(path)) throw new Error(`.env not found at ${path}`);
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

function publicImageUrl(imagePath) {
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/activities/${imagePath}`;
}

async function classifyOne(row) {
  const userContent = [
    {
      type: "text",
      text: [
        `Prompt original do professor: ${row.original_prompt}`,
        `Prompt melhorado (se houver): ${row.improved_prompt ?? "(nenhum)"}`,
      ].join("\n"),
    },
    { type: "image_url", image_url: { url: publicImageUrl(row.image_path) } },
  ];

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw) throw new Error("empty completion");
  return JSON.parse(raw);
}

async function updateRow(id, meta) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from("activities")
    .update({
      title: meta.title,
      theme: meta.theme,
      short_description: meta.short_description,
      long_description: meta.long_description,
      bncc_codes: meta.bncc_codes,
      type: meta.type,
    })
    .eq("id", id);
  if (error) throw error;
}

async function processWithRetry(row, attempt = 1) {
  try {
    const meta = await classifyOne(row);
    await updateRow(row.id, meta);
    return { ok: true, id: row.id, meta };
  } catch (e) {
    if (attempt < 3) {
      const wait = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      return processWithRetry(row, attempt + 1);
    }
    return { ok: false, id: row.id, error: e?.message ?? String(e) };
  }
}

async function runPool(rows) {
  let idx = 0;
  let done = 0;
  let ok = 0;
  let fail = 0;
  const failures = [];
  const start = Date.now();

  async function worker() {
    while (idx < rows.length) {
      const row = rows[idx++];
      const r = await processWithRetry(row);
      done++;
      if (r.ok) ok++;
      else {
        fail++;
        failures.push({ id: r.id, error: r.error });
      }
      if (done % 10 === 0 || done === rows.length) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        const rate = (done / (Date.now() - start) * 1000).toFixed(2);
        process.stdout.write(
          `\r[backfill] ${done}/${rows.length} | ok=${ok} fail=${fail} | ${elapsed}s | ${rate}/s  `,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");
  return { ok, fail, failures };
}

(async () => {
  console.log(`[backfill] model=${MODEL} concurrency=${CONCURRENCY} dry_run=${DRY_RUN}`);

  let query = supabase
    .from("activities")
    .select("id, original_prompt, improved_prompt, image_path")
    .is("title", null)
    .order("created_at", { ascending: true });
  if (LIMIT) query = query.limit(LIMIT);

  const { data: rows, error } = await query;
  if (error) throw error;
  console.log(`[backfill] rows to process: ${rows.length}`);
  if (rows.length === 0) return;

  const result = await runPool(rows);
  console.log(`[backfill] done: ok=${result.ok} fail=${result.fail}`);
  if (result.failures.length > 0) {
    console.log("[backfill] failures (first 10):");
    for (const f of result.failures.slice(0, 10)) console.log(`  ${f.id}: ${f.error}`);
  }
})().catch((e) => {
  console.error("[backfill] fatal:", e);
  process.exit(1);
});
