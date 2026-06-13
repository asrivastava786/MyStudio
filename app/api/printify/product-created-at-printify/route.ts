// app/api/printify/product-created-at-printify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/* ---------- Helpers ---------- */

type OptionTypeEnum = "size" | "color" | "custom";
type PositionEnum   = "front" | "back";

const toOptionType = (s?: string): OptionTypeEnum => {
  switch ((s || "").toLowerCase()) {
    case "size":  return "size";
    case "color": return "color";
    default:      return "custom";
  }
};
const toPosition = (s?: string | null): PositionEnum | undefined => {
  switch ((s || "").toLowerCase()) {
    case "front": return "front";
    case "back":  return "back";
    default:      return undefined;
  }
};
const asNum = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const ensureArray = <T = any>(v: any): T[] => (Array.isArray(v) ? v : []);

/* ---------- Route ---------- */

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(payload) ? payload : [payload];

  // Fast validation
  for (const p of items) {
    if (!p?.id) {
      return NextResponse.json({ error: "Each product must include an 'id'." }, { status: 400 });
    }
  }

  try {
    const results = await Promise.all(
      items.map(async (p) => ({ productId: await ingestProduct(p) }))
    );
    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    // Surface useful Prisma error codes (P2002 etc.)
    const msg =
      e?.code && e?.message
        ? `${e.code}: ${e.message}`
        : e?.message || "Ingest failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/* ---------- Ingest one product ---------- */

async function ingestProduct(p: any): Promise<string> {
  const productId = String(p.id);

  // Upsert Product
  const product = await db.product.upsert({
    where: { id: productId },
    create: {
      id: productId,
      title: p.title ?? "",
      description: p.description ?? "",
      visible: !!p.visible,
      isLocked: !!p.is_locked,

      blueprintId: asNum(p.blueprint_id),
      printProviderId: asNum(p.print_provider_id),
      printifyUserId: asNum(p.user_id),
      printifyShopId: asNum(p.shop_id),

      createdAt: p.created_at ? new Date(p.created_at) : new Date(),
      updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),

      isDeleted: !!p.is_deleted,
      originalProductId: p.original_product_id || null,

      isPrintifyExpressEligible: !!p.is_printify_express_eligible,
      isPrintifyExpressEnabled: !!p.is_printify_express_enabled,
      isEconomyShippingEligible: !!p.is_economy_shipping_eligible,
      isEconomyShippingEnabled: !!p.is_economy_shipping_enabled,

      creatorName: p.creatorName || null,
      creatorEmail: p.creatorEmail || null,

      // Postgres JSONB recommended in schema; raw JSON works fine here
      printDetails: p.print_details ?? [],
      salesChannelProperties: p.sales_channel_properties ?? [],
    },
    update: {
      title: p.title ?? "",
      description: p.description ?? "",
      visible: !!p.visible,
      isLocked: !!p.is_locked,

      blueprintId: asNum(p.blueprint_id),
      printProviderId: asNum(p.print_provider_id),
      printifyUserId: asNum(p.user_id),
      printifyShopId: asNum(p.shop_id),

      updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),

      isDeleted: !!p.is_deleted,
      originalProductId: p.original_product_id || null,

      isPrintifyExpressEligible: !!p.is_printify_express_eligible,
      isPrintifyExpressEnabled: !!p.is_printify_express_enabled,
      isEconomyShippingEligible: !!p.is_economy_shipping_eligible,
      isEconomyShippingEnabled: !!p.is_economy_shipping_enabled,

      creatorName: p.creatorName || null,
      creatorEmail: p.creatorEmail || null,

      printDetails: p.print_details ?? [],
      salesChannelProperties: p.sales_channel_properties ?? [],
    },
    select: { id: true },
  });

  // Replace children in one transaction
  await db.$transaction(async (tx) => {
    /* ----- TAGS ----- */
    const tags: string[] = ensureArray<string>(p.tags);
    await tx.productTag.deleteMany({ where: { productId: product.id } });
    if (tags.length) {
      const tagRows = await Promise.all(
        tags.map((name) => tx.tag.upsert({ where: { name }, create: { name }, update: {} }))
      );
      await tx.productTag.createMany({
        data: tagRows.map((t) => ({ productId: product.id, tagId: t.id })),
        skipDuplicates: true,
      });
    }

    /* ----- OPTIONS & VALUES ----- */
    await tx.productOption.deleteMany({ where: { productId: product.id } });

    const optionIdByName = new Map<string, number>();
    const optionValueIdByKey = new Map<string, number>(); // key: `${optionId}|${value}`

    const options = ensureArray<any>(p.options);
    for (const [i, opt] of options.entries()) {
      const createdOpt = await tx.productOption.create({
        data: {
          productId: product.id,
          name: String(opt?.name ?? `Option ${i + 1}`),
          type: toOptionType(opt?.type),
          displayInPreview: !!opt?.display_in_preview,
        },
      });
      optionIdByName.set(createdOpt.name, createdOpt.id);

      const values = ensureArray<any>(opt?.values);
      let order = 0;
      for (const raw of values) {
        order += 1;
        const value = String(raw);
        const v = await tx.optionValue.create({
          data: { optionId: createdOpt.id, value, sortOrder: order },
        });
        optionValueIdByKey.set(`${createdOpt.id}|${v.value}`, v.id);
      }
    }

    /* ----- VARIANTS (internal PK + externalId mapping) ----- */
    await tx.variant.deleteMany({ where: { productId: product.id } });

    // Map: external (Printify) variant id -> internal variant id
    const extToInt = new Map<number, number>();
    const variants = ensureArray<any>(p.variants);

    for (const v of variants) {
      const externalId = asNum(v?.id);
      const created = await tx.variant.create({
        data: {
          productId: product.id,
          externalId,                          // Printify variant id
          sku: String(v?.sku ?? ""),
          costCents: asNum(v?.cost),
          priceCents: asNum(v?.price),
          title: String(v?.title ?? ""),
          grams: asNum(v?.grams),
          isEnabled: !!v?.is_enabled,
          isDefault: !!v?.is_default,
          isAvailable: !!v?.is_available,
          isPrintifyExpressEligible: !!v?.is_printify_express_eligible,
          quantity: asNum(v?.quantity),
        },
        select: { id: true },
      });
      extToInt.set(externalId, created.id);

      // link chosen option values to this variant
      const vOpts = ensureArray<any>(v?.options);
      for (const vo of vOpts) {
        const optName = String(vo?.name ?? "").trim();
        const val = String(vo?.value ?? "").trim();
        if (!optName || !val) continue;

        const optId = optionIdByName.get(optName);
        if (!optId) continue;

        const optionValueId = optionValueIdByKey.get(`${optId}|${val}`);
        if (!optionValueId) continue;

        await tx.variantOptionValue.upsert({
          where: { variantId_optionValueId: { variantId: created.id, optionValueId } },
          create: { variantId: created.id, optionValueId },
          update: {},
        });
      }
    }

    /* ----- IMAGES ----- */
    await tx.image.deleteMany({ where: { productId: product.id } });
    const images = ensureArray<any>(p.images);

    for (const img of images) {
      const image = await tx.image.create({
        data: {
          productId: product.id,
          src: String(img?.src ?? ""),
          position: toPosition(img?.position),
          isDefault: !!img?.is_default,
          isSelectedForPublishing: !!img?.is_selected_for_publishing,
          order: img?.order == null ? undefined : asNum(img?.order),
        },
        select: { id: true },
      });

      const variantExtIds = ensureArray<any>(img?.variant_ids).map((x) => asNum(x));
      const variantIds = variantExtIds
        .map((ext) => extToInt.get(ext))
        .filter((x): x is number => typeof x === "number");

      if (variantIds.length) {
        await tx.imageVariant.createMany({
          data: variantIds.map((vid) => ({ imageId: image.id, variantId: vid })),
          skipDuplicates: true,
        });
      }
    }

    /* ----- PRINT AREAS ----- */
    await tx.printArea.deleteMany({ where: { productId: product.id } });
    const printAreas = ensureArray<any>(p.print_areas);

    for (const pa of printAreas) {
      const area = await tx.printArea.create({
        data: {
          productId: product.id,
          background: pa?.background ? String(pa.background) : null,
          placeholders: pa?.placeholders ?? null,
        },
        select: { id: true },
      });

      const variantExtIds = ensureArray<any>(pa?.variant_ids).map((x) => asNum(x));
      const variantIds = variantExtIds
        .map((ext) => extToInt.get(ext))
        .filter((x): x is number => typeof x === "number");

      if (variantIds.length) {
        await tx.printAreaVariant.createMany({
          data: variantIds.map((vid) => ({ printAreaId: area.id, variantId: vid })),
          skipDuplicates: true,
        });
      }
    }

    /* ----- VIEWS (+ files) ----- */
    // Your schema uses View.id as PK (no externalId). We must avoid global id collisions.
await tx.view.deleteMany({ where: { productId } });
const views: any[] = Array.isArray(p.views) ? p.views : [];

for (const v of views) {
  const viewPk = Number(v?.id) || 0;                 // you still use external id as PK
  const externalViewId = viewPk;                // Printify view id

  const view = await tx.view.upsert({
    where: {  productId_externalId: { productId, externalId: externalViewId }},
    update: {

     // externalId: externalViewId,
      label: String(v?.label ?? ""),
      position: toPosition(v?.position),
      //product: { connect: { id: productId } },
    },
    create: {
      //id: viewPk,
      productId,
      externalId: externalViewId,
      label: String(v?.label ?? ""),
      position: toPosition(v?.position),
    },
    select: { id: true },
  });

  // replace files for this view
  await tx.viewFile.deleteMany({ where: { viewId: view.id } });
  const files: any[] = Array.isArray(v?.files) ? v.files : [];
  if (files.length) {
    await tx.viewFile.createMany({
      data: files.map((f) => ({
        viewId: view.id,
        url: String(f?.url ?? f?.src ?? ""),
        role: f?.camera_label ?? f?.role ?? null,
        data: f ?? null,
      })),
      skipDuplicates: true,
    });
  }
}
  });

  return product.id;
}
