// app/api/printify/create-product/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import { auth } from "@/lib/auth";

type Position = { x: number; y: number; width: number; height: number }; // 0..1 of full product area

type Body = {
  title: string;
  description?: string;
  imageId: string;
  variantIds: number[];
  priceCents: number;
  position: Position;
  angle?: number;
  blueprintId?: number;
  printProviderId?: number;
};

const SHOP_ID = parseInt(process.env.PRINTIFY_SHOP_ID || "", 10);
const ENV_BLUEPRINT_ID = parseInt(process.env.PRINTIFY_BLUEPRINT_ID || "", 10);
const ENV_PROVIDER_ID = parseInt(process.env.PRINTIFY_PRINT_PROVIDER_ID || "", 10);


export async function POST(req: NextRequest) {
  //const session = await getServerSession(authOptions);
const session = await auth();

  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await req.json()) as Body;

    // Basic validations (catch 400s before hitting Printify)
    const errs: string[] = [];
    if (!body.title?.trim()) errs.push("Missing title");
    //if (!body.imageId?.startsWith("http")) errs.push("Invalid artworkUrl");
    if (!Array.isArray(body.variantIds) || body.variantIds.length === 0) errs.push("No variants selected");
    if (!Number.isInteger(body.priceCents) || body.priceCents <= 0) errs.push("priceCents must be integer in cents");

    const BLUEPRINT_ID = body.blueprintId && body.blueprintId > 0 ? body.blueprintId : ENV_BLUEPRINT_ID;
    const PROVIDER_ID = body.printProviderId && body.printProviderId > 0 ? body.printProviderId : ENV_PROVIDER_ID;

    // validate position
    if (!Number.isFinite(SHOP_ID) || SHOP_ID <= 0)
      return NextResponse.json({ error: "Misconfigured PRINTIFY_SHOP_ID" }, { status: 500 });
    if (!Number.isFinite(BLUEPRINT_ID) || BLUEPRINT_ID <= 0)
      return NextResponse.json({ error: "Misconfigured PRINTIFY_BLUEPRINT_ID" }, { status: 500 });
    if (!Number.isFinite(PROVIDER_ID) || PROVIDER_ID <= 0)
      return NextResponse.json({ error: "Misconfigured PRINTIFY_PRINT_PROVIDER_ID" }, { status: 500 });

    const p: Position = body.position as Position;
    (["x", "y", "width", "height"] as const).forEach((k) => {
      const v = p?.[k];
      if (typeof v !== "number" || v < 0 || v > 1) errs.push(`position.${k} must be 0..1`);
    });

    if (errs.length) return NextResponse.json({ error: errs[0] }, { status: 400 });

    const cx = +(p.x + p.width / 2).toFixed(4);
    const cy = +(p.y + p.height / 2).toFixed(4);
    const scale = +p.width.toFixed(4);
    const angle = Math.round(body.angle ?? 0);

    const payload = {
      title: body.title,
      description: body.description || "",
      blueprint_id: BLUEPRINT_ID,
      print_provider_id: PROVIDER_ID,
      variants: body.variantIds.map((id: number) => ({ id, price: body.priceCents, is_enabled: true })),
      print_areas: [
        {
          variant_ids: body.variantIds,
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: body.imageId,
                  x: cx,
                  y: cy,
                  scale,
                  angle,
                },
              ],
            },
          ],
        },
      ],
      publish: false,
    };

    const res = await fetch(
      `https://api.printify.com/v1/shops/${SHOP_ID}/products.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(payload),
      }
    );

    const text = await res.text();
    let json: any = {};
    try { 
      json = JSON.parse(text); 
      json.creatorName = session.user.name;
      json.creatorEmail = session.user.email;

      // On success, ingest into local DB
      if (res.ok && json?.id) {
        try {
          const url = new URL("/api/printify/product-created-at-printify", req.url);
          const cproduct = fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.PRINTIFY_INGEST_INTERNAL_SECRET || "",
          },
          body: JSON.stringify(json),
          cache: "no-store",
          });

        if (!(await cproduct).ok) {
            const t = await (await cproduct).text();
            console.error("Local ingest failed:", (await cproduct).status, t);
    }
        } catch (e) {
          console.error("Printify create: local ingest error:", e);
        }
      }

    } catch {}

    if (!res.ok) {
      console.error("Printify create error:", res.status, json || text);
      return NextResponse.json(
        { error: json?.message || "Printify error", details: json || text },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, product: json });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
