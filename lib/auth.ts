import { Prisma } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { customAlphabet, nanoid } from "nanoid";
import type { User } from "@supabase/supabase-js";
import {
  ADMIN_COOKIE,
  STUDENT_COOKIE,
  TEACHER_COOKIE,
} from "@/lib/constants";
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

type TeacherPayload = { typ: "teacher"; teacherId: string };
type AdminPayload = { typ: "admin" };
type SessionPayload = TeacherPayload | AdminPayload;

export function newPieceCode() {
  return pieceCode();
}

export function newInviteToken() {
  return nanoid(24);
}

export function newStudentToken() {
  return nanoid(24);
}

export async function signTeacherSession(teacherId: string) {
  return new SignJWT({ typ: "teacher", teacherId } satisfies TeacherPayload)
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

async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const teacherToken = jar.get(TEACHER_COOKIE)?.value;
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  const token = adminToken ?? teacherToken;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.typ === "teacher" && typeof payload.teacherId === "string") {
      return { typ: "teacher", teacherId: payload.teacherId };
    }
    if (payload.typ === "admin") {
      return { typ: "admin" };
    }
    return null;
  } catch {
    return null;
  }
}

async function teacherFromAuthUser(user: User) {
  const existing = await prisma.teacher.findUnique({
    where: { authUserId: user.id },
  });
  if (existing) return existing;

  try {
    return await prisma.teacher.create({
      data: {
        name:
          (user.user_metadata?.name as string | undefined) ??
          user.email?.split("@")[0] ??
          "Thầy",
        email: user.email,
        authUserId: user.id,
        inviteToken: newInviteToken(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.teacher.findUnique({
        where: { authUserId: user.id },
      });
      if (raced) return raced;
    }
    throw error;
  }
}

export async function requireTeacher() {
  let user: User | null = null;
  try {
    const supabase = await createServerSupabase();
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Auth env not ready — fall through to invite cookie.
  }

  if (user) {
    return teacherFromAuthUser(user);
  }

  const session = await readSession();
  if (!session || session.typ !== "teacher") {
    return null;
  }
  return prisma.teacher.findUnique({
    where: { id: session.teacherId },
  });
}

export async function requireAdmin() {
  const session = await readSession();
  return session?.typ === "admin";
}

export async function getStudentTokenFromCookie() {
  const jar = await cookies();
  return jar.get(STUDENT_COOKIE)?.value ?? null;
}

export async function setTeacherCookie(teacherId: string) {
  const jar = await cookies();
  jar.set(TEACHER_COOKIE, await signTeacherSession(teacherId), {
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

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function signOutTeacher() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(TEACHER_COOKIE);
}
