// Thin proxy over Printify's read-only Catalog API.
// https://developers.printify.com/#catalog
//
// Used by the admin catalog picker so blueprint/print-provider/variant ids
// come from Printify directly instead of being hand-typed guesses.

const BASE = "https://api.printify.com/v1/catalog";

// The catalog changes rarely — cache aggressively at the fetch layer.
const CATALOG_REVALIDATE_SECONDS = 60 * 60 * 12;

async function printifyGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}` },
    next: { revalidate: CATALOG_REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Printify catalog request failed [${res.status}] ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export type CatalogBlueprint = {
  id: number;
  title: string;
  brand: string;
  model: string;
  images: string[];
};

export type CatalogPrintProvider = {
  id: number;
  title: string;
};

export type CatalogPlaceholder = {
  position: string; // e.g. "front", "back"
  height: number;
  width: number;
};

export type CatalogVariant = {
  id: number;
  title: string;
  options: Record<string, unknown>;
  placeholders?: CatalogPlaceholder[];
};

export type CatalogVariantsResponse = {
  id: number;
  title: string;
  variants: CatalogVariant[];
};

export function listBlueprints(): Promise<CatalogBlueprint[]> {
  return printifyGet<CatalogBlueprint[]>("/blueprints.json");
}

export function getBlueprint(blueprintId: number): Promise<CatalogBlueprint> {
  return printifyGet<CatalogBlueprint>(`/blueprints/${blueprintId}.json`);
}

export function listPrintProviders(blueprintId: number): Promise<CatalogPrintProvider[]> {
  return printifyGet<CatalogPrintProvider[]>(`/blueprints/${blueprintId}/print_providers.json`);
}

export function listVariants(
  blueprintId: number,
  printProviderId: number
): Promise<CatalogVariantsResponse> {
  return printifyGet<CatalogVariantsResponse>(
    `/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
  );
}
