export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { artworkUrl, fileName } = await req.json();
    if (!artworkUrl || !/^https?:\/\//.test(artworkUrl)) {
      return NextResponse.json({ error: "Invalid artworkUrl" }, { status: 400 });
    }

    const res = await fetch("https://api.printify.com/v1/uploads/images.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}`,
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({ file_name: fileName || "zory-artwork.png", url: artworkUrl }),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json?.message || "Printify upload failed", details: json }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      image: { id: json.id, width: json.width, height: json.height },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
