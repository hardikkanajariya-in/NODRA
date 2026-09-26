import { NextResponse } from "next/server";
import { getGraphData } from "@/lib/pages/service";
import { getSessionUserActiveGraphId } from "@/lib/graphs/session-graph";

export async function GET() {
  const graphId = await getSessionUserActiveGraphId();
  const data = await getGraphData(graphId);
  return NextResponse.json(data);
}
