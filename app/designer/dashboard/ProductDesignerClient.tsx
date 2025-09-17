"use client";
import dynamic from "next/dynamic";

export const runtime = "edge"; //issue with cloudflare pages

const ProductDesigner = dynamic(() => import("./productDesigner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-white/10 p-6 text-sm text-white/60">
      Loading Product Designer…
    </div>
  ),
});

export default function ProductDesignerClient() {
  return <ProductDesigner />;
}
