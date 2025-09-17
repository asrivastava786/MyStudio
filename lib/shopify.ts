const SHOP = process.env.SHOPIFY_STORE_DOMAIN!;
const API = process.env.SHOPIFY_API_VERSION!;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

export async function shopifyGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(`https://${SHOP}/admin/api/${API}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.data as T;
}
