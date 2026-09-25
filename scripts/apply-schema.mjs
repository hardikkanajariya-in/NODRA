import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

if (process.env.SKIP_DB_SYNC === "1") {
  console.log("[db] SKIP_DB_SYNC=1 — skipping schema sync");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.warn("[db] DATABASE_URL is not set — skipping schema sync");
  process.exit(0);
}

console.log("[db] Applying schema (drizzle-kit push)…");

try {
  execSync("pnpm exec drizzle-kit push --force", {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  console.log("[db] Schema sync complete");
} catch {
  console.error("[db] Schema sync failed");
  process.exit(1);
}
