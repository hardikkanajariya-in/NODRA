import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isSupervisorSession } from "@/lib/auth/supervisor";
import {
  listAdminUserDirectory,
  listOrphanGraphs,
} from "@/lib/admin/directory";

export async function GET() {
  const session = await getSession();
  if (!isSupervisorSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, orphanGraphs] = await Promise.all([
    listAdminUserDirectory(),
    listOrphanGraphs(),
  ]);

  return NextResponse.json({ users, orphanGraphs });
}
