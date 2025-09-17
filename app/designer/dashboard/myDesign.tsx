"use client";

import { useEffect, useMemo, useRef, useState, useCallback  } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signIn } from "next-auth/react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type DesignItem = {
  id: string;
  title: string;
  description: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  image: string | null;
  priceCents: number | null;
  tags: string[];
  updatedAt: string; // ISO
};

export default function DesignerDesignsTab( ) {
  const [items, setItems] = useState<DesignItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadedOnce = useRef(false); 

//   const { data: session, status } = useSession();
//   const email = session?.user?.email ?? "";

  // UI state
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<"recent" | "title" | "price">("recent");


  const fetchDesigns = useCallback(async () =>{
    //if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/printify/get-products-by-designer-email", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setItems(json.items ?? []);
    } catch (e: any) {
      setError(e?.message || "Failed to load designs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    if (loadedOnce.current) return;                 // prevent double-call in dev
    loadedOnce.current = true;
    fetchDesigns();
  }, [fetchDesigns]);  

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (items ?? []).forEach((it) => it.tags?.forEach((t: string) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    let out = (items ?? []).slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter(
        (it) =>
          (it.title?.toLowerCase() || "").includes(q) ||
          (it.description?.toLowerCase() || "").includes(q) ||
          (it.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (activeTags.length) {
      out = out.filter((it) => activeTags.every((t) => it.tags?.includes(t)));
    }
    switch (sort) {
      case "title":
        out.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "price":
        out.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
        break;
      default:
        out.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
    }
    return out;
  }, [items, query, activeTags, sort]);

  return (
    <Tabs defaultValue="designs" className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <TabsList>
          <TabsTrigger value="designs">Designs</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            placeholder="Search title, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />

          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-40 text-black">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="title">Title A→Z</SelectItem>
              <SelectItem value="price">Price (desc)</SelectItem>
            </SelectContent>
          </Select>

          <Button className= "text-black"variant="outline" size="sm" onClick={fetchDesigns} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <TabsContent value="designs" className="mt-0">
        {/* Tag filter row */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {allTags.map((t) => {
              const on = activeTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    setActiveTags((prev) =>
                      on ? prev.filter((x) => x !== t) : [...prev, t],
                    )
                  }
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition ${
                    on ? "bg-black text-white" : "bg-black hover:bg-neutral-50"
                  }`}
                >
                  {t}
                  {on && <span className="opacity-70">×</span>}
                </button>
              );
            })}
            {activeTags.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setActiveTags([])}>
                Clear
              </Button>
            )}
          </div>
        )}

        {/* States */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
            Failed to load designs: {error}
          </div>
        )}

        {loading && <GridSkeleton />}

        {/* {!loading && filtered.length === 0 />} /* && <EmptyState email={email} />}*/ }

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((it) => (
              <DesignCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

function formatPrice(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function timeAgo(iso: string) {
  const dt = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - dt.getTime());
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString();
}

function DesignCard({ item }: { item: DesignItem }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] w-full bg-neutral-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-neutral-400 text-sm">
            No image
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium line-clamp-1" title={item.title}>
            {item.title}
          </h3>
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {timeAgo(item.updatedAt)}
          </span>
        </div>
        {item.description && (
          <p
            className="text-sm text-neutral-600 line-clamp-2 mt-1"
            title={item.description}
          >
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1 flex-wrap">
            {item.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="text-sm font-semibold">{formatPrice(item.priceCents)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function GridSkeleton() {
  const arr = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {arr.map((_, i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="aspect-[4/3] bg-neutral-200" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-neutral-200 rounded" />
            <div className="h-3 bg-neutral-200 rounded w-3/4" />
            <div className="flex justify-between mt-3">
              <div className="h-5 w-24 bg-neutral-200 rounded" />
              <div className="h-5 w-14 bg-neutral-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ email }: { email: string }) {
  return (
    <div className="rounded-lg border p-8 text-center text-neutral-600">
      <p className="mb-2 font-medium">No designs yet</p>
      <p className="text-sm">
        We didn’t find any products for{" "}
        <span className="font-semibold">{email}</span>.
      </p>
      <p className="text-sm mt-1">Create a product in the Designer to see it here.</p>
    </div>
  );
}
