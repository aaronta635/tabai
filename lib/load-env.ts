import { existsSync } from "node:fs";

/** Load local env files for Prisma CLI, the worker, and other scripts. Existing process env wins. */
export function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
    } catch {
      // missing, already parsed, or unreadable
    }
  }
}
