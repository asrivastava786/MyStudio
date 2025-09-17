import { NextRequest, NextResponse } from "next/server";
import { shopifyGraphQL } from "@/lib/shopify";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "edge"; //issue with cloudflare pages

/*
Query last N orders (paginated) and filter line items by product tag/metafield.
For production: use date range params (?from=YYYY-MM-DD&to=YYYY-MM-DD) and paginate.
*/
const QUERY = `
query Orders($first: Int!, $query: String) {
  orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
    edges {
      node {
        id
        name
        createdAt
        lineItems(first: 50) {
          edges {
            node {
              quantity
              originalUnitPriceSet { shopMoney { amount currencyCode } }
              product {
                id
                title
                tags
                metafield(namespace:"zory", key:"artist_handle"){ value }
              }
            }
          }
        }
      }
    }
  }
}
`;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle"); // designer handle
  const days = Number(url.searchParams.get("days") || 30);
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });

  const fromDate = new Date(Date.now() - days * 864e5).toISOString();
  // Shopify order query string: status:open/closed/any + created_at
  const q = `created_at:>=${fromDate}`;

  type ShopifyResp = {
    orders: {
      edges: Array<{
        node: {
          id: string; name: string; createdAt: string;
          lineItems: { edges: Array<{
            node: {
              quantity: number;
              originalUnitPriceSet: { shopMoney: { amount: string; currencyCode: string } };
              product: { id: string; title: string; tags: string[]; metafield: { value: string } | null };
            }
          }> }
        }
      }>
    }
  };

  const data = await shopifyGraphQL<ShopifyResp>(QUERY, { first: 50, query: q });

  // Filter by tag artist:handle or metafield match
  const rows: Array<{
    order: string;
    date: string;
    product: string;
    qty: number;
    unit: number;
    currency: string;
  }> = [];

  let totalQty = 0;
  let totalGross = 0;

  for (const e of data.orders.edges) {
    const order = e.node;
    for (const le of order.lineItems.edges) {
      const li = le.node;
      const prod = li.product;
      if (!prod) continue;

      const byTag = (prod.tags || []).some(t => t.toLowerCase() === `artist:${handle}`.toLowerCase());
      const byMeta = prod.metafield?.value?.toLowerCase() === handle.toLowerCase();

      if (byTag || byMeta) {
        const unit = Number(li.originalUnitPriceSet.shopMoney.amount);
        const qty = li.quantity;
        rows.push({
          order: order.name,
          date: order.createdAt,
          product: prod.title,
          qty,
          unit,
          currency: li.originalUnitPriceSet.shopMoney.currencyCode
        });
        totalQty += qty;
        totalGross += unit * qty;
      }
    }
  }

  return NextResponse.json({
    handle,
    days,
    totalQty,
    totalGross,
    currency: rows[0]?.currency || "PLN",
    items: rows
  });
}
