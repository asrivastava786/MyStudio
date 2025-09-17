// app/api/image-process-upload/route.ts


export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const MIN_W = 590;//5907;
const MIN_H = 530;//5309;
const MAX_SIDE = 30000;


export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const mime = file.type || "";
    const isJpg = mime === "image/jpeg";
    const isPng = mime === "image/png";
    if (!isJpg && !isPng) {
      return NextResponse.json(
        { error: `Unsupported type: ${mime || "unknown"}. Allowed: JPG, PNG` },
        { status: 415 }
      );
    }

    // Load into sharp
    const buf = Buffer.from(await file.arrayBuffer());
    let img = sharp(buf, { failOn: "none" }).withMetadata({ orientation: 1 });

    // Probe dimensions
    const meta0 = await img.metadata();
    if (!meta0.width || !meta0.height) {
      return NextResponse.json({ error: "Corrupt or unsupported image" }, { status: 400 });
    }

    // Too small? Reject (no upscaling for quality)
    if (meta0.width < MIN_W || meta0.height < MIN_H) {
      return NextResponse.json(
        {
          error: `Image too small for print. Need at least ${MIN_W}×${MIN_H} px, got ${meta0.width}×${meta0.height}.`,
        },
        { status: 400 }
      );
    }

    // Downscale if larger than MAX_SIDE (keep aspect)
    let needResize = meta0.width > MAX_SIDE || meta0.height > MAX_SIDE;
    let pipeline = img.toColorspace("srgb");

    if (needResize) {
      const scale = Math.min(MAX_SIDE / meta0.width, MAX_SIDE / meta0.height);
      const outW = Math.floor(meta0.width * scale);
      const outH = Math.floor(meta0.height * scale);
      pipeline = pipeline.resize({
        width: outW,
        height: outH,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Keep original format; set reasonable params
    if (isJpg) {
      pipeline = pipeline.jpeg({ quality: 95, mozjpeg: true });
    } else {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    }

    const outBuffer = await pipeline.toBuffer();
    const metaOut = await sharp(outBuffer).metadata();
    const outW = metaOut.width ?? meta0.width;
    const outH = metaOut.height ?? meta0.height;

    // Return processed image binary
    return new NextResponse(new Uint8Array(outBuffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Image-Width": String(outW),
        "X-Image-Height": String(outH),
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
