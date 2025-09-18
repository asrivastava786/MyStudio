// app/api/register/route.ts
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
      const issues = parsed.error.issues.map(i => i.message);
      return NextResponse.json(
        { error: issues[0] || "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { email, handle, name, password, country } = parsed.data;

    // Check duplicates
    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { handle }] },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Email lub nick już istnieje" },
        { status: 400 } // or 409 Conflict if you prefer
      );
    }

    // Hash password with bcryptjs
    const passwordHash = await hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: { email, handle, name, country, passwordHash },
      select: { id: true, email: true, name: true, handle: true },
    });

    // Fire-and-forget welcome email (Brevo)
    sendWelcomeEmail(email, name || handle).catch(e => {
      console.error("Welcome email failed:", e);
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}
