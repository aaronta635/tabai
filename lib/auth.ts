import { Prisma } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { customAlphabet, nanoid } from "nanoid";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ADMIN_COOKIE,
  CONSENT_VERSION,
  STUDENT_COOKIE,
  STUDENT_SESSION_COOKIE,
  TEACHER_COOKIE,
} from "@/lib/constants";
import { resolveAuthBind } from "@/lib/auth-bind";
import { homeFor, parseRole, type AccountRole } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { createServerSupabase } from "@/lib/supabase/server";

const pieceCode = customAlphabet("abcdefghijkmnopqrstuvwxyz23456789", 8);

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(value);
}

type TeacherPayload = { typ: "teacher"; teacherId: string; name: string };
type StudentPayload = { typ: "student"; studentId: string; name: string };
type AdminPayload = { typ: "admin" };

export type BoundAccount =
  | {
      role: "tutor";
      id: string;
      name: string;
      onboarded: boolean;
      next: string;
    }
  | {
      role: "student";
      id: string;
      name: string;
      onboarded: boolean;
      next: string;
    };

export type RoleMismatch = { error: "role_mismatch"; actual: AccountRole };
export type BindAuthResult = BoundAccount | RoleMismatch;

export function isRoleMismatch(value: BindAuthResult | null): value is RoleMismatch {
  return Boolean(value && "error" in value);
}

export function newPieceCode() {
  return pieceCode();
}

export function newInviteToken() {
  return nanoid(24);
}

export function newStudentToken() {
  return nanoid(24);
}

export async function signTeacherSession(teacherId: string, name: string) {
  return new SignJWT({ typ: "teacher", teacherId, name } satisfies TeacherPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function signStudentSession(studentId: string, name: string) {
  return new SignJWT({ typ: "student", studentId, name } satisfies StudentPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function signAdminSession() {
  return new SignJWT({ typ: "admin" } satisfies AdminPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

async function readTeacherPayload(): Promise<TeacherPayload | null> {
  const jar = await cookies();
  const token = jar.get(TEACHER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ === "teacher" && typeof payload.teacherId === "string") {
      return {
        typ: "teacher",
        teacherId: payload.teacherId,
        name: typeof payload.name === "string" ? payload.name : "Thầy",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function readStudentPayload(): Promise<StudentPayload | null> {
  const jar = await cookies();
  const token = jar.get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ === "student" && typeof payload.studentId === "string") {
      return {
        typ: "student",
        studentId: payload.studentId,
        name: typeof payload.name === "string" ? payload.name : "Học viên",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function readAdminPayload(): Promise<AdminPayload | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ === "admin") return { typ: "admin" };
    return null;
  } catch {
    return null;
  }
}

function displayName(user: User, fallback: string) {
  return (
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    fallback
  );
}

function roleFromUser(user: User, requested?: AccountRole | null): AccountRole {
  return parseRole(requested) ?? parseRole(user.user_metadata?.role as string | undefined) ?? "tutor";
}

async function findTeacherByAuth(userId: string) {
  return prisma.teacher.findUnique({ where: { authUserId: userId } });
}

async function findStudentByAuth(userId: string) {
  return prisma.student.findUnique({ where: { authUserId: userId } });
}

async function createTeacherFromUser(user: User) {
  const existing = await findTeacherByAuth(user.id);
  if (existing) return existing;
  try {
    return await prisma.teacher.create({
      data: {
        name: displayName(user, "Thầy"),
        email: user.email,
        authUserId: user.id,
        inviteToken: newInviteToken(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await findTeacherByAuth(user.id);
      if (raced) return raced;
    }
    throw error;
  }
}

async function createStudentFromUser(user: User) {
  const existing = await findStudentByAuth(user.id);
  if (existing) return existing;
  try {
    return await prisma.student.create({
      data: {
        name: displayName(user, "Học viên"),
        email: user.email,
        authUserId: user.id,
        ageBand: "adult",
        contactType: "zalo",
        contactHandle: user.email ?? "",
        token: newStudentToken(),
        consentAt: new Date(),
        consentVersion: CONSENT_VERSION,
        publicOk: false,
        stage: "exploring",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await findStudentByAuth(user.id);
      if (raced) return raced;
    }
    throw error;
  }
}

function boundTutor(teacher: { id: string; name: string; onboardedAt: Date | null }): BoundAccount {
  const onboarded = Boolean(teacher.onboardedAt);
  return {
    role: "tutor",
    id: teacher.id,
    name: teacher.name,
    onboarded,
    next: homeFor("tutor", onboarded),
  };
}

function boundStudent(student: { id: string; name: string; onboardedAt: Date | null }): BoundAccount {
  const onboarded = Boolean(student.onboardedAt);
  return {
    role: "student",
    id: student.id,
    name: student.name,
    onboarded,
    next: homeFor("student", onboarded),
  };
}

/** Local JWT only — no database, no Supabase. */
export const readTeacherSession = cache(async function readTeacherSession() {
  const session = await readTeacherPayload();
  if (!session) return null;
  return { id: session.teacherId, name: session.name };
});

export const readStudentSession = cache(async function readStudentSession() {
  const session = await readStudentPayload();
  if (!session) return null;
  return { id: session.studentId, name: session.name };
});

/** Local JWT only. Hits Postgres only when the cookie is missing. */
export async function getTeacherFromCookie() {
  const session = await readTeacherSession();
  if (!session) return null;
  return { id: session.id, name: session.name };
}

export async function getStudentFromCookie() {
  const session = await readStudentSession();
  if (!session) return null;
  return { id: session.id, name: session.name };
}

async function supabaseUser() {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  } catch {
    return null;
  }
}

export const requireTeacher = cache(async function requireTeacher() {
  const session = await readTeacherSession();
  if (session) {
    return prisma.teacher.findUnique({ where: { id: session.id } });
  }
  const user = await supabaseUser();
  if (!user) return null;
  const teacher = await findTeacherByAuth(user.id);
  if (!teacher) return null;
  try {
    await setTeacherCookie(teacher.id, teacher.name);
  } catch {
    // Server Components cannot always Set-Cookie; /api/session will.
  }
  return teacher;
});

export const requireStudentAccount = cache(async function requireStudentAccount() {
  const session = await readStudentSession();
  if (session) {
    return prisma.student.findUnique({ where: { id: session.id } });
  }
  const user = await supabaseUser();
  if (!user) return null;
  const student = await findStudentByAuth(user.id);
  if (!student) return null;
  try {
    await setStudentAccountCookies(student.id, student.name, student.token);
  } catch {
    // /api/session will set cookies on the response path.
  }
  return student;
});

/**
 * Bind a local session after Supabase sign-in.
 * The sign-in screen's role wins: a tutor email on student login is a mismatch,
 * not a silent teacher session.
 */
export async function bindAuthSession(requested?: AccountRole | null): Promise<BindAuthResult | null> {
  const user = await supabaseUser();
  if (user) {
    const teacher = await findTeacherByAuth(user.id);
    const student = await findStudentByAuth(user.id);
    const decision = resolveAuthBind({
      requested,
      hasTeacher: Boolean(teacher),
      hasStudent: Boolean(student),
      fallbackRole: roleFromUser(user, requested),
    });
    if (decision.action === "mismatch") {
      return { error: "role_mismatch", actual: decision.actual };
    }
    if (decision.action === "use" && decision.role === "tutor" && teacher) {
      await setTeacherCookie(teacher.id, teacher.name);
      return boundTutor(teacher);
    }
    if (decision.action === "use" && decision.role === "student" && student) {
      await setStudentAccountCookies(student.id, student.name, student.token);
      return boundStudent(student);
    }
    if (decision.action === "create" && decision.role === "student") {
      const created = await createStudentFromUser(user);
      await setStudentAccountCookies(created.id, created.name, created.token);
      return boundStudent(created);
    }
    if (decision.action === "create" && decision.role === "tutor") {
      const created = await createTeacherFromUser(user);
      await setTeacherCookie(created.id, created.name);
      return boundTutor(created);
    }
    return null;
  }

  if (requested !== "student") {
    const teacherJwt = await readTeacherSession();
    if (teacherJwt) {
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherJwt.id } });
      if (teacher) {
        await setTeacherCookie(teacher.id, teacher.name);
        return boundTutor(teacher);
      }
    }
  }
  if (requested !== "tutor") {
    const studentJwt = await readStudentSession();
    if (studentJwt) {
      const student = await prisma.student.findUnique({ where: { id: studentJwt.id } });
      if (student) {
        await setStudentAccountCookies(student.id, student.name, student.token);
        return boundStudent(student);
      }
    }
  }

  return null;
}

/** Bind a local session cookie after a successful Supabase sign-in. */
export async function bindTeacherSession() {
  const bound = await bindAuthSession("tutor");
  if (!bound || isRoleMismatch(bound) || bound.role !== "tutor") return null;
  return { id: bound.id, name: bound.name };
}

export async function requireAdmin() {
  const session = await readAdminPayload();
  return session?.typ === "admin";
}

export async function getStudentTokenFromCookie() {
  const jar = await cookies();
  return jar.get(STUDENT_COOKIE)?.value ?? null;
}

/** Guest token cookie or logged-in student session for this teacher's piece. */
export async function studentForPiece(teacherId: string) {
  const session = await readStudentSession();
  if (session) {
    const account = await prisma.student.findUnique({ where: { id: session.id } });
    if (account) {
      const otherClass = Boolean(account.teacherId && account.teacherId !== teacherId);
      return { student: otherClass ? null : account, otherClass, fromSession: true as const };
    }
  }
  const token = await getStudentTokenFromCookie();
  if (!token) return { student: null, otherClass: false, fromSession: false as const };
  const student = await prisma.student.findFirst({ where: { token, teacherId } });
  return { student, otherClass: false, fromSession: false as const };
}

export async function setTeacherCookie(teacherId: string, name: string) {
  const jar = await cookies();
  jar.delete(STUDENT_SESSION_COOKIE);
  jar.set(TEACHER_COOKIE, await signTeacherSession(teacherId, name), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await signAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function setStudentCookie(token: string) {
  const jar = await cookies();
  jar.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function setStudentAccountCookies(studentId: string, name: string, token: string) {
  const jar = await cookies();
  jar.delete(TEACHER_COOKIE);
  jar.set(STUDENT_SESSION_COOKIE, await signStudentSession(studentId, name), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  jar.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function signOutTeacher() {
  await signOutAccount();
}

export async function signOutAccount() {
  try {
    const supabase = await createServerSupabase();
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Cookie clear still logs the person out locally.
  }
  const jar = await cookies();
  jar.delete(TEACHER_COOKIE);
  jar.delete(STUDENT_SESSION_COOKIE);
  jar.delete(STUDENT_COOKIE);
}
