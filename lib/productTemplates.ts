// Shared shape for a "product a designer can place art on".
// Data comes from admin-curated `CatalogTemplate` rows (see
// app/api/catalog-templates) rather than being hardcoded here — the
// blueprint/print-provider/variant ids come straight from Printify's own
// catalog, picked once by an admin in the Catalog admin tab.

export type PrintZone = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ProductTemplate = {
  id: string;
  name: string;
  /** Flat product mockup — background layer */
  mockupUrl: string;
  /** Transparent PNG with shadows/folds/highlights — top layer */
  overlayUrl?: string;
  /**
   * CSS mix-blend-mode applied to the artwork canvas layer.
   * "multiply" makes designs look printed on fabric (darkens with bg).
   * "normal" for photorealistic mockups with a pre-cut white print area.
   */
  blendMode?: "normal" | "multiply" | "screen" | "overlay";
  canvasW: number;
  canvasH: number;
  zones: PrintZone[];
  blueprintId: number;
  printProviderId: number;
  defaultVariants: number[];
};
