export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listVariants } from "@/lib/printify-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blueprintId: string; printProviderId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { blueprintId, printProviderId } = await params;
  const bId = Number(blueprintId);
  const pId = Number(printProviderId);
  if (!Number.isFinite(bId) || !Number.isFinite(pId)) {
    return NextResponse.json({ error: "Invalid blueprintId or printProviderId" }, { status: 400 });
  }

  try {
    const result = await listVariants(bId, pId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Catalog fetch failed" }, { status: 502 });
  }
}
