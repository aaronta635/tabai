import { NextRequest, NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/constants";
import {
  newStudentToken,
  setStudentAccountCookies,
  setStudentCookie,
  studentForPiece,
} from "@/lib/auth";
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

  const nameTrim = body.name?.trim() ?? "";
  const contactTrim = body.contactHandle?.trim() ?? "";

  const bound = await studentForPiece(piece.teacherId);
  if (bound.otherClass) {
    return NextResponse.json({ error: "other class" }, { status: 409 });
  }

  if (bound.fromSession && bound.student) {
    const current = bound.student;
    const publicOk =
      (body.ageBand ?? current.ageBand) === "under18" ? false : body.publicOk ?? current.publicOk;
    const updated = await prisma.student.update({
      where: { id: current.id },
      data: {
        teacherId: piece.teacherId,
        stage: "in_class",
        name: nameTrim || current.name,
        ageBand: body.ageBand ?? current.ageBand,
        contactType: body.contactType ?? current.contactType,
        contactHandle: contactTrim || current.contactHandle,
        publicOk,
      },
    });
    await setStudentAccountCookies(updated.id, updated.name, updated.token);
    await logEvent({
      name: "student.registered",
      actorType: "student",
      actorId: updated.id,
      teacherId: piece.teacherId,
      props: { consentVersion: CONSENT_VERSION, ageBand: updated.ageBand, attached: true },
    });
    return NextResponse.json({ studentId: updated.id, token: updated.token });
  }

  if (bound.student) {
    return NextResponse.json({ studentId: bound.student.id, token: bound.student.token });
  }

  const ageBand = body.ageBand;
  const contactType = body.contactType;
  if (!nameTrim || !ageBand || !contactType || !contactTrim || !body.consent) {
    return NextResponse.json(
      {
        error: "missing fields",
        fields: { name: !nameTrim, contactHandle: !contactTrim },
      },
      { status: 400 },
    );
  }

  const publicOk = ageBand === "under18" ? false : Boolean(body.publicOk);
  const token = newStudentToken();
  const student = await prisma.student.create({
    data: {
      teacherId: piece.teacherId,
      name: nameTrim,
      ageBand,
      contactType,
      contactHandle: contactTrim,
      token,
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      publicOk,
      stage: "in_class",
    },
  });

  await setStudentCookie(token);
  await logEvent({
    name: "student.registered",
    actorType: "student",
    actorId: student.id,
    teacherId: piece.teacherId,
    props: { consentVersion: CONSENT_VERSION, ageBand },
  });

  return NextResponse.json({ studentId: student.id, token });
}
