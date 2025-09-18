import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
import { auth } from "@/lib/auth";

import { ensureCloudinaryFolder } from "@/lib/cloudinary-folder-check";

export const runtime = "edge"; //issue with cloudflare pages

export async function POST(req: NextRequest) {

    try {

      //session for user details
          //const session = await getServerSession(authOptions);
          const session = await auth();
            if (!session?.user?.name) {
              return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
          
          //parse form data
           const fd = await req.formData();
           const file = fd.get("file") as File | null;
           if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

          const timestamp = Math.floor(Date.now() / 1000);

          const folder = session.user.email;//"zory";
          
          //create folder per user
          if (!folder || typeof folder !== "string") {
            return NextResponse.json({ error: "Missing 'folder' string" }, { status: 400 });
          }
          const result = await ensureCloudinaryFolder(folder);
          console.log("Cloudinary folder:", result);
          if (result !== "created" && result !== "exists") {
            return NextResponse.json(
              { error: "Cloudinary folder error" },
              { status: 500 }
            );
          }

          // Build signature: sign "folder=...&timestamp=..." + API_SECRET
          const toSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
          const signature = crypto.createHash("sha1").update(toSign).digest("hex");

          const out = new FormData();
          out.append("file", file);
          out.append("api_key", process.env.CLOUDINARY_API_KEY!);
          out.append("timestamp", String(timestamp));
          out.append("signature", signature);
          out.append("folder", folder); // optional subfolder per user


          const r = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: "POST",
            body: out,
          });

          const text = await r.text();
          if (!r.ok) return NextResponse.json({ error: "Cloudinary error", details: text }, { status: r.status });

          const j = JSON.parse(text);

  return NextResponse.json({ url: j.secure_url, public_id: j.public_id, width: j.width, height: j.height });
    } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }

}