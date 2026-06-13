import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, handle: true, country: true, image: true,
      instagram: true, behance: true, dribbble: true, website: true,
    },
  });

  return NextResponse.json({ me });
}
