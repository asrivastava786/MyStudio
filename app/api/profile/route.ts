
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

function sanitize(body: any) {
  const out: any = {};
  const pick = ["name", "handle", "country", "image", "instagram", "behance", "dribbble", "website", "cloudinaryPublicId"];
  for (const k of pick) if (k in body) out[k] = body[k] === "" ? null : body[k];
  return out;
}

export async function PATCH(req: NextRequest) {

//const session = await getServerSession(authOptions);
const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  try {

    const body = await req.json();
    const data = sanitize(body);

    // Validate minimal constraints
    if (data.handle) {
      const tooShort = typeof data.handle !== "string" || data.handle.length < 2;
      if (tooShort) {
        return NextResponse.json({ error: "Nick (handle) jest za krótki" }, { status: 400 });
      }
      // Ensure uniqueness (exclude current user)
      const exists = await db.user.findFirst({
        where: { handle: data.handle, NOT: { id: (session.user as any).id } },
        select: { id: true },
      });
      if (exists) {
        return NextResponse.json({ error: "Ten nick (handle) jest już zajęty" }, { status: 400 });
      }
    }

    const user = await db.user.update({
      where: { id: (session.user as any).id },
      data,
      select: {
        id: true, name: true, handle: true, country: true, image: true,
        instagram: true, behance: true, dribbble: true, website: true
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    // Try to decode Prisma unique constraint error
    const msg = e?.code === "P2002" ? "Pole musi być unikalne (np. nick)" : (e?.message || "Błąd serwera");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

