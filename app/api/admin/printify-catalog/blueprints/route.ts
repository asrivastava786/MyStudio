export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listBlueprints } from "@/lib/printify-catalog";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const blueprints = await listBlueprints();
    return NextResponse.json({ blueprints });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Catalog fetch failed" }, { status: 502 });
  }
}
