/** One-off probe: where does the page delay come from — the network, the pool, or the query count? */
import { prisma } from "@/lib/prisma";

async function time<T>(label: string, run: () => Promise<T>) {
  const start = performance.now();
  await run();
  console.log(`  ${label}: ${Math.round(performance.now() - start)}ms`);
}

async function main() {
  console.log("\nnetwork floor");
  await time("first connect + SELECT 1", () => prisma.$queryRaw`SELECT 1`);
  await time("SELECT 1 warm", () => prisma.$queryRaw`SELECT 1`);

  const studioClass = await prisma.class.findFirst({ orderBy: { createdAt: "desc" } });
  if (!studioClass) return;
  const teacher = { id: studioClass.teacherId };

  const classDetail = {
    where: { id: studioClass.id },
    include: {
      memberships: { include: { student: { select: { name: true } } } },
      assignments: { include: { piece: { select: { title: true } }, part: { select: { name: true } } } },
      sessions: { include: { _count: { select: { attendances: true } } } },
    },
  } as const;

  console.log("\nclass detail (3 relations)");
  for (const strategy of ["query", "join"] as const) {
    // Warm the shape first so prepared-statement cost is not counted twice.
    await prisma.class.findFirst({ ...classDetail, relationLoadStrategy: strategy });
    await time(strategy, () => prisma.class.findFirst({ ...classDetail, relationLoadStrategy: strategy }));
  }

  const curriculum = {
    where: { teacherId: teacher.id },
    include: { pieces: { where: { archived: false } } },
  } as const;

  console.log("\ncurriculum parts + pieces");
  for (const strategy of ["query", "join"] as const) {
    await prisma.curriculumPart.findMany({ ...curriculum, relationLoadStrategy: strategy });
    await time(strategy, () =>
      prisma.curriculumPart.findMany({ ...curriculum, relationLoadStrategy: strategy }),
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
