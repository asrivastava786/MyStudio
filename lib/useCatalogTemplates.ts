"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductTemplate } from "@/lib/productTemplates";

// The dashboard keeps every tab mounted at once (just CSS-hidden via
// peer-checked), so a hook's mount-time fetch never re-runs when another
// tab changes data in the same page session. The admin Catalog tab
// broadcasts this event after create/update/delete so any other mounted
// consumer (the designer canvas, the publish queue) can refetch in place.
export const CATALOG_TEMPLATES_CHANGED_EVENT = "catalog-templates-changed";

export function notifyCatalogTemplatesChanged() {
  window.dispatchEvent(new Event(CATALOG_TEMPLATES_CHANGED_EVENT));
}

export function useCatalogTemplates() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog-templates");
      const json = await res.json();
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
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(CATALOG_TEMPLATES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CATALOG_TEMPLATES_CHANGED_EVENT, refresh);
  }, [refresh]);

  return { templates, loading, error };
}
