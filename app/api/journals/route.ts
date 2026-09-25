import { NextResponse } from "next/server";
import { listJournals } from "@/lib/pages/service";
import { getActiveGraphId } from "@/lib/graphs/service";

export async function GET() {
  const graphId = await getActiveGraphId();
  const journals = await listJournals(graphId);
  return NextResponse.json(journals);
}
