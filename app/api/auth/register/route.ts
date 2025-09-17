import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { RegisterSchema } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/mailer";

export const runtime = "edge"; //issue with cloudflare pages

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => i.message);
      return NextResponse.json({ error: issues[0] || "Nieprawidłowe dane" }, { status: 400 });
    }
    const { email, handle, name, password, country } = parsed.data;


    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { handle }] },
    });
    if (exists) {
      return NextResponse.json({ error: "Email lub nick już istnieje" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: { email, handle, name, country, passwordHash },
    });

      sendWelcomeEmail(email!, name || handle).catch((e) => {
      console.error("Welcome email failed:", e);
    });


    // ✅ just return ok
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
