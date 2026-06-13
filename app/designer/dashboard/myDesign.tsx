"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

export type DesignItem = {
  id: string;
  title: string;
  description: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  image: string | null;
  priceCents: number | null;
  tags: string[];
  updatedAt: string;
};

export default function DesignerDesignsTab() {
  const [items, setItems] = useState<DesignItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadedOnce = useRef(false);

  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"recent" | "title" | "price">("recent");

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/printify/get-products-by-designer-email", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setItems(json.items ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load designs.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    fetchDesigns();
  }, [fetchDesigns]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (items ?? []).forEach((it) => it.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    let out = (items ?? []).slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q) ||
          it.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTags.length) {
      out = out.filter((it) => activeTags.every((t) => it.tags?.includes(t)));
    }
    if (sort === "title") out.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "price") out.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
    else out.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return out;
  }, [items, query, activeTags, sort]);

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 relative">
          <input
            placeholder="Search title, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/12 rounded-xl pl-4 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="bg-white/[0.05] border border-white/12 rounded-xl px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-white/30 transition-colors"
        >
          <option value="recent">Most recent</option>
          <option value="title">Title A→Z</option>
          <option value="price">Price (desc)</option>
        </select>

        <button
          onClick={fetchDesigns}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-white/15 text-white/50 text-sm hover:text-white hover:border-white/30 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {loading ? "Refreshing…" : "↺ Refresh"}
        </button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => {
            const on = activeTags.includes(t);
            return (
              <button
                key={t}
                onClick={() =>
                  setActiveTags((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                }
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
                  on
                    ? "bg-white text-black border-white"
                    : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70",
                ].join(" ")}
              >
                {t}
                {on && <span className="opacity-50">×</span>}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              className="text-xs text-white/30 hover:text-white/60 px-2 py-1 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && <GridSkeleton />}

      {/* Empty state */}
      {!loading && !error && items !== null && filtered.length === 0 && (
        <div className="rounded-xl border border-white/8 py-16 text-center">
          <p className="text-white/30 text-sm">No designs found.</p>
          <p className="text-white/20 text-xs mt-1">
            {query || activeTags.length ? "Try a different filter." : "Create a product to see it here."}
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((it) => (
            <DesignCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card ── */

function DesignCard({ item }: { item: DesignItem }) {
  return (
    <div className="group rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-white/15 transition-colors">
      {/* Image */}
      <div className="aspect-[4/3] w-full bg-white/[0.04] overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-white/20 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-white/90 line-clamp-1" title={item.title}>
            {item.title}
          </h3>
          <span className="text-[11px] text-white/25 whitespace-nowrap shrink-0 mt-0.5">
            {timeAgo(item.updatedAt)}
          </span>
        </div>

        {item.description && (
          <p className="text-xs text-white/40 line-clamp-2" title={item.description}>
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 3).map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="text-[10px] bg-white/8 text-white/50 border-0 rounded-full px-2 py-0.5"
              >
                {t}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] border-white/15 text-white/30 rounded-full px-2 py-0.5"
              >
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
          <span className="text-sm font-semibold text-white/80">{formatPrice(item.priceCents)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/8 overflow-hidden">
          <div className="aspect-[4/3] bg-white/[0.04]" />
          <div className="p-4 space-y-2.5">
            <div className="h-3.5 bg-white/[0.05] rounded-lg w-3/4" />
            <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
            <div className="flex justify-between pt-2">
              <div className="h-4 w-16 bg-white/[0.04] rounded-full" />
              <div className="h-4 w-12 bg-white/[0.04] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Helpers ── */

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
