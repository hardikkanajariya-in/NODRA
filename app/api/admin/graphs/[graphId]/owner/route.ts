import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { findUserByUsernameKey } from "@/lib/auth/users";
import { normalizeUsernameKey } from "@/lib/auth/password";
import { isSupervisorSession } from "@/lib/auth/supervisor";
import { transferGraphOwner } from "@/lib/admin/directory";

type Params = { params: Promise<{ graphId: string }> };

const bodySchema = z.object({
  username: z.string().min(1),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!isSupervisorSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { graphId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const user = await findUserByUsernameKey(
    normalizeUsernameKey(parsed.data.username),
  );
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await transferGraphOwner(graphId, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
