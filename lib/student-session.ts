export type StudioSession = { id: string; name: string; onboarded: boolean | null };

export type StudentJwtClaims = {
  studentId: string;
  name: string;
  onboarded: boolean | null;
  authUserId?: string | null;
};

export type AuthStudentRow = {
  id: string;
  name: string;
  onboardedAt: Date | null;
  authUserId?: string | null;
};

/** True when the local JWT was minted for this signed-in auth user. */
export function jwtMatchesAuthUser(jwt: StudentJwtClaims | null, authUserId: string) {
  return Boolean(jwt?.authUserId && jwt.authUserId === authUserId);
}

export function studentSessionFromRow(student: AuthStudentRow): StudioSession {
  return {
    id: student.id,
    name: student.name,
    onboarded: Boolean(student.onboardedAt),
  };
}

/**
 * Studio identity.
 * A signed-in auth user always maps to their own student row — leftover cookies from
 * another person on the same browser are ignored. Guest JWTs (no authUserId) stay
 * valid only when nobody is signed in.
 */
export function resolveStudentStudioSession(input: {
  authUserId: string | null;
  jwt: StudentJwtClaims | null;
  authStudent: AuthStudentRow | null;
}): StudioSession | null {
  if (input.authUserId) {
    if (jwtMatchesAuthUser(input.jwt, input.authUserId) && input.jwt) {
      return {
        id: input.jwt.studentId,
        name: input.jwt.name,
        onboarded: input.jwt.onboarded,
      };
    }
    if (input.authStudent && input.authStudent.authUserId === input.authUserId) {
      return studentSessionFromRow(input.authStudent);
    }
    return null;
  }
  if (input.jwt && !input.jwt.authUserId) {
    return {
      id: input.jwt.studentId,
      name: input.jwt.name,
      onboarded: input.jwt.onboarded,
    };
  }
  return null;
}
