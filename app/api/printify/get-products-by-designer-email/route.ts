import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// The Prisma Accelerate extension's type inference for `findMany` drops
// relation fields from `select` results; the runtime data is correct, so we
// annotate the expected shape explicitly rather than losing type-checking
// on the whole query.
const productSelect = {
  id: true,
  title: true,
  description: true,
  creatorName: true,
  creatorEmail: true,
  visible: true,
  updatedAt: true,
  tags: { select: { tag: { select: { name: true } } } },
  images: {
    orderBy: [{ isDefault: "desc" as const }, { id: "asc" as const }],
    take: 1,
    select: { src: true, position: true },
  },
  variants: {
    where: { isAvailable: true },
    orderBy: [{ isDefault: "desc" as const }, { id: "asc" as const }],
    take: 1,
    select: { id: true, priceCents: true },
  },
} satisfies Prisma.ProductSelect;

type ProductWithRelations = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

//export const runtime = "edge"; //issue with cloudflare pages

//import { getServerSession } from "next-auth";
//import { authOptions } from "@/lib/auth.options";

export async function GET(req: NextRequest) {

  //const session = await getServerSession(authOptions);
  const session = await auth();

  const { searchParams } = new URL(req.url);
  
  const email = session?.user?.email;//(searchParams.get("email") || "").trim();
  
  if (!email) {
    return NextResponse.json({ error: "Missing ?email=" }, { status: 400 });
  }

  const products = (await db.product.findMany({
    where: {
      creatorEmail: { equals: email, mode: "insensitive" },
      isDeleted: false,
    },
    orderBy: { updatedAt: "desc" },
    select: productSelect,
  })) as ProductWithRelations[];

  const items = products.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    creatorName: p.creatorName,
    creatorEmail: p.creatorEmail,
    image: p.images[0]?.src ?? null,
    priceCents: p.variants[0]?.priceCents ?? null,
    tags: p.tags.map(t => t.tag.name),
    updatedAt: p.updatedAt,
  }));

  return NextResponse.json({ items });
 }



