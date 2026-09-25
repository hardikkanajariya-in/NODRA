import { NextResponse } from "next/server";
import { getOrCreateJournal } from "@/lib/pages/service";

type Params = { params: Promise<{ date: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const page = await getOrCreateJournal(date);
  return NextResponse.json(page);
}
