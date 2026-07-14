"use client";

import { useEffect, useState } from "react";
import type { ProductTemplate } from "@/lib/productTemplates";

export function useCatalogTemplates() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/catalog-templates")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const mapped: ProductTemplate[] = (json.templates ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          mockupUrl: t.mockupUrl,
          overlayUrl: t.overlayUrl ?? undefined,
          blendMode: t.blendMode,
          canvasW: t.canvasW,
          canvasH: t.canvasH,
          zones: t.zones,
          blueprintId: t.blueprintId,
          printProviderId: t.printProviderId,
          defaultVariants: t.defaultVariants,
        }));
        setTemplates(mapped);
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load products"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return { templates, loading, error };
}
