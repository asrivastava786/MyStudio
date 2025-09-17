import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const runtime = "edge"; //issue with cloudflare pages
export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }


        // Look up user (do not reveal existence)
        const user = await db.user.findUnique({ where: { email } });


        // Create token regardless (privacy)
        const { token, tokenHash } = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h


        // If user exists, store token linked to user
        if (user) {
            await db.passwordResetToken.create({
                data: {
                    tokenHash,
                    userId: user.id,
                    email,
                    expiresAt,
                },
            });


            const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
            const url = `${baseUrl}/auth/reset?token=${token}`;


            const html = `
                    <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
                    <h2>Password reset</h2>
                    <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                    <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:black;color:white;border-radius:8px;text-decoration:none">Reset password</a></p>
                    <p>If you did not request this, you can ignore this email.</p>
                    </div>`;


            await sendPasswordResetEmail({ to: email, subject: "Reset your password", html, text: `Reset your password: ${url}` });
        }


        // Always respond success (anti-enumeration)
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: true }); // still generic
    }
}