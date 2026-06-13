import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/mailer";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid data.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, handle, name, password, country } = parsed.data;

    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { handle }] },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email or handle is already taken." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await db.user.create({
      data: { email, handle, name, country, passwordHash },
      select: { id: true, email: true, name: true, handle: true },
    });

    // Fire-and-forget — never block the response on email delivery
    sendWelcomeEmail(email, name || handle).catch((e) => {
      console.error("[register] welcome email failed:", e);
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error("[register] error:", e);
    // P2002 = unique constraint (race condition on email/handle)
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email or handle is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
