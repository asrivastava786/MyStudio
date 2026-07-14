export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db.catalogTemplate.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ templates });
}
