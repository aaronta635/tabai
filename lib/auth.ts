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

type TeacherPayload = { typ: "teacher"; teacherId: string; name: string; onboarded: boolean | null };
type StudentPayload = { typ: "student"; studentId: string; name: string; onboarded: boolean | null };
type AdminPayload = { typ: "admin" };

export type StudioSession = { id: string; name: string; onboarded: boolean | null };

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

export async function signTeacherSession(teacherId: string, name: string, onboarded: boolean) {
  return new SignJWT({ typ: "teacher", teacherId, name, onboarded } satisfies TeacherPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function signStudentSession(studentId: string, name: string, onboarded: boolean) {
  return new SignJWT({ typ: "student", studentId, name, onboarded } satisfies StudentPayload)
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
        onboarded: typeof payload.onboarded === "boolean" ? payload.onboarded : null,
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
        onboarded: typeof payload.onboarded === "boolean" ? payload.onboarded : null,
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
  return boundTutorSession(teacher.id, teacher.name, Boolean(teacher.onboardedAt));
}

function boundTutorSession(id: string, name: string, onboarded: boolean): BoundAccount {
  return {
    role: "tutor",
    id,
    name,
    onboarded,
    next: homeFor("tutor", onboarded),
  };
}

function boundStudent(student: { id: string; name: string; onboardedAt: Date | null }): BoundAccount {
  return boundStudentSession(student.id, student.name, Boolean(student.onboardedAt));
}

function boundStudentSession(id: string, name: string, onboarded: boolean): BoundAccount {
  return {
    role: "student",
    id,
    name,
    onboarded,
    next: homeFor("student", onboarded),
  };
}

/** Local JWT only — no database, no Supabase. */
export const readTeacherSession = cache(async function readTeacherSession(): Promise<StudioSession | null> {
  const session = await readTeacherPayload();
  if (!session) return null;
  return { id: session.teacherId, name: session.name, onboarded: session.onboarded };
});

export const readStudentSession = cache(async function readStudentSession(): Promise<StudioSession | null> {
  const session = await readStudentPayload();
  if (!session) return null;
  return { id: session.studentId, name: session.name, onboarded: session.onboarded };
});

const onboardedMemory = new Map<string, boolean>();

function rememberOnboarded(role: "teacher" | "student", id: string, onboarded: boolean) {
  onboardedMemory.set(`${role}:${id}`, onboarded);
}

/** JWT first, then this process's memory, then one Postgres hit for cookies minted before the flag existed. */
export async function studioOnboarded(session: StudioSession, role: "teacher" | "student") {
  if (session.onboarded != null) return session.onboarded;
  const cached = onboardedMemory.get(`${role}:${session.id}`);
  if (cached != null) return cached;
  const row =
    role === "teacher"
      ? await prisma.teacher.findUnique({ where: { id: session.id }, select: { onboardedAt: true } })
      : await prisma.student.findUnique({ where: { id: session.id }, select: { onboardedAt: true } });
  const ok = Boolean(row?.onboardedAt);
  rememberOnboarded(role, session.id, ok);
  return ok;
}

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
    await setTeacherCookie(teacher.id, teacher.name, Boolean(teacher.onboardedAt));
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
    await setStudentAccountCookies(student.id, student.name, student.token, Boolean(student.onboardedAt));
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
      await setTeacherCookie(teacher.id, teacher.name, Boolean(teacher.onboardedAt));
      return boundTutor(teacher);
    }
    if (decision.action === "use" && decision.role === "student" && student) {
      await setStudentAccountCookies(student.id, student.name, student.token, Boolean(student.onboardedAt));
      return boundStudent(student);
    }
    if (decision.action === "create" && decision.role === "student") {
      const created = await createStudentFromUser(user);
      await setStudentAccountCookies(created.id, created.name, created.token, Boolean(created.onboardedAt));
      return boundStudent(created);
    }
    if (decision.action === "create" && decision.role === "tutor") {
      const created = await createTeacherFromUser(user);
      await setTeacherCookie(created.id, created.name, Boolean(created.onboardedAt));
      return boundTutor(created);
    }
    return null;
  }

  if (requested !== "student") {
    const teacherJwt = await readTeacherSession();
    if (teacherJwt) {
      if (teacherJwt.onboarded != null) {
        return boundTutorSession(teacherJwt.id, teacherJwt.name, teacherJwt.onboarded);
      }
      const teacher = await prisma.teacher.findUnique({ where: { id: teacherJwt.id } });
      if (teacher) {
        await setTeacherCookie(teacher.id, teacher.name, Boolean(teacher.onboardedAt));
        return boundTutor(teacher);
      }
    }
  }
  if (requested !== "tutor") {
    const studentJwt = await readStudentSession();
    if (studentJwt) {
      if (studentJwt.onboarded != null) {
        return boundStudentSession(studentJwt.id, studentJwt.name, studentJwt.onboarded);
      }
      const student = await prisma.student.findUnique({ where: { id: studentJwt.id } });
      if (student) {
        await setStudentAccountCookies(student.id, student.name, student.token, Boolean(student.onboardedAt));
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

export async function setTeacherCookie(teacherId: string, name: string, onboarded: boolean) {
  rememberOnboarded("teacher", teacherId, onboarded);
  const jar = await cookies();
  jar.delete(STUDENT_SESSION_COOKIE);
  jar.set(TEACHER_COOKIE, await signTeacherSession(teacherId, name, onboarded), {
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

export async function setStudentAccountCookies(
  studentId: string,
  name: string,
  token: string,
  onboarded: boolean,
) {
  rememberOnboarded("student", studentId, onboarded);
  const jar = await cookies();
  jar.delete(TEACHER_COOKIE);
  jar.set(STUDENT_SESSION_COOKIE, await signStudentSession(studentId, name, onboarded), {
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
