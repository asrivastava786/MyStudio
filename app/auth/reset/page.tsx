"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    setMsg(null);

    if (!token) return setErr("Invalid or expired link.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Reset failed");
      setMsg("Password updated. You can now sign in.");
      // optional: redirect after a moment
      setTimeout(() => router.push("/auth/signin"), 1200);
    } catch (e: any) {
      setErr(e.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/70 bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl tracking-wide font-semibold">Aira Handbags</Link>
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-6">
          <h1 className="text-2xl font-semibold">Reset password</h1>
          <p className="text-sm text-white/60 mt-1">Enter a new password for your account.</p>

          {msg && <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-3">{msg}</div>}
          {err && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-200 text-sm p-3">{err}</div>}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {/* New password */}
            <div>
              <label htmlFor="password" className="sr-only">New password</label>
              <div className="flex">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min 8)"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-l-2xl bg-transparent border border-white/20 border-r-0 focus:outline-none focus:border-white/40 placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="px-3 py-3 rounded-r-2xl border border-white/20 hover:border-white/40 text-xs"
                  aria-pressed={showPw}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="sr-only">Confirm password</label>
              <div className="flex">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-l-2xl bg-transparent border border-white/20 border-r-0 focus:outline-none focus:border-white/40 placeholder:text-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="px-3 py-3 rounded-r-2xl border border-white/20 hover:border-white/40 text-xs"
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? "Updating…" : "Update password"}
            </button>

            <p className="text-xs text-white/50 text-center">
              <Link href="/auth/signin" className="underline underline-offset-4">Back to sign in</Link>
            </p>
          </form>
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-white/50 flex items-center justify-between">
          <p>© {new Date().getFullYear()} Aira. All rights reserved.</p>
          <p>Made in monochrome.</p>
        </div>
      </footer>
    </div>
  );
}
