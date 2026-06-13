"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setErr("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // 400 = invalid email format (caught above, but handle server-side too)
        setErr(json?.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-6">
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="text-sm text-white/60 mt-1">
            Enter your email and we'll send you a reset link.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-4 leading-relaxed">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                Check your inbox and spam folder — the link expires in 1 hour.
              </div>
              <Link
                href="/auth/signin"
                className="block text-center px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40 text-sm transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              {err && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 text-red-200 text-sm p-3">
                  {err}
                </div>
              )}

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (err) setErr(null);
                  }}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full px-4 py-3 rounded-2xl bg-transparent border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/40 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                aria-busy={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Sending…
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>

              <p className="text-xs text-white/50 text-center">
                <Link href="/auth/signin" className="underline underline-offset-4 hover:text-white/70">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black/60 animate-spin" />
  );
}
