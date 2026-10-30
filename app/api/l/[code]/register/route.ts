import { NextRequest, NextResponse } from "next/server";
import { CONSENT_VERSION } from "@/lib/constants";
import {
  homeTeacherId,
  newStudentToken,
  setStudentAccountCookies,
  setStudentCookie,
  studentForPiece,
} from "@/lib/auth";
import { shouldAttachTeacher } from "@/lib/demo-piece";
import { logEvent } from "@/lib/events";
import { registerFieldErrors } from "@/lib/forms";
import { phoneKey } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { newReportToken } from "@/lib/report";
import { phoneIsTaken } from "@/lib/student-phone";

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

  const bound = await studentForPiece(piece.teacherId, { demo: piece.demo });
  if (bound.otherClass) {
    return NextResponse.json({ error: "other class" }, { status: 409 });
  }

  if (bound.fromSession && bound.student) {
    const current = bound.student;
    const publicOk =
      (body.ageBand ?? current.ageBand) === "under18" ? false : body.publicOk ?? current.publicOk;
    const nextPhone = contactTrim ? phoneKey(contactTrim) : null;
    if (nextPhone && (await phoneIsTaken(nextPhone, current.id))) {
      return NextResponse.json({ error: "phone_taken" }, { status: 409 });
    }
    const updated = await prisma.student.update({
      where: { id: current.id },
      data: {
        teacherId: piece.demo ? current.teacherId : homeTeacherId(current.teacherId, piece.teacherId),
        stage: piece.demo ? current.stage : "in_class",
        name: nameTrim || current.name,
        ageBand: body.ageBand ?? current.ageBand,
        contactType: body.contactType ?? current.contactType,
        contactHandle: contactTrim || current.contactHandle,
        ...(nextPhone ? { phoneKey: nextPhone } : {}),
        publicOk,
      },
    });
    await setStudentAccountCookies(
      updated.id,
      updated.name,
      updated.token,
      Boolean(updated.onboardedAt),
      updated.authUserId,
    );
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

  const parsed = registerFieldErrors({
    name: body.name,
    contactHandle: body.contactHandle,
    ageBand: body.ageBand,
    contactType: body.contactType,
    consent: body.consent,
  });
  if (parsed.missing) {
    return NextResponse.json(
      {
        error: "missing fields",
        fields: parsed.fields,
      },
      { status: 400 },
    );
  }
  const ageBand = body.ageBand!;
  const contactType = body.contactType!;

  const publicOk = ageBand === "under18" ? false : Boolean(body.publicOk);
  const token = newStudentToken();
  const nextPhone = phoneKey(parsed.contactHandle);
  if (nextPhone && (await phoneIsTaken(nextPhone))) {
    return NextResponse.json({ error: "phone_taken" }, { status: 409 });
  }
  const student = await prisma.student.create({
    data: {
      teacherId: shouldAttachTeacher(piece.demo, null) ? piece.teacherId : null,
      name: parsed.name,
      ageBand,
      contactType,
      contactHandle: parsed.contactHandle,
      ...(nextPhone ? { phoneKey: nextPhone } : {}),
      token,
      reportToken: newReportToken(),
      consentAt: new Date(),
      consentVersion: CONSENT_VERSION,
      publicOk,
      stage: piece.demo ? "exploring" : "in_class",
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
