import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAppPassword } from "@/lib/auth/password";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyAppPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createSession();
  const response = NextResponse.json({ ok: true });
  const opts = sessionCookieOptions(token);
  response.cookies.set(opts);
  return response;
}
