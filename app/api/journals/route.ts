import { NextResponse } from "next/server";
import { listJournals } from "@/lib/pages/service";
import { getSessionUserActiveGraphId } from "@/lib/graphs/session-graph";

export async function GET() {
  const graphId = await getSessionUserActiveGraphId();
  const journals = await listJournals(graphId, 120);
  return NextResponse.json(
    journals.map((j) => ({
      id: j.id,
      name: j.name,
      slug: j.slug,
      journalDate: j.journalDate,
    })),
  );
}
