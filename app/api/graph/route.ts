import { NextResponse } from "next/server";
import { getGraphData } from "@/lib/pages/service";

export async function GET() {
  const data = await getGraphData();
  return NextResponse.json(data);
}
