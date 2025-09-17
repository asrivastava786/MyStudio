export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });

  const res = await fetch(
    `https://api.printify.com/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${productId}/publish.json`,
    { method: "POST", headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}` } }
  );
  const json = await res.json();
  if (!res.ok) return NextResponse.json({ error: json?.error || "Publish failed", details: json }, { status: res.status });

  return NextResponse.json({ ok: true, result: json });
}
