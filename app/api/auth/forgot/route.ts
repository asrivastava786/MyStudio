import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const { token, tokenHash } = await generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordResetToken.create({
        data: { tokenHash, userId: user.id, email, expiresAt },
      });

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const url = `${baseUrl}/auth/reset?token=${token}`;

      const html = `
<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#111">
  <h2 style="margin:0 0 12px">Reset your password</h2>
  <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
  <p style="margin:20px 0">
    <a href="${url}"
       style="display:inline-block;padding:12px 20px;background:#000;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
      Reset password
    </a>
  </p>
  <p>Or copy this link:<br><a href="${url}">${url}</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:18px 0">
  <p style="font-size:13px;color:#666">If you didn't request this, you can safely ignore this email.</p>
</div>`;

      // Not catching here so real send failures surface as 500
      await sendPasswordResetEmail({
        to: email,
        subject: "Reset your ZORY Studio password",
        html,
        text: `Reset your password: ${url}`,
      });
    }

    // Always respond with the same message to prevent email enumeration
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[forgot] error:", e);
    // Still return a generic success to prevent enumeration, but log the real error
    return NextResponse.json({ ok: true });
  }
}
