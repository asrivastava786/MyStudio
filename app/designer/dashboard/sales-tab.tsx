"use client";

import { useEffect, useState } from "react";

type Row = { order: string; date: string; product: string; qty: number; unit: number; currency: string };
type Resp = { handle: string; days: number; totalQty: number; totalGross: number; currency: string; items: Row[] };

export default function SalesTab({ Useremail }: { Useremail: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!Useremail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/sales?handle=${encodeURIComponent(Useremail)}&days=${days}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setData(json as Resp);
    } catch (e: any) {
      setError(e.message || "Failed to load sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Useremail) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, Useremail]);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-[11px] tracking-widest uppercase text-white/30 mb-1">Account</p>
          <p className="text-sm text-white/70 font-medium">{Useremail || "—"}</p>
        </div>

        <div className="ml-auto flex items-end gap-3">
          <div>
            <label className="text-[11px] tracking-widest uppercase text-white/30 block mb-1.5">
              Date range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                disabled={loading}
                value={days}
                onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value))))}
                className="w-20 bg-white/[0.05] border border-white/12 rounded-lg px-3 py-2 text-sm text-white text-center focus:outline-none focus:border-white/30 disabled:opacity-50"
              />
              <span className="text-xs text-white/30">days</span>
            </div>
          </div>

          <button
            onClick={run}
            disabled={loading || !Useremail}
            className="px-5 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner /> Fetching…
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data && data.items.length === 0 && (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] py-12 text-center">
          <p className="text-white/30 text-sm">No sales in the last {days} days.</p>
        </div>
      )}

      {/* KPI cards */}
      {data && data.items.length > 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Units sold"    value={String(data.totalQty)} />
            <StatCard label="Gross revenue" value={`${data.totalGross.toFixed(2)} ${data.currency}`} />
            <StatCard label="Avg. order"
              value={
                data.items.length
                  ? `${(data.totalGross / data.items.length).toFixed(2)} ${data.currency}`
                  : "—"
              }
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Order", "Date", "Product", "Qty", "Unit price"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] tracking-widest uppercase text-white/30 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{r.order}</td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap text-xs">
                      {new Date(r.date).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-white/80 max-w-[220px] truncate">{r.product}</td>
                    <td className="px-4 py-3 text-center text-white/70">{r.qty}</td>
                    <td className="px-4 py-3 text-right font-medium text-white/80 whitespace-nowrap">
                      {r.unit.toFixed(2)} {r.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-white/20">
            Filtered by product tag <code className="text-white/30">artist:{Useremail}</code> or
            metafield <code className="text-white/30">zory.artist_handle</code>.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] tracking-widest uppercase text-white/30 mb-1">{label}</p>
      <p className="text-xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black/70 animate-spin" />
  );
}
