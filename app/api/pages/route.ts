import { NextResponse } from "next/server";
import { z } from "zod";
import { createPage, listPages } from "@/lib/pages/service";
import { getActiveGraphId } from "@/lib/graphs/service";

export async function GET() {
  const graphId = await getActiveGraphId();
  const pages = await listPages(graphId);
  return NextResponse.json(pages);
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const graphId = await getActiveGraphId();
  const page = await createPage(graphId, parsed.data.name.trim());
  return NextResponse.json(page);
}
