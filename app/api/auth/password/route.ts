import { NextResponse } from "next/server";
import { z } from "zod";
import { PASSWORD_MIN } from "@/lib/auth/password";
import { updateUserPassword } from "@/lib/auth/users";
import { getSession } from "@/lib/auth/session";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `New password must be at least ${PASSWORD_MIN} characters` },
      { status: 400 },
    );
  }

  const result = await updateUserPassword(
    session.userId,
    parsed.data.currentPassword,
    parsed.data.newPassword,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
