import { NextResponse } from "next/server";
import { getGraphData } from "@/lib/pages/service";
import { getActiveGraphId } from "@/lib/graphs/service";

export async function GET() {
  const graphId = await getActiveGraphId();
  const data = await getGraphData(graphId);
  return NextResponse.json(data);
}
