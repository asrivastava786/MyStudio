"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Image as KImage, Transformer } from "react-konva";
import useImage from "use-image";
import { useDesignerStore, type QueueItem } from "@/lib/designerStore";
import { PRODUCT_TEMPLATES, type PrintZone, type ProductTemplate } from "@/lib/productTemplates";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ArtPos = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function artFitToZone(zone: PrintZone, pad = 10): ArtPos {
  return {
    x: zone.x + pad,
    y: zone.y + pad,
    width: zone.w - pad * 2,
    height: zone.h - pad * 2,
    rotation: 0,
  };
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Composite all three sandwich layers into a single thumbnail data-URL.
 * Returns undefined silently if anything fails — never blocks the queue action.
 */
async function buildCompositeThumb(
  product: ProductTemplate,
  artDataUrl: string,
  thumbW = 360
): Promise<string | undefined> {
  try {
    const { canvasW, canvasH, mockupUrl, overlayUrl } = product;

    // native-res offscreen canvas
    const full = Object.assign(document.createElement("canvas"), {
      width: canvasW,
      height: canvasH,
    });
    const ctx = full.getContext("2d");
    if (!ctx) return undefined;

    // Layer 1 — background
    if (mockupUrl) {
      const bg = await loadImg(mockupUrl);
      if (bg) ctx.drawImage(bg, 0, 0, canvasW, canvasH);
    }

    // Layer 2 — Konva artwork (transparent canvas PNG)
    const art = await loadImg(artDataUrl);
    if (art) ctx.drawImage(art, 0, 0, canvasW, canvasH);

    // Layer 3 — shadow/fold overlay
    if (overlayUrl) {
      const ov = await loadImg(overlayUrl);
      if (ov) ctx.drawImage(ov, 0, 0, canvasW, canvasH);
    }

    // Scale down to thumbnail
    const ratio = thumbW / canvasW;
    const thumb = Object.assign(document.createElement("canvas"), {
      width: thumbW,
      height: Math.round(canvasH * ratio),
    });
    thumb.getContext("2d")?.drawImage(full, 0, 0, thumb.width, thumb.height);
    return thumb.toDataURL("image/webp", 0.72);
  } catch {
    return undefined;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductDesignerRK() {
  // ── Selection ───────────────────────────────────────────────────────────────
  const [productIdx, setProductIdx] = useState(0);
  const product = PRODUCT_TEMPLATES[productIdx];
  const [zone, setZone] = useState<PrintZone>(product.zones[0]);

  useEffect(() => {
    setZone(PRODUCT_TEMPLATES[productIdx].zones[0]);
  }, [productIdx]);

  // ── Store ───────────────────────────────────────────────────────────────────
  const setSharedUrl = useDesignerStore((s) => s.setCloudinaryUrl);
  const setPrintifyId = useDesignerStore((s) => s.setPrintifyId);
  const currentPrintifyId = useDesignerStore((s) => s.printifyImageId);
  const addToQueue = useDesignerStore((s) => s.addToQueue);

  // ── Canvas state ────────────────────────────────────────────────────────────
  const [artUrl, setArtUrl] = useState<string | null>(null);
  const [artImg] = useImage(artUrl ?? "", "anonymous");
  const [art, setArt] = useState<ArtPos | null>(null);
  const [isSelected, setIsSelected] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const trRef = useRef<any>(null);
  const artRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Responsive scale ────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (w: number) => setScale(w / product.canvasW);
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((e) => update(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [product.canvasW]);

  // ── Transformer sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSelected && trRef.current && artRef.current) {
      trRef.current.nodes([artRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, artImg]);

  // ── Refit when zone changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!artUrl) return;
    setArt(artFitToZone(zone));
    setIsSelected(false);
  }, [zone, artUrl]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<"idle" | "adding" | "added">("idle");

  // ─────────────────────────────────────────────────────────────────────────
  // Upload handler
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadError(null);
    if (fileRef.current) fileRef.current.value = "";

    try {
      // 1 — Process image (trim, resize, PNG)
      const processForm = new FormData();
      processForm.append("file", file);
      processForm.append("trim", "true");
      processForm.append("format", "png");
      processForm.append("response", "json");
      processForm.append("targetWidthPx", "4000");
      processForm.append("minWidthPx", "3000");
      processForm.append("maxWidthPx", "6000");

      const processRes = await fetch("/api/image-process-upload", {
        method: "POST",
        body: processForm,
      });
      if (!processRes.ok) {
        const e = await processRes.json().catch(() => ({}));
        throw new Error(e?.error ?? "Image processing failed");
      }

      const blob = await processRes.blob();
      const processed = new File([blob], "design.png", { type: blob.type });

      // 2 — Upload to Cloudinary
      const cloudForm = new FormData();
      cloudForm.append("file", processed);
      const cloudRes = await fetch("/api/upload", { method: "POST", body: cloudForm });
      const cloudJson = await cloudRes.json();
      if (!cloudRes.ok || !cloudJson.url) throw new Error(cloudJson?.error ?? "Upload failed");

      // 3 — Register with Printify (get image ID for print ordering)
      const printifyRes = await fetch("/api/printify/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkUrl: cloudJson.url }),
      });
      const printifyJson = await printifyRes.json();
      if (!printifyRes.ok || !printifyJson.ok)
        throw new Error(printifyJson?.error ?? "Printify registration failed");

      setArtUrl(cloudJson.url);
      setSharedUrl(cloudJson.url);
      setPrintifyId(printifyJson.image.id);
      setArt(artFitToZone(zone));
      setIsSelected(true);
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [zone, setSharedUrl, setPrintifyId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Drag / transform helpers
  // ─────────────────────────────────────────────────────────────────────────

  const keepInZone = useCallback(
    (pos: ArtPos): ArtPos => ({
      x: clamp(pos.x, zone.x, zone.x + zone.w - pos.width),
      y: clamp(pos.y, zone.y, zone.y + zone.h - pos.height),
      width: clamp(pos.width, 20, zone.w),
      height: clamp(pos.height, 20, zone.h),
      rotation: pos.rotation ?? 0,
    }),
    [zone]
  );

  const onDragMove = useCallback(
    (e: any) => {
      if (!art) return;
      const node = e.target;
      const next = keepInZone({ ...art, x: node.x(), y: node.y() });
      node.position({ x: next.x, y: next.y });
      setArt((p) => (p ? { ...p, x: next.x, y: next.y } : p));
    },
    [art, keepInZone]
  );

  const onTransformEnd = useCallback(() => {
    const node = artRef.current;
    if (!node || !art) return;
    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const next = keepInZone({
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * sx),
      height: Math.max(20, node.height() * sy),
      rotation: node.rotation(),
    });
    node.position({ x: next.x, y: next.y });
    node.width(next.width);
    node.height(next.height);
    node.rotation(next.rotation ?? 0);
    setArt(next);
  }, [art, keepInZone]);

  // ─────────────────────────────────────────────────────────────────────────
  // Add to queue
  // ─────────────────────────────────────────────────────────────────────────

  const onAddToQueue = useCallback(async () => {
    if (!art || !currentPrintifyId || !artUrl) return;

    setQueueStatus("adding");

    const artDataUrl = stageRef.current?.toDataURL({ pixelRatio: 1 }) as
      | string
      | undefined;

    const previewDataUrl = artDataUrl
      ? await buildCompositeThumb(product, artDataUrl)
      : undefined;

    const item: QueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      productId: product.id,
      zoneId: zone.id,
      printifyImageId: currentPrintifyId,
      cloudinaryUrl: artUrl,
      position: {
        x: +(art.x / product.canvasW).toFixed(4),
        y: +(art.y / product.canvasH).toFixed(4),
        width: +(art.width / product.canvasW).toFixed(4),
        height: +(art.height / product.canvasH).toFixed(4),
        angle: Math.round(art.rotation ?? 0),
      },
      previewDataUrl,
    };

    addToQueue(item);
    setQueueStatus("added");
    setTimeout(() => setQueueStatus("idle"), 3000);
  }, [art, artUrl, currentPrintifyId, product, zone, addToQueue]);

  // ─────────────────────────────────────────────────────────────────────────
  // Product scroll
  // ─────────────────────────────────────────────────────────────────────────

  const scrollToProduct = useCallback((idx: number) => {
    setProductIdx(idx);
    const el = scrollRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────

  const { canvasW, canvasH, mockupUrl, overlayUrl, blendMode } = product;
  const canQueueAdd = !!art && !!currentPrintifyId && !loading && queueStatus !== "adding";

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Product switcher ───────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        role="listbox"
        aria-label="Select product"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}
      >
        {PRODUCT_TEMPLATES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={i === productIdx}
            onClick={() => scrollToProduct(i)}
            className={[
              "snap-center shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl border",
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              i === productIdx
                ? "border-white/60 bg-white/8"
                : "border-white/12 hover:border-white/30 hover:bg-white/[0.04]",
            ].join(" ")}
            style={{ minWidth: 92 }}
          >
            {p.mockupUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.mockupUrl}
                alt={p.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-xl"
                draggable={false}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center">
                <span className="text-[10px] text-white/20 tracking-wide">Soon</span>
              </div>
            )}
            <span className="text-[11px] font-medium text-white/55 tracking-wide">
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {/* ── Zone selector ─────────────────────────────────────────────────── */}
      {product.zones.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Print zone"
        >
          <span className="text-[10px] tracking-[0.18em] uppercase text-white/25 mr-1">
            Area
          </span>
          {product.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZone(z)}
              aria-pressed={z.id === zone.id}
              className={[
                "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                z.id === zone.id
                  ? "border-white/60 bg-white/10 text-white"
                  : "border-white/15 text-white/40 hover:border-white/35 hover:text-white/70",
              ].join(" ")}
            >
              {z.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => { setUploadError(null); fileRef.current?.click(); }}
          disabled={loading}
          aria-busy={loading}
          className={[
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold",
            "bg-white text-black hover:bg-white/90 active:scale-[0.97]",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          ].join(" ")}
        >
          {loading ? (
            <>
              <Spinner dark />
              Uploading…
            </>
          ) : (
            <>
              <UploadIcon />
              Upload Design
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          disabled={loading}
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={onAddToQueue}
          disabled={!canQueueAdd}
          className={[
            "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium",
            "border-white/25 text-white hover:border-white/55 hover:bg-white/5 active:scale-[0.97]",
            "disabled:opacity-30 disabled:cursor-not-allowed transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          ].join(" ")}
        >
          {queueStatus === "adding" ? (
            <>
              <Spinner />
              Adding…
            </>
          ) : (
            "+ Add to Queue"
          )}
        </button>

        {/* Live status region — screen-reader + visual */}
        <div aria-live="polite" aria-atomic="true" className="text-xs min-w-[6rem]">
          {queueStatus === "added" && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckIcon />
              Added to queue
            </span>
          )}
        </div>
      </div>

      {/* ── Upload error ──────────────────────────────────────────────────── */}
      {uploadError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/8 text-red-300 text-sm px-4 py-3"
        >
          <AlertIcon className="shrink-0 mt-0.5 text-red-400" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            aria-label="Dismiss error"
            className="text-red-400/50 hover:text-red-300 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ── 3-Layer sandwich canvas ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-white/8 bg-[#0d0d0d]"
      >
        {/* Height = canvasH scaled to container width */}
        <div
          style={{ width: "100%", height: canvasH * scale, position: "relative" }}
        >
          {/* ── Layer 1: product background ── */}
          {mockupUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mockupUrl}
              alt={product.name}
              draggable={false}
              aria-hidden
              style={layerStyle(canvasW, canvasH, scale)}
            />
          ) : (
            /* Placeholder when mockup not yet added */
            <div
              style={{
                ...layerStyle(canvasW, canvasH, scale),
                background:
                  "linear-gradient(135deg, #1a1a1a 0%, #111 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ fontSize: 14, color: "rgba(255,255,255,0.15)" }}
              >
                Mockup coming soon
              </span>
            </div>
          )}

          {/* ── Layer 2: Konva artwork canvas (transparent bg) ── */}
          <div
            style={{
              ...layerStyle(canvasW, canvasH, scale),
              mixBlendMode: (blendMode ?? "normal") as React.CSSProperties["mixBlendMode"],
            }}
          >
            <Stage
              ref={stageRef}
              width={canvasW}
              height={canvasH}
              style={{ display: "block" }}
              onClick={() => setIsSelected(false)}
              onTap={() => setIsSelected(false)}
            >
              <Layer>
                {/* Safe-area inner guide (8px inset from bleed) */}
                <Rect
                  x={zone.x + 16}
                  y={zone.y + 16}
                  width={zone.w - 32}
                  height={zone.h - 32}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                  dash={[4, 5]}
                  listening={false}
                />
                {/* Print boundary — bleed edge */}
                <Rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  stroke="rgba(255,255,255,0.38)"
                  strokeWidth={1.5}
                  dash={[9, 5]}
                  listening={false}
                />

                {art && artImg && (
                  <>
                    <KImage
                      ref={artRef}
                      image={artImg}
                      x={art.x}
                      y={art.y}
                      width={art.width}
                      height={art.height}
                      rotation={art.rotation ?? 0}
                      draggable
                      onClick={(e) => {
                        e.cancelBubble = true;
                        setIsSelected(true);
                      }}
                      onTap={(e) => {
                        e.cancelBubble = true;
                        setIsSelected(true);
                      }}
                      onDragMove={onDragMove}
                      onTransformEnd={onTransformEnd}
                      onDragEnd={onTransformEnd}
                    />
                    {isSelected && (
                      <Transformer
                        ref={trRef}
                        rotateEnabled
                        anchorSize={14}
                        anchorCornerRadius={3}
                        borderDash={[4, 3]}
                        borderStroke="rgba(255,255,255,0.75)"
                        anchorStroke="rgba(255,255,255,0.75)"
                        anchorFill="#ffffff"
                      />
                    )}
                  </>
                )}
              </Layer>
            </Stage>
          </div>

          {/* ── Layer 3: shadow / fold / highlight overlay ── */}
          {overlayUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={overlayUrl}
              alt=""
              aria-hidden
              draggable={false}
              style={{ ...layerStyle(canvasW, canvasH, scale), pointerEvents: "none" }}
            />
          )}

          {/* Empty-state hint */}
          {!art && !loading && (
            <div
              style={{
                position: "absolute",
                bottom: Math.round(20 * scale),
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span className="text-[11px] text-white/40 bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full">
                Upload a design to preview on the {product.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Print area metadata strip ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/25 select-none">
        <span className="uppercase tracking-[0.16em]">Print area</span>
        <Dot />
        <span>{zone.label}</span>
        <Dot />
        <span>
          {zone.w}&thinsp;×&thinsp;{zone.h}&thinsp;px
        </span>
        {art && (
          <>
            <Dot />
            <span className="text-emerald-500/70">Design placed</span>
          </>
        )}
        {blendMode && blendMode !== "normal" && (
          <>
            <Dot />
            <span className="capitalize opacity-60">{blendMode} blend</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style helper — all three layers share identical transform
// ─────────────────────────────────────────────────────────────────────────────

function layerStyle(
  w: number,
  h: number,
  scale: number
): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: w,
    height: h,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    display: "block",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span
      className={[
        "inline-block w-3.5 h-3.5 rounded-full border-2 animate-spin",
        dark
          ? "border-black/20 border-t-black/70"
          : "border-white/20 border-t-white/70",
      ].join(" ")}
    />
  );
}

function Dot() {
  return <span className="text-white/15">·</span>;
}

function UploadIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1={12} y1={3} x2={12} y2={15} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2="12.01" y2={17} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}
