import type { SessionUser } from "@/lib/auth/session";
import { normalizeUsernameKey } from "@/lib/auth/password";

function getSupervisorUsernameKey(): string | null {
  const raw = process.env.SUPERVISOR_USERNAME?.trim();
  if (!raw) return null;
  return normalizeUsernameKey(raw);
}

/** True when SUPERVISOR_USERNAME is set (admin /users UI enabled for that account). */
export function isSupervisorConfigured(): boolean {
  return getSupervisorUsernameKey() !== null;
}

export function isSupervisorUsername(username: string): boolean {
  const key = getSupervisorUsernameKey();
  if (!key) return false;
  return normalizeUsernameKey(username) === key;
}

export function isSupervisorSession(session: SessionUser | null): boolean {
  if (!session) return false;
  return isSupervisorUsername(session.username);
}

export function requireSupervisorSession(session: SessionUser | null): SessionUser {
  if (!isSupervisorSession(session)) {
    throw new Error("Forbidden");
  }
  return session!;
}
