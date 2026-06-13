"use client";

import { useState } from "react";
import { useDesignerStore } from "@/lib/designerStore";
import { PRODUCT_TEMPLATES } from "@/lib/productTemplates";

type PublishResult = { id: string; ok: boolean; msg: string };

export default function CreateProductTab() {
  const queue = useDesignerStore((s) => s.queue);
  const removeFromQueue = useDesignerStore((s) => s.removeFromQueue);
  const updateQueueItem = useDesignerStore((s) => s.updateQueueItem);

  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);

  const publishAll = async () => {
    if (!queue.length) return;
    setPublishing(true);
    setResults([]);

    const newResults: PublishResult[] = [];

    for (const item of queue) {
      if (!item.title?.trim()) {
        newResults.push({ id: item.id, ok: false, msg: "Add a title first" });
        continue;
      }
      if (!item.price || Number(item.price) <= 0) {
        newResults.push({ id: item.id, ok: false, msg: "Set a price first" });
        continue;
      }

      const template = PRODUCT_TEMPLATES.find((t) => t.id === item.productId);

      try {
        const res = await fetch("/api/printify/create-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            description: "",
            imageId: item.printifyImageId,
            variantIds: template?.defaultVariants?.length
              ? template.defaultVariants
              : [76241],
            priceCents: Math.round(Number(item.price) * 100),
            position: {
              x: item.position.x,
              y: item.position.y,
              width: item.position.width,
              height: item.position.height,
            },
            angle: item.position.angle ?? 0,
            blueprintId: template?.blueprintId || undefined,
            printProviderId: template?.printProviderId || undefined,
          }),
        });
        const json = await res.json().catch(() => ({}));
        newResults.push({
          id: item.id,
          ok: res.ok && json.ok,
          msg:
            res.ok && json.ok
              ? `Published (ID: ${json.product?.id})`
              : json?.error || `Failed (${res.status})`,
        });
      } catch {
        newResults.push({ id: item.id, ok: false, msg: "Network error" });
      }
    }

    setResults(newResults);
    setPublishing(false);

    newResults
      .filter((r) => r.ok)
      .forEach((r) => removeFromQueue(r.id));
  };

  if (!queue.length) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-white/30 text-sm">Queue is empty</p>
        <p className="text-white/20 text-xs">
          Use the Designer above to place your artwork and click&nbsp;
          <strong className="text-white/30">+ Add to Queue</strong>.
        </p>
      </div>
    );
  }

  const allReady = queue.every((i) => i.title?.trim() && Number(i.price) > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/30 mb-0.5">
            Publishing Queue
          </p>
          <h2 className="text-xl font-semibold">
            {queue.length} item{queue.length !== 1 ? "s" : ""}
          </h2>
        </div>

        <button
          onClick={publishAll}
          disabled={publishing || !allReady}
          className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {publishing ? (
            <span className="flex items-center gap-2">
              <Spinner /> Publishing…
            </span>
          ) : (
            "Publish All"
          )}
        </button>
      </div>

      <div className="space-y-3">
        {queue.map((item) => {
          const template = PRODUCT_TEMPLATES.find((t) => t.id === item.productId);
          const result = results.find((r) => r.id === item.id);

          return (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              {/* Preview thumbnail */}
              {item.previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewDataUrl}
                  alt="preview"
                  className="w-16 h-20 object-cover rounded-lg shrink-0 bg-black/40"
                  draggable={false}
                />
              ) : (
                <div className="w-16 h-20 rounded-lg bg-white/5 shrink-0" />
              )}

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-white/40">
                    {template?.name ?? item.productId} · {item.zoneId}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    className="text-white/25 hover:text-white/60 text-xs shrink-0 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <input
                  placeholder="Product title"
                  value={item.title ?? ""}
                  onChange={(e) => updateQueueItem(item.id, { title: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    placeholder="Price USD"
                    min="0"
                    step="0.01"
                    value={item.price ?? ""}
                    onChange={(e) => updateQueueItem(item.id, { price: e.target.value })}
                    className="w-28 bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  {result && (
                    <span
                      className={`text-xs ${result.ok ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {result.msg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!allReady && (
        <p className="text-xs text-white/30 text-center">
          Fill in title and price for all items to enable publishing.
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" />
  );
}
