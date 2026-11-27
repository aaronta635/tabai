import { NextResponse } from "next/server";
import { requireStudentAccount, requireTeacher } from "@/lib/auth";
import { deliverableAddress } from "@/lib/deliverable-email";
import { createServerSupabase } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const email = deliverableAddress(data.user?.email);
  if (!email) return NextResponse.json({ ok: false }, { status: 400 });

  const teacher = await requireTeacher();
  if (teacher) {
    await prisma.teacher.updateMany({
      where: { id: teacher.id, OR: [{ email: null }, { email: { endsWith: "@oauth.para.local" } }] },
      data: { email },
    });
    return NextResponse.json({ ok: true, role: "teacher" });
  }

  const student = await requireStudentAccount();
  if (student) {
    await prisma.student.updateMany({
      where: { id: student.id, OR: [{ email: null }, { email: { endsWith: "@oauth.para.local" } }] },
      data: { email },
    });
    return NextResponse.json({ ok: true, role: "student" });
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}