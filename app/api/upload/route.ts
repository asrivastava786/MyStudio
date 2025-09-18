import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureCloudinaryFolder } from "@/lib/cloudinary-folder-check";

export const runtime = "edge";

// allow common images, max 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_BYTES = 10 * 1024 * 1024;

// utils for Edge (Web Crypto)
const toHex = (buf: ArrayBuffer | Uint8Array) => {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};
async function sha1Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return toHex(digest);
}

export async function POST(req: NextRequest) {
  try {
    // auth (NextAuth v5)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // form file
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary env vars missing" }, { status: 500 });
    }

    // per-user folder (avoid emails; use a stable id-safe path)
    const folder = `users/${session.user.id}`;

    // optional: ensure folder exists
    try {
      const res = await ensureCloudinaryFolder(folder);
      if (res !== "exists" && res !== "created") {
        return NextResponse.json({ error: "Cloudinary folder error" }, { status: 500 });
      }
    } catch {
      // non-fatal: folder creation issues shouldn't block uploads
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // signature: sort params alphabetically and append API secret
    const paramsToSign: Record<string, string | number> = { folder, timestamp };
    const toSign =
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join("&") + apiSecret;

    const signature = await sha1Hex(toSign);

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", apiKey);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
    body.append("folder", folder);

    // use /image/upload; switch to /auto/upload if you plan to accept videos too
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const r = await fetch(uploadUrl, { method: "POST", body });

    const txt = await r.text();
    let payload: any;
    try {
      payload = JSON.parse(txt);
    } catch {
      payload = { raw: txt };
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "Cloudinary upload failed", details: payload?.error?.message || payload },
        { status: r.status }
      );
    }

    // return useful fields
    return NextResponse.json({
      url: payload.secure_url,
      public_id: payload.public_id,
      width: payload.width,
      height: payload.height,
      bytes: payload.bytes,
      format: payload.format,
      folder: payload.folder,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
