import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
  },
});

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
    throw new Error("DATABASE_URL is missing. Put it in .env.local and re-run npm run db:seed.");
  }
  const existing = await prisma.teacher.findFirst();
  if (existing) {
    console.log("seed skipped — teacher exists", existing.id);
    return;
  }
  const teacher = await prisma.teacher.create({
    data: {
      name: process.env.SEED_TEACHER_NAME ?? "Thầy Demo",
      inviteToken: process.env.SEED_INVITE_TOKEN ?? nanoid(24),
    },
  });
  const piece = await prisma.piece.create({
    data: {
      teacherId: teacher.id,
      code: "demo1234",
      title: "Bài 1",
      note: "Chơi chậm, tiếng sạch.",
    },
  });
  console.log("teacher invite /t/" + teacher.inviteToken);
  console.log("piece /l/" + piece.code);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
