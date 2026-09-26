import { NextResponse } from "next/server";
import { listJournals } from "@/lib/pages/service";
import { getSessionUserActiveGraphId } from "@/lib/graphs/session-graph";

export async function GET() {
  const graphId = await getSessionUserActiveGraphId();
  const journals = await listJournals(graphId);
  return NextResponse.json(journals);
}
