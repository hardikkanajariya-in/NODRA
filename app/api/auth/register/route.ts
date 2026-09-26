import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_MIN } from "@/lib/auth/password";
import { registerUser } from "@/lib/auth/users";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";

const bodySchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(PASSWORD_MIN),
    confirmPassword: z.string().min(PASSWORD_MIN),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message === "Passwords do not match"
        ? "Passwords do not match"
        : `Password must be at least ${PASSWORD_MIN} characters`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const result = await registerUser(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const token = await createSession({
    userId: result.user.id,
    username: result.user.username,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
