"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KImage, Transformer } from "react-konva";
import useImage from "use-image";
import { useDesignerStore } from "@/lib/designerStore";

//export const runtime = "edge"; //issue with cloudflare pages

type Pos = { x: number; y: number; width: number; height: number; rotation?: number };

const CANVAS_W = 800;
const CANVAS_H = 1000;
const TOTE_BG = "https://res.cloudinary.com/zory-studio/image/upload/v1756152149/tote_beige_bdrizt.avif";
const PRINT_AREA = { x: 250, y: 500, w: 300, h: 400 };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ProductDesignerRK() {
  const [bg] = useImage(TOTE_BG, "anonymous");

  // one source of truth for artwork image shown on canvas
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [artImg] = useImage(artUrl || "", "anonymous");

  // shared store
  const setSharedUrl = useDesignerStore((s) => s.setCloudinaryUrl);
  const setSharedBox = useDesignerStore((s) => s.setBox);
  const setPrintifyId = useDesignerStore((s) => (s as any).setPrintifyId); // ensure this exists in your store

  // transform state
  const [art, setArt] = useState<Pos | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const trRef = useRef<any>(null);
  const artRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && artRef.current) {
      trRef.current.nodes([artRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, artImg]);

  const handleUpload = async () => {

    const input = fileRef.current;
    const file = input?.files?.[0];
    if (!file) return;

    setLoading(true);
    // Clear BEFORE any awaits so same file can be re-picked; avoids e.currentTarget null
    input.value = "";

    //Image processing 
    const Iform = new FormData();
    Iform.append("file", file);
    // optional:
    Iform.append("trim", "true");
    Iform.append("format", "png");          // or "webp"
    Iform.append("response", "json");       // or "binary"
    Iform.append("targetWidthPx", "4000");  // clamp with:
    Iform.append("minWidthPx", "3000");
    Iform.append("maxWidthPx", "6000");

    const Ires = await fetch("/api/image-process-upload", { method: "POST", body: Iform });
    if (!Ires.ok) {
      const err = await Ires.json().catch(() => ({}));
      alert(err?.error || "Image processing failed");
      return;
    }

    const processedBlob = await Ires.blob();
    const processedFile = new File([processedBlob], "processed.png", { type: processedBlob.type });
    if (!processedFile) return alert("Image processing failed");

    // 1) upload to Cloudinary
    const form = new FormData();
    form.append("file", processedFile);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok || !json.url) {
      alert(json?.error || "Cloudinary upload failed");
      return;
    }

    // 2) upload that URL to Printify to get image.id (optional if you prefetch later)
    const uploadRes = await fetch("/api/printify/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artworkUrl: json.url }),
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok || !uploadJson.ok) {
      alert(uploadJson?.error || "Printify upload failed");
      console.log("details:", uploadJson?.details);
      return;
    }

    // 3) set preview + share to store
    setArtUrl(json.url);      // <-- this is what useImage reads
    setSharedUrl(json.url);   // optional, if you still use it elsewhere
    setPrintifyId(uploadJson.image.id);

    // 4) fit into print area
    const pad = 10;
    const next: Pos = {
      x: PRINT_AREA.x + pad,
      y: PRINT_AREA.y + pad,
      width: PRINT_AREA.w - pad * 2,
      height: PRINT_AREA.h - pad * 2,
      rotation: 0,
    };
    setArt(next);
    setSharedBox({
      x: +(next.x / CANVAS_W).toFixed(4),
      y: +(next.y / CANVAS_H).toFixed(4),
      width: +(next.width / CANVAS_W).toFixed(4),
      height: +(next.height / CANVAS_H).toFixed(4),
      angle: 0,
    });
    setIsSelected(true);

    setLoading(false);
  };

  const keepInsidePrintArea = (next: Pos): Pos => {
    const r = next.rotation ?? 0;
    const nx = clamp(next.x, PRINT_AREA.x, PRINT_AREA.x + PRINT_AREA.w - next.width);
    const ny = clamp(next.y, PRINT_AREA.y, PRINT_AREA.y + PRINT_AREA.h - next.height);
    const nw = clamp(next.width, 20, PRINT_AREA.w);
    const nh = clamp(next.height, 20, PRINT_AREA.h);
    return { x: nx, y: ny, width: nw, height: nh, rotation: r };
  };

  const onDragMove = (e: any) => {
    if (!art) return;
    const node = e.target;
    const next = keepInsidePrintArea({ ...art, x: node.x(), y: node.y() });
    setArt(next);
  };

  const onTransformEnd = () => {
    if (!art || !artRef.current) return;
    const node = artRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newW = Math.max(20, node.width() * scaleX);
    const newH = Math.max(20, node.height() * scaleY);
    node.scaleX(1);
    node.scaleY(1);
    const next = keepInsidePrintArea({
      x: node.x(),
      y: node.y(),
      width: newW,
      height: newH,
      rotation: node.rotation(),
    });
    node.position({ x: next.x, y: next.y });
    node.width(next.width);
    node.height(next.height);
    node.rotation(next.rotation || 0);
    setArt(next);
  };

  const toRelativeWhole = () => {
    if (!art) return null;
    return {
      x: +(art.x / CANVAS_W).toFixed(4),
      y: +(art.y / CANVAS_H).toFixed(4),
      width: +(art.width / CANVAS_W).toFixed(4),
      height: +(art.height / CANVAS_H).toFixed(4),
    };
  };

  useEffect(() => {
    if (!art) return;
    setSharedBox({
      x: +(art.x / CANVAS_W).toFixed(4),
      y: +(art.y / CANVAS_H).toFixed(4),
      width: +(art.width / CANVAS_W).toFixed(4),
      height: +(art.height / CANVAS_H).toFixed(4),
      angle: Math.round(art.rotation || 0),
    });
  }, [art, setSharedBox]);

  const rel = useMemo(() => toRelativeWhole(), [art]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <button className="bg-black text-white px-3 py-2 rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          aria-disabled={loading}
          aria-busy={loading}>

          {loading ? "Loading.." : "Upload Design"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          disabled={loading}
          onChange={handleUpload}
        />
        <button className="border px-3 py-2 rounded bg-black" onClick={() => {
          const uri = stageRef.current?.toDataURL({ pixelRatio: 2 });
          if (!uri) return;
          const a = document.createElement("a");
          a.href = uri;
          a.download = "tote-preview.png";
          a.click();
        }} disabled={!art}>
          Download Preview
        </button>
        {rel && (
          <code className="text-xs bg-gray-100 rounded px-2 py-1">
            {JSON.stringify(rel)}
          </code>
        )}
      </div>

      <div className="border rounded p-3 inline-block">
        <Stage ref={stageRef} width={CANVAS_W} height={CANVAS_H}>
          <Layer>
            {bg && <KImage image={bg} x={0} y={0} width={CANVAS_W} height={CANVAS_H} listening={false} />}
            <Rect x={PRINT_AREA.x} y={PRINT_AREA.y} width={PRINT_AREA.w} height={PRINT_AREA.h}
              stroke="rgba(0,0,0,0.35)" strokeWidth={1} dash={[6, 4]} listening={false} />
            {art && artImg && (
              <>
                <KImage
                  ref={artRef}
                  image={artImg}
                  x={art.x} y={art.y}
                  width={art.width} height={art.height}
                  rotation={art.rotation || 0}
                  draggable
                  onClick={() => setIsSelected(true)}
                  onTap={() => setIsSelected(true)}
                  onDragMove={onDragMove}
                  onTransformEnd={onTransformEnd}
                  onDragEnd={onTransformEnd}
                />
                {isSelected && <Transformer ref={trRef} rotateEnabled anchorSize={8} borderDash={[4, 3]} />}
              </>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
