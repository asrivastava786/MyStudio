"use client";

import { useEffect, useState } from "react";
import { useDesignerStore } from "@/lib/designerStore";
import Pdesigner from "./productDesigner";

type CreateResult = { ok: boolean; product?: any; error?: string };


const presetVariants = (process.env.NEXT_PUBLIC_PRINTIFY_DEFAULT_VARIANTS || "")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter(Boolean);

export default function CreateProductTab() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("Bawełniana torba ZORY. Małe logo. Edycja artystyczna.");
  //const [artworkUrl, setArtworkUrl] = useState("");
  const [price, setPrice] = useState<string>("");

  const [variants, setVariants] = useState<number[]>(presetVariants.length ? presetVariants : []);
  //const [pos, setPos] = useState({ x: 0.25, y: 0.22, width: 0.5, height: 0.56 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("0");
    setVariants([]);
    //setSharedId(null);          // or keep if you don’t want to clear the uploaded design
    //setSharedBox(null);         // or set to EMPTY_BOX if you prefer zeros
    // leave success message visible; don’t clear `msg` here
  };


  // read from shared store (set by ProductDesigner)
  const sharedId = useDesignerStore((s) => s.printifyImageId);
  const sharedBox = useDesignerStore((s) => s.box);

  // Optionally fetch available variants dynamically from your API proxy later.
  useEffect(() => {
    if (!variants.length && presetVariants.length) setVariants(presetVariants);
  }, []);

  const toggleVariant = (id: number) => {
    setVariants((vs) => (vs.includes(id) ? vs.filter((v) => v !== id) : [...vs, id]));
  };

  const submit = async () => {
    setMsg("");
    if (!title.trim()) return setMsg("Dodaj tytuł.");
    if (!sharedId) return setMsg("Najpierw wgraj projekt w zakładce Designer.");
    if (!sharedBox) return setMsg("Ustaw pozycję/rozmiar projektu w Designerze.");
    if (!variants.length) return setMsg("Wybierz przynajmniej jeden wariant.");

    setLoading(true);
    try {
      const res = await fetch("/api/printify/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          imageId: sharedId,           //from Designer upload
          variantIds: variants,
          priceCents: Math.round(Number(price) * 100),
          position: {
            x: sharedBox.x,
            y: sharedBox.y,
            width: sharedBox.width,
            height: sharedBox.height,
          },
          angle: sharedBox.angle ?? 0,
        }),
      });

      const txt = await res.text();
      let json: CreateResult | any = {};
      try { json = JSON.parse(txt); } catch { }

      if (!res.ok || !(json as any).ok) {
        setMsg(json?.error || `Błąd tworzenia produktu (HTTP ${res.status})`);
        console.log("details:", json?.details || txt);
      } else {
        resetForm(); // rest form on success
        setMsg(`Product created (ID: ${json.product?.id}). Submitted to be Published.`);
      }
    } catch {
      setMsg("Błąd sieci.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-black">Design your Product @ZORY</h2>
      <p className="text-sm text-black">
        Will use the image and position from the <strong>Designer</strong>.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        <input className="border rounded px-3 py-2 text-black" placeholder="Title (np. ZORY — Urban Vibe)"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* removed manual URL field */}

        <input className="border rounded px-3 py-2 sm:col-span-2 text-black"
          placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="sm:col-span-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-black">Image from Designer:</span>
            {sharedId ? (
              <span className="px-2 py-1 rounded bg-emerald-50  text-black">Ready to launch ✅</span>
            ) : (
              <span className="px-2 py-1 rounded bg-amber-200  text-black">To Proceed Upload your design using Upload Button</span>
            )}
          </div>
          {sharedBox && (
            <code className="mt-1 block text-xs bg-gray-50 rounded px-2 py-1 text-black">
              {JSON.stringify(sharedBox)}
            </code>
          )}
        </div>

        <div>
          <label className="text-sm text-black">Price (USD)</label>
          <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-black"
            value={price} onChange={(e) => {
              const val = e.target.value;
              setPrice((val));
            }} />
        </div>

        {/* Variants */}
        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Select Variant (ID)</label>
          <div className="flex flex-wrap gap-2 text-black">
            {(presetVariants.length ? presetVariants : [76241]).map((id) => (
              <button type="button" key={id}
                onClick={() => toggleVariant(id)}
                className={`px-3 py-1 rounded border ${variants.includes(id) ? "bg-black text-white" : ""}`}>
                {id}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select the variants.
          </p>
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.startsWith("Utworzono") ? "text-emerald-700" : "text-red-600"}`}>{msg}</p>}

      <button onClick={submit} disabled={loading}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
        {loading ? "Tworzenie…" : "Publish Product"}
      </button>
    </div>



  );

}
