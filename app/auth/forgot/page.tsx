"use client";
import { useState } from "react";
import Link from "next/link";

export const runtime = "edge"; //issue with cloudflare pages
export default function ForgotPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);


    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setMsg(null);
        setLoading(true);
        try {
            await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setMsg("If the address exists, we've sent a reset link. Check your inbox (and spam).");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-black text-white flex flex-col">

            <main className="flex-1 grid place-items-center px-6 py-16">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-6">
                    <h1 className="text-2xl font-semibold">Forgot password</h1>
                    <p className="text-sm text-white/60 mt-1">Enter your email and we'll send you a reset link.</p>


                    {msg && (
                        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-3">{msg}</div>
                    )}


                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                autoComplete="email"
                                className="w-full px-4 py-3 rounded-2xl bg-transparent border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/40"
                            />
                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-60"
                            aria-busy={loading}
                        >
                            {loading ? "Sending…" : "Send reset link"}
                        </button>


                        <p className="text-xs text-white/50 text-center">
                            <Link href="/auth/signin" className="underline underline-offset-4">Back to sign in</Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}