// app/api/sales/route.ts
import { NextResponse } from "next/server";
import { shopifyGraphQL } from "@/lib/shopify";

//export const runtime = "edge"; //issue with cloudflare pages

// If you want to restrict by logged-in user, uncomment the next two lines:
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth.options"; // server-only

type MoneyV2 = { amount: string; currencyCode: string };
type GQLLineItem = {
  name: string;
  quantity: number;
  originalUnitPriceSet?: { shopMoney: MoneyV2 } | null; // use MoneyBag
  product?: {
    title: string;
    tags: string[];
    metafield?: { value: string | null } | null;
  } | null;
};
type GQLOrder = {
  name: string;
  createdAt: string;
  currencyCode: string;
  lineItems: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { cursor: string; node: GQLLineItem }[];
  };
};
type OrdersResp = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: GQLOrder }[];
  };
};

const ORDERS_QUERY = /* GraphQL */ `
  query Orders($first: Int!, $after: String, $query: String!) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          name
          createdAt
          currencyCode
          lineItems(first: 100) {
            pageInfo { hasNextPage endCursor }
            edges {
              cursor
              node {
                name
                quantity
                # 👇 Admin GraphQL MoneyBag -> MoneyV2
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                product {
                  title
                  tags
                  metafield(namespace: "zory", key: "artist_handle") { value }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function getUnit(li: GQLLineItem): { unit: number; currency: string } | null {
  const m = li.originalUnitPriceSet?.shopMoney ?? null;
  if (!m) return null;
  return { unit: Number(m.amount), currency: m.currencyCode };
}

function matchesHandle(li: GQLLineItem, handle: string) {
  const tagHit = li.product?.tags?.some(
    t => t.toLowerCase() === `artist:${handle}`.toLowerCase()
  );
  const mf = li.product?.metafield?.value?.trim();
  return Boolean(tagHit || (mf && mf.toLowerCase() === handle.toLowerCase()));
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "").trim();
    const days = Math.min(Math.max(Number(url.searchParams.get("days") || "30"), 1), 365);
    if (!handle) return NextResponse.json({ error: "Brak parametru 'handle'." }, { status: 400 });

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const query = `created_at:>=${since} AND financial_status:paid`;

    let after: string | null = null;
    const pageSize = 50;

    // ⬇️ Explicit type + different variable name than 'data'
    let resp: OrdersResp;
    const rows: { order: string; date: string; product: string; qty: number; unit: number; currency: string }[] = [];
    let currency: string | null = null;
    let totalQty = 0;
    let totalGross = 0;

    do {
      resp = await shopifyGraphQL<OrdersResp>(ORDERS_QUERY, { first: pageSize, after, query });

      for (const edge of resp.orders.edges) {
        const order = edge.node;
        for (const { node: li } of order.lineItems.edges) {
          if (!matchesHandle(li, handle)) continue;
          const u = getUnit(li);
          if (!u) continue;

          const rowCurrency = order.currencyCode || u.currency;
          currency = currency ?? rowCurrency;

          rows.push({
            order: order.name,
            date: order.createdAt,
            product: li.product?.title || li.name,
            qty: li.quantity,
            unit: u.unit,
            currency: rowCurrency,
          });

          totalQty += li.quantity;
          totalGross += li.quantity * u.unit;
        }
      }

      after = resp.orders.pageInfo.endCursor;
      if (!resp.orders.pageInfo.hasNextPage) break;
    } while (true);

    return NextResponse.json({
      handle,
      days,
      totalQty,
      totalGross,
      currency: currency ?? "USD",
      items: rows,
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Nie udało się pobrać sprzedaży";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
