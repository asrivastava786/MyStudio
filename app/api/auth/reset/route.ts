// app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as bcryptjs from "bcryptjs";

export const runtime = "edge"; // Cloudflare/Edge compatible

// ----- tiny helpers (Edge-safe) -----
function bytesToHex(bytes: Uint8Array): string {
  const out = new Array<string>(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i].toString(16).padStart(2, "0");
  return out.join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(digest));
}

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null) as unknown;

    // Validate BEFORE destructuring so TS can narrow
    if (
      !raw ||
      typeof (raw as any).token !== "string" ||
      typeof (raw as any).password !== "string" ||
      (raw as any).password.length < 8
    ) {
      return NextResponse.json({ error: "Invalid token or password" }, { status: 400 });
    }

    // Now these are definitely strings
    const { token, password } = raw as { token: string; password: string };

    const tokenHash = await sha256Hex(token);

    const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: record.userId! },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
