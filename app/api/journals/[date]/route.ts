import { NextResponse } from "next/server";
import { getOrCreateJournal } from "@/lib/pages/service";
import { getActiveGraphId } from "@/lib/graphs/service";

type Params = { params: Promise<{ date: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const graphId = await getActiveGraphId();
  const page = await getOrCreateJournal(graphId, date);
  return NextResponse.json(page);
}
