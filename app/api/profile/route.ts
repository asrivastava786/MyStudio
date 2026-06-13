export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function sanitize(body: any) {
  const out: any = {};
  const pick = ["name", "handle", "country", "image", "instagram", "behance", "dribbble", "website", "cloudinaryPublicId"];
  for (const k of pick) if (k in body) out[k] = body[k] === "" ? null : body[k];
  return out;
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = sanitize(body);

    if (data.handle) {
      const tooShort = typeof data.handle !== "string" || data.handle.length < 2;
      if (tooShort) {
        return NextResponse.json({ error: "Nick (handle) jest za krótki" }, { status: 400 });
      }
      const exists = await db.user.findFirst({
        where: { handle: data.handle, NOT: { id: session.user.id } },
        select: { id: true },
      });
      if (exists) {
        return NextResponse.json({ error: "Ten nick (handle) jest już zajęty" }, { status: 400 });
      }
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true, name: true, handle: true, country: true, image: true,
        instagram: true, behance: true, dribbble: true, website: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    const msg = e?.code === "P2002" ? "Pole musi być unikalne (np. nick)" : (e?.message || "Błąd serwera");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
