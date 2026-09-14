import { NextRequest, NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/constants";
import { getStudentTokenFromCookie, newStudentToken, setStudentCookie } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const piece = await prisma.piece.findUnique({ where: { code } });
  if (!piece || piece.archived) {
    return NextResponse.json({ error: "piece not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    ageBand?: "under18" | "adult";
    contactType?: "zalo" | "messenger";
    contactHandle?: string;
    publicOk?: boolean;
    consent?: boolean;
  };

  if (!body.name?.trim() || !body.ageBand || !body.contactType || !body.contactHandle?.trim() || !body.consent) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const existingToken = await getStudentTokenFromCookie();
  if (existingToken) {
    const existing = await prisma.student.findFirst({
      where: { token: existingToken, teacherId: piece.teacherId },
    });
    if (existing) {
      return NextResponse.json({ studentId: existing.id, token: existing.token });
    }
  }

  const publicOk = body.ageBand === "under18" ? false : Boolean(body.publicOk);
  const token = newStudentToken();
  const student = await prisma.student.create({
    data: {
      teacherId: piece.teacherId,
      name: body.name.trim(),
      ageBand: body.ageBand,
      contactType: body.contactType,
      contactHandle: body.contactHandle.trim(),
      token,
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      publicOk,
    },
  });

  await setStudentCookie(token);
  await logEvent({
    name: "student.registered",
    actorType: "student",
    actorId: student.id,
    teacherId: piece.teacherId,
    props: { consentVersion: CONSENT_VERSION, ageBand: body.ageBand },
  });

  return NextResponse.json({ studentId: student.id, token });
}
