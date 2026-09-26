import { getSession, requireSession } from "@/lib/auth/session";
import {
  getActiveGraph,
  getActiveGraphId,
  listGraphs,
} from "@/lib/graphs/service";

export async function getSessionUserActiveGraphId(): Promise<string> {
  const session = await requireSession();
  return getActiveGraphId(session.userId);
}

export async function getSessionUserActiveGraph() {
  const session = await requireSession();
  return getActiveGraph(session.userId);
}

export async function listSessionUserGraphs() {
  const session = await requireSession();
  return listGraphs(session.userId);
}

export async function getOptionalSessionUserActiveGraphId(): Promise<
  string | null
> {
  const session = await getSession();
  if (!session) return null;
  return getActiveGraphId(session.userId);
}
