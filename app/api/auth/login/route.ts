import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_MIN } from "@/lib/auth/password";
import { authenticateUser } from "@/lib/auth/users";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(PASSWORD_MIN),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await authenticateUser(
    parsed.data.username,
    parsed.data.password,
  );
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, {
      status: 401,
    });
  }

  const token = await createSession({
    userId: user.id,
    username: user.username,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
