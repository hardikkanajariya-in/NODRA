import { count, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { graphs, users } from "@/lib/db/schema";
import {
  hashPassword,
  isValidUsername,
  normalizeUsernameKey,
  verifyPassword,
} from "@/lib/auth/password";

export async function findUserByUsernameKey(usernameKey: string) {
  return db.query.users.findFirst({
    where: eq(users.usernameKey, usernameKey),
  });
}

export async function findUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export type RegisterResult =
  | { ok: true; user: { id: string; username: string } }
  | { ok: false; error: string };

export async function registerUser(
  username: string,
  password: string,
): Promise<RegisterResult> {
  const trimmed = username.trim();
  if (!isValidUsername(trimmed)) {
    return {
      ok: false,
      error: "Username must be 3–32 characters (letters, numbers, _ and -)",
    };
  }

  const usernameKey = normalizeUsernameKey(trimmed);
  const existing = await findUserByUsernameKey(usernameKey);
  if (existing) {
    return { ok: false, error: "Username is already taken" };
  }

  const passwordHash = hashPassword(password);
  const userCount = await db.select({ value: count() }).from(users);
  const isFirstUser = (userCount[0]?.value ?? 0) === 0;

  const [user] = await db
    .insert(users)
    .values({
      username: trimmed,
      usernameKey,
      passwordHash,
    })
    .returning({ id: users.id, username: users.username });

  if (!user) {
    return { ok: false, error: "Could not create account" };
  }

  if (isFirstUser) {
    await db
      .update(graphs)
      .set({ ownerUserId: user.id, updatedAt: sql`now()` })
      .where(isNull(graphs.ownerUserId));
  }

  return { ok: true, user };
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ id: string; username: string } | null> {
  const usernameKey = normalizeUsernameKey(username);
  const user = await findUserByUsernameKey(usernameKey);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, username: user.username };
}

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await findUserById(userId);
  if (!user) {
    return { ok: false, error: "User not found" };
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, error: "Current password is incorrect" };
  }
  const passwordHash = hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: sql`now()` })
    .where(eq(users.id, userId));
  return { ok: true };
}
