import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const envPath = join(projectRoot, ".env");

if (existsSync(envPath)) {
  const match = readFileSync(envPath, "utf8").match(
    /^SUPABASE_ACCESS_TOKEN\s*=\s*(.*)$/m,
  );
  if (match) {
    process.env.SUPABASE_ACCESS_TOKEN = match[1].trim().replace(/^["']|["']$/g, "");
  }
}

const child = spawn(
  "npx",
  ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=gmcwswcdftnlllwesfeh"],
  { stdio: "inherit", shell: true, env: process.env },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
