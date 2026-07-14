export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listPrintProviders } from "@/lib/printify-catalog";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { blueprintId } = await params;
  const id = Number(blueprintId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid blueprintId" }, { status: 400 });
  }

  try {
    const printProviders = await listPrintProviders(id);
    return NextResponse.json({ printProviders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Catalog fetch failed" }, { status: 502 });
  }
}
