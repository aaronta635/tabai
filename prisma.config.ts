import { defineConfig } from "prisma/config";
import { loadLocalEnv } from "./lib/load-env";

// Prisma CLI only auto-loads `.env`. Next.js keeps secrets in `.env.local`.
loadLocalEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
