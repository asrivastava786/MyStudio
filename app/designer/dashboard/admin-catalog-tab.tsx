"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notifyCatalogTemplatesChanged } from "@/lib/useCatalogTemplates";

/* ─────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────── */

type Blueprint = { id: number; title: string; brand: string; model: string; images: string[] };
type PrintProvider = { id: number; title: string };
type Placeholder = { position: string; height: number; width: number };
type Variant = { id: number; title: string; placeholders?: Placeholder[] };

type Zone = { id: string; label: string; x: number; y: number; w: number; h: number };

type CatalogTemplate = {
  id: string;
  name: string;
  blueprintId: number;
  printProviderId: number;
  mockupUrl: string;
  overlayUrl: string | null;
  blendMode: string;
  canvasW: number;
  canvasH: number;
  zones: Zone[];
  defaultVariants: number[];
  active: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────────────── */

export default function AdminCatalogTab() {
  const [templates, setTemplates] = useState<CatalogTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const refreshTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/catalog-templates");
      const json = await res.json();
      setTemplates(json.templates ?? []);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  const toggleActive = async (t: CatalogTemplate) => {
    await fetch(`/api/admin/catalog-templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    });
    refreshTemplates();
    notifyCatalogTemplatesChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this catalog product? Designers will no longer see it.")) return;
    await fetch(`/api/admin/catalog-templates/${id}`, { method: "DELETE" });
    notifyCatalogTemplatesChanged();
    refreshTemplates();
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] tracking-[0.18em] uppercase text-white/30 mb-1">Admin</p>
        <h2 className="text-xl font-semibold mb-4">Add a Printify Product</h2>
        <NewTemplateForm
          onCreated={() => {
            refreshTemplates();
            notifyCatalogTemplatesChanged();
          }}
        />
      </div>

      <div className="pt-8 border-t border-white/8">
        <p className="text-[11px] tracking-[0.18em] uppercase text-white/30 mb-3">
          Available Products ({templates.length})
        </p>
        {loadingTemplates ? (
          <p className="text-sm text-white/30">Loading…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-white/30">No catalog products yet.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.mockupUrl}
                  alt={t.name}
                  className="w-12 h-12 object-cover rounded-lg bg-black/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  <p className="text-xs text-white/35">
                    Blueprint {t.blueprintId} · Provider {t.printProviderId} · {t.zones.length} zone
                    {t.zones.length !== 1 ? "s" : ""} · {t.defaultVariants.length} variant
                    {t.defaultVariants.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(t)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    t.active
                      ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      : "border-white/15 text-white/40 hover:bg-white/5",
                  ].join(" ")}
                >
                  {t.active ? "Active" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="text-white/25 hover:text-red-400 text-xs transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * New template form: browse Printify catalog → pick blueprint/provider/
 * variants → upload mockup art → position print zones → save.
 * ────────────────────────────────────────────────────────────────────── */

function NewTemplateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");

  // ── Catalog browse ──────────────────────────────────────────────────────
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loadingBlueprints, setLoadingBlueprints] = useState(true);
  const [search, setSearch] = useState("");
  const [blueprintId, setBlueprintId] = useState<number | null>(null);

  const [printProviders, setPrintProviders] = useState<PrintProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [printProviderId, setPrintProviderId] = useState<number | null>(null);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/admin/printify-catalog/blueprints")
      .then((r) => r.json())
      .then((j) => setBlueprints(j.blueprints ?? []))
      .finally(() => setLoadingBlueprints(false));
  }, []);

  useEffect(() => {
    if (blueprintId == null) return;
    setPrintProviders([]);
    setPrintProviderId(null);
    setLoadingProviders(true);
    fetch(`/api/admin/printify-catalog/blueprints/${blueprintId}/print-providers`)
      .then((r) => r.json())
      .then((j) => setPrintProviders(j.printProviders ?? []))
      .finally(() => setLoadingProviders(false));
  }, [blueprintId]);

  useEffect(() => {
    if (blueprintId == null || printProviderId == null) return;
    setVariants([]);
    setSelectedVariantIds(new Set());
    setLoadingVariants(true);
    fetch(`/api/admin/printify-catalog/blueprints/${blueprintId}/print-providers/${printProviderId}/variants`)
      .then((r) => r.json())
      .then((j) => setVariants(j.variants ?? []))
      .finally(() => setLoadingVariants(false));
  }, [blueprintId, printProviderId]);

  const filteredBlueprints = blueprints.filter((b) =>
    `${b.title} ${b.brand} ${b.model}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Mockup art + canvas ─────────────────────────────────────────────────
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(1000);
  const [blendMode, setBlendMode] = useState<"normal" | "multiply" | "screen" | "overlay">("multiply");
  const [uploading, setUploading] = useState<"mockup" | "overlay" | null>(null);
  const [pickingStock, setPickingStock] = useState(false);

  const uploadImage = useCallback(async (file: File, kind: "mockup" | "overlay") => {
    setUploading(kind);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      if (kind === "mockup") {
        setMockupUrl(json.url);
        if (json.width) setCanvasW(json.width);
        if (json.height) setCanvasH(json.height);
      } else {
        setOverlayUrl(json.url);
      }
    } catch (e: any) {
      alert(e?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  }, []);

  const selectedBlueprint = blueprints.find((b) => b.id === blueprintId);

  const pickStockImage = useCallback(async (url: string) => {
    setPickingStock(true);
    try {
      const { width, height } = await loadImageSize(url);
      setMockupUrl(url);
      setCanvasW(width);
      setCanvasH(height);
    } catch {
      alert("Couldn't load that image — try another one or upload your own.");
    } finally {
      setPickingStock(false);
    }
  }, []);

  // ── Zones ────────────────────────────────────────────────────────────────
  const [zones, setZones] = useState<Zone[]>([
    { id: "front", label: "Front", x: 200, y: 250, w: 400, h: 500 },
  ]);
  const [activeZoneIdx, setActiveZoneIdx] = useState(0);

  const addZone = () => {
    setZones((z) => [
      ...z,
      { id: `zone-${z.length + 1}`, label: `Zone ${z.length + 1}`, x: 100, y: 100, w: 300, h: 300 },
    ]);
    setActiveZoneIdx(zones.length);
  };
  const removeZone = (idx: number) => {
    setZones((z) => z.filter((_, i) => i !== idx));
    setActiveZoneIdx(0);
  };
  const updateZone = (idx: number, patch: Partial<Zone>) => {
    setZones((z) => z.map((zone, i) => (i === idx ? { ...zone, ...patch } : zone)));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave =
    name.trim() &&
    blueprintId != null &&
    printProviderId != null &&
    mockupUrl &&
    selectedVariantIds.size > 0 &&
    zones.length > 0 &&
    !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/catalog-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          blueprintId,
          printProviderId,
          mockupUrl,
          overlayUrl: overlayUrl || undefined,
          blendMode,
          canvasW,
          canvasH,
          zones,
          defaultVariants: Array.from(selectedVariantIds),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Save failed");

      // reset for next entry
      setName("");
      setBlueprintId(null);
      setPrintProviderId(null);
      setMockupUrl(null);
      setOverlayUrl(null);
      setZones([{ id: "front", label: "Front", x: 200, y: 250, w: 400, h: 500 }]);
      onCreated();
    } catch (e: any) {
      setSaveError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <Field label="Product name (shown to designers)">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Classic Tote Bag"
          className={inputCls}
        />
      </Field>

      {/* Blueprint picker */}
      <Field label="Printify blueprint">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search catalog…"
          className={`${inputCls} mb-2`}
        />
        {loadingBlueprints ? (
          <p className="text-xs text-white/30">Loading catalog…</p>
        ) : (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/5">
            {filteredBlueprints.slice(0, 200).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBlueprintId(b.id)}
                className={[
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  b.id === blueprintId ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5",
                ].join(" ")}
              >
                {b.title} <span className="text-white/30">· {b.brand}</span>
              </button>
            ))}
          </div>
        )}
      </Field>

      {/* Print provider picker */}
      {blueprintId != null && (
        <Field label="Print provider">
          {loadingProviders ? (
            <p className="text-xs text-white/30">Loading providers…</p>
          ) : (
            <select
              value={printProviderId ?? ""}
              onChange={(e) => setPrintProviderId(Number(e.target.value) || null)}
              className={inputCls}
            >
              <option value="">Select a provider…</option>
              {printProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      {/* Variant picker */}
      {printProviderId != null && (
        <Field label={`Variants to offer (${selectedVariantIds.size} selected)`}>
          {loadingVariants ? (
            <p className="text-xs text-white/30">Loading variants…</p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
              {variants.map((v) => {
                const checked = selectedVariantIds.has(v.id);
                return (
                  <label
                    key={v.id}
                    className="flex items-center gap-2 text-xs text-white/60 px-2 py-1 rounded-md hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedVariantIds((s) => {
                          const next = new Set(s);
                          checked ? next.delete(v.id) : next.add(v.id);
                          return next;
                        })
                      }
                    />
                    {v.title}
                  </label>
                );
              })}
            </div>
          )}
        </Field>
      )}

      {/* Mockup art */}
      <Field label="Mockup photo (background layer)">
        {selectedBlueprint && selectedBlueprint.images.length > 0 && (
          <div className="mb-3">
            <p className="text-[11px] text-white/30 mb-1.5">
              Use one of Printify&apos;s catalog photos, or upload your own below.
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedBlueprint.images.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => pickStockImage(src)}
                  disabled={pickingStock}
                  className={[
                    "w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors disabled:opacity-40",
                    mockupUrl === src ? "border-emerald-400" : "border-white/10 hover:border-white/30",
                  ].join(" ")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        <UploadButton
          uploading={uploading === "mockup"}
          onFile={(f) => uploadImage(f, "mockup")}
          label={mockupUrl ? "Replace mockup" : "Upload your own mockup"}
        />
      </Field>

      <Field label="Shadow / fold overlay (optional, top layer)">
        <UploadButton
          uploading={uploading === "overlay"}
          onFile={(f) => uploadImage(f, "overlay")}
          label={overlayUrl ? "Replace overlay" : "Upload overlay"}
        />
      </Field>

      <Field label="Blend mode for artwork layer">
        <select
          value={blendMode}
          onChange={(e) => setBlendMode(e.target.value as typeof blendMode)}
          className={inputCls}
        >
          <option value="multiply">Multiply (fabric / printed look)</option>
          <option value="normal">Normal (photorealistic cutout)</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
        </select>
      </Field>

      {/* Zone editor */}
      {mockupUrl && (
        <Field label="Print zones — drag to position, drag corner to resize">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {zones.map((z, i) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveZoneIdx(i)}
                className={[
                  "px-2.5 py-1 rounded-lg text-xs border",
                  i === activeZoneIdx
                    ? "border-white/50 bg-white/10 text-white"
                    : "border-white/15 text-white/40 hover:text-white/70",
                ].join(" ")}
              >
                {z.label}
              </button>
            ))}
            <button
              type="button"
              onClick={addZone}
              className="px-2.5 py-1 rounded-lg text-xs border border-dashed border-white/20 text-white/40 hover:text-white/70"
            >
              + Add zone
            </button>
            {zones.length > 1 && (
              <button
                type="button"
                onClick={() => removeZone(activeZoneIdx)}
                className="px-2.5 py-1 rounded-lg text-xs text-red-400/70 hover:text-red-400"
              >
                Remove
              </button>
            )}
          </div>

          <ZoneEditor
            mockupUrl={mockupUrl}
            canvasW={canvasW}
            canvasH={canvasH}
            zone={zones[activeZoneIdx]}
            onChange={(patch) => updateZone(activeZoneIdx, patch)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
            <NumField label="Label" value={zones[activeZoneIdx].label} onChange={(v) => updateZone(activeZoneIdx, { label: v as any })} text />
            <NumField label="X" value={zones[activeZoneIdx].x} onChange={(v) => updateZone(activeZoneIdx, { x: v as number })} />
            <NumField label="Y" value={zones[activeZoneIdx].y} onChange={(v) => updateZone(activeZoneIdx, { y: v as number })} />
            <NumField label="W" value={zones[activeZoneIdx].w} onChange={(v) => updateZone(activeZoneIdx, { w: v as number })} />
            <NumField label="H" value={zones[activeZoneIdx].h} onChange={(v) => updateZone(activeZoneIdx, { h: v as number })} />
          </div>
        </Field>
      )}

      {saveError && <p className="text-sm text-red-400">{saveError}</p>}

      <button
        type="button"
        onClick={save}
        disabled={!canSave}
        className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "Saving…" : "Save Product"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Interactive zone editor: mockup image with a draggable/resizable rect
 * ────────────────────────────────────────────────────────────────────── */

function ZoneEditor({
  mockupUrl,
  canvasW,
  canvasH,
  zone,
  onChange,
}: {
  mockupUrl: string;
  canvasW: number;
  canvasH: number;
  zone: Zone;
  onChange: (patch: Partial<Zone>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.getBoundingClientRect().width / canvasW);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasW]);

  const dragState = useRef<{ mode: "move" | "resize"; startX: number; startY: number; zone: Zone } | null>(null);

  const onPointerDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = { mode, startX: e.clientX, startY: e.clientY, zone };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    const st = dragState.current;
    if (!st) return;
    const dx = (e.clientX - st.startX) / scale;
    const dy = (e.clientY - st.startY) / scale;

    if (st.mode === "move") {
      onChange({
        x: clamp(st.zone.x + dx, 0, canvasW - st.zone.w),
        y: clamp(st.zone.y + dy, 0, canvasH - st.zone.h),
      });
    } else {
      onChange({
        w: clamp(st.zone.w + dx, 20, canvasW - st.zone.x),
        h: clamp(st.zone.h + dy, 20, canvasH - st.zone.y),
      });
    }
  };

  const onPointerUp = () => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 select-none"
      style={{ aspectRatio: `${canvasW} / ${canvasH}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mockupUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div
        onPointerDown={onPointerDown("move")}
        className="absolute border-2 border-dashed border-emerald-400/80 bg-emerald-400/10 cursor-move"
        style={{
          left: zone.x * scale,
          top: zone.y * scale,
          width: zone.w * scale,
          height: zone.h * scale,
        }}
      >
        <div
          onPointerDown={onPointerDown("resize")}
          className="absolute -right-1.5 -bottom-1.5 w-4 h-4 rounded-full bg-emerald-400 cursor-se-resize"
        />
      </div>
    </div>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function loadImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * Small UI helpers
 * ────────────────────────────────────────────────────────────────────── */

const inputCls =
  "w-full bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  text,
}: {
  label: string;
  value: number | string;
  onChange: (v: number | string) => void;
  text?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wide text-white/30 mb-1">{label}</span>
      <input
        type={text ? "text" : "number"}
        value={value}
        onChange={(e) => onChange(text ? e.target.value : Number(e.target.value))}
        className={inputCls}
      />
    </label>
  );
}

function UploadButton({
  uploading,
  onFile,
  label,
}: {
  uploading: boolean;
  onFile: (f: File) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="px-4 py-2 rounded-lg border border-white/15 text-sm text-white/70 hover:border-white/35 hover:text-white disabled:opacity-40 transition-colors"
      >
        {uploading ? "Uploading…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
