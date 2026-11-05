"use server";

import { readStudentSession, readTeacherSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markTourSeen(role: "student" | "teacher") {
  switch (role) {
    case "teacher": {
      const teacher = await readTeacherSession();
      if (!teacher) return;
      await prisma.teacher.updateMany({
        where: { id: teacher.id, tourSeenAt: null },
        data: { tourSeenAt: new Date() },
      });
      return;
    }
    case "student": {
      const student = await readStudentSession();
      if (!student) return;
      await prisma.student.updateMany({
        where: { id: student.id, tourSeenAt: null },
        data: { tourSeenAt: new Date() },
      });
      return;
    }
    default: {
      const unknown: never = role;
      return unknown;
    }
  }
}
