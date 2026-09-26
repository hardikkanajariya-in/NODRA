import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
  return `scrypt:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "base64");
  const expected = Buffer.from(parts[2]!, "base64");
  if (expected.length !== KEY_LEN) return false;
  const actual = scryptSync(password, salt, KEY_LEN, SCRYPT_PARAMS);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;
export const PASSWORD_MIN = 8;

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

export function normalizeUsernameKey(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  const trimmed = username.trim();
  if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
    return false;
  }
  return USERNAME_RE.test(trimmed);
}
