import { NextResponse } from "next/server";
import { getPageBySlug } from "@/lib/pages/service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const page = await getPageBySlug(decodeURIComponent(slug));
  if (!page) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(page);
}
