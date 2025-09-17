import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcrypt";


export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();
        if (!token || typeof token !== "string" || typeof password !== "string" || password.length < 8) {
            return NextResponse.json({ error: "Invalid token or password" }, { status: 400 });
        }


        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
        if (!record || record.usedAt || record.expiresAt < new Date()) {
            return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
        }


        const hash = await bcrypt.hash(password, 12);
        await db.$transaction([
            db.user.update({ where: { id: record.userId! }, data: { passwordHash: hash } }),
            db.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
        ]);


        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
    }
}