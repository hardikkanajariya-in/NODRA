import { NextResponse } from "next/server";
import { listJournals } from "@/lib/pages/service";

export async function GET() {
  const journals = await listJournals();
  return NextResponse.json(journals);
}
