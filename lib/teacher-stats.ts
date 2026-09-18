import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const teacherNavCounts = cache(async function teacherNavCounts(teacherId: string) {
  const rows = await prisma.$queryRaw<
    [{ unanswered: number | bigint; pending: number | bigint; answered: number | bigint }]
  >`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM "Submission" s
        INNER JOIN "Piece" p ON p.id = s."pieceId"
        INNER JOIN "Student" st ON st.id = s."studentId"
        WHERE p."teacherId" = ${teacherId}
          AND st."approvedAt" IS NOT NULL
          AND s.status IN ('new', 'drafted')
      ) AS unanswered,
      (
        SELECT COUNT(*)::int
        FROM "Student"
        WHERE "teacherId" = ${teacherId}
          AND "approvedAt" IS NULL
          AND name <> 'anonymised'
      ) AS pending,
      (
        SELECT COUNT(*)::int
        FROM "Submission" s
        INNER JOIN "Piece" p ON p.id = s."pieceId"
        WHERE p."teacherId" = ${teacherId}
          AND s.status = 'answered'
      ) AS answered
  `;
  const row = rows[0] ?? { unanswered: 0, pending: 0, answered: 0 };
  return {
    unanswered: Number(row.unanswered),
    pending: Number(row.pending),
    answered: Number(row.answered),
  };
});
