// "use client";
// import { useEffect, useState } from "react";

// type Row = { order: string; date: string; product: string; qty: number; unit: number; currency: string };
// type Resp = { handle: string; days: number; totalQty: number; totalGross: number; currency: string; items: Row[] };

// export default function SalesTab() {
//   const [handle, setHandle] = useState("");
//   const [days, setDays] = useState(30);
//   const [data, setData] = useState<Resp | null>(null);
//   const [loading, setLoading] = useState(false);

//   const run = async () => {
//     if (!handle) return alert("Podaj swój nick (handle).");
//     setLoading(true);
//     const res = await fetch(`/api/shopify/sales?handle=${encodeURIComponent(handle)}&days=${days}`);
//     const json = await res.json();
//     if (!res.ok) alert(json.error || "Błąd pobierania sprzedaży");
//     else setData(json);
//     setLoading(false);
//   };

//   useEffect(() => { /* optionally auto-load if you store handle in session */ }, []);

//   return (
//     <div className="space-y-4">
//       <div className="flex flex-wrap gap-2 items-end">
//         <div>
//           <label className="text-sm text-black">Nick (handle)</label>
//           <input className="border rounded px-3 py-2 block text-black" value={handle} onChange={e=>setHandle(e.target.value)} placeholder="np. janek" />
//         </div>
//         <div>
//           <label className="text-sm text-black">Date Range </label>
//           <input type="number" className="border rounded px-3 py-2 block w-28 text-black" value={days} onChange={e=>setDays(Number(e.target.value))}/>
//         </div>
//         <button onClick={run} className="bg-black text-white rounded px-4 py-2 disabled:opacity-60">
//           {loading ? "Loading ..." : "Download Sales"}
//         </button>
//         <input disabled={loading} />
//       </div>

//       {data && (
//         <div className="space-y-3">
//           <div className="flex gap-6">
//             <div className="border rounded px-4 py-3">
//               <div className="text-xs text-gray-500">Total Pieces</div>
//               <div className="text-xl font-semibold">{data.totalQty}</div>
//             </div>
//             <div className="border rounded px-4 py-3">
//               <div className="text-xs text-gray-500">Gross Revenue</div>
//               <div className="text-xl font-semibold">
//                 {data.totalGross.toFixed(2)} {data.currency}
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-sm border">
//               <thead className="bg-gray-50 text-black">
//                 <tr>
//                   <th className="p-2 text-left">Order</th>
//                   <th className="p-2 text-left">Date</th>
//                   <th className="p-2 text-left">Product</th>
//                   <th className="p-2 text-right">Quantity</th>
//                   <th className="p-2 text-right">Price</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {data.items.map((r, i) => (
//                   <tr key={i} className="border-t">
//                     <td className="p-2">{r.order}</td>
//                     <td className="p-2">{new Date(r.date).toLocaleString()}</td>
//                     <td className="p-2">{r.product}</td>
//                     <td className="p-2 text-right">{r.qty}</td>
//                     <td className="p-2 text-right">{r.unit.toFixed(2)} {r.currency}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <p className="text-xs text-gray-500">
//             Uwaga: raport filtruje po tagu produktu <code>artist:handle</code> lub metafield <code>zory.artist_handle</code>.
//             Upewnij się, że publikowane produkty mają te atrybuty.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { use, useEffect, useState } from "react";

//export const runtime = "edge"; //issue with cloudflare pages
//import { useSession } from "next-auth/react";

type Row = { order: string; date: string; product: string; qty: number; unit: number; currency: string };
type Resp = { handle: string; days: number; totalQty: number; totalGross: number; currency: string; items: Row[] };

export default function SalesTab({ Useremail }: { Useremail: string }) {
  //const { data: session, status } = useSession();
  //const email = session?.user?.email ?? "";

  //const [handle, setHandle] = useState("");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!Useremail) return alert("Jesteś wylogowany. Zaloguj się ponownie.");
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify/sales?handle=${encodeURIComponent(Useremail)}&days=${days}`, { cache: "no-store" });
      const json = (await res.json()) as Resp | { error?: string };
      if (!res.ok) throw new Error((json as any)?.error || "Błąd pobierania sprzedaży");
      setData(json as Resp);
    } catch (e: any) {
      alert(e.message || "Błąd pobierania sprzedaży");
    } finally {
      setLoading(false);
    }
  };

 // Auto-load once mounted and when days/email change
  useEffect(() => {
    if (Useremail) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, Useremail]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="text-sm text-black/70">
          Using account: <span className="font-medium">{Useremail ||  "—"}</span>
        </div>
        <div>
          <label className="text-sm text-white/70">Date range (days)</label>
          <input
            type="number"
            min={1}
            max={365}
            className="border rounded px-3 py-2 block w-28 text-black"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={loading ||  !Useremail}
          />
        </div>
        <button
          onClick={run}
          disabled={loading || !Useremail}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Loading ..." : "Download Sales"}
        </button>
      </div>

      {data && (
        <div className="space-y-3">
          <div className="flex gap-6">
            <div className="border rounded px-4 py-3">
              <div className="text-xs text-gray-400">Suma sztuk</div>
              <div className="text-xl font-semibold">{data.totalQty}</div>
            </div>
            <div className="border rounded px-4 py-3">
              <div className="text-xs text-gray-400">Przychód brutto</div>
              <div className="text-xl font-semibold">
                {data.totalGross.toFixed(2)} {data.currency}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/10">
              <thead className="bg-white/5 text-black">
                <tr>
                  <th className="p-2 text-left">Order</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Price per piece</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="p-2">{r.order}</td>
                    <td className="p-2">{new Date(r.date).toLocaleString()}</td>
                    <td className="p-2">{r.product}</td>
                    <td className="p-2 text-right">{r.qty}</td>
                    <td className="p-2 text-right">
                      {r.unit.toFixed(2)} {r.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-black/50">

            The report filters products by <code> tagu </code> <code> artist:handleor </code> metafield <code> zory.artist_handle. Values </code>​​are calculated on the server from your account.
          </p>
        </div>
      )}
    </div>
  );
}
