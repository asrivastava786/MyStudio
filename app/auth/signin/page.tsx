
// "use client";

// import React, { useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
// import { signIn } from "next-auth/react";

// export default function SignInPage() {
//   const router = useRouter();
//   const sp = useSearchParams();

//   // ✅ Safe callback: only allow same-site relative paths
//   const rawCb = sp.get("callbackUrl");
//   const callbackUrl = rawCb && rawCb.startsWith("/") ? rawCb : "/designer/dashboard";

//   const justRegistered = sp.get("registered") === "1";
//   const prefillEmail = sp.get("email") ?? "";
//   const errorParam = sp.get("error");

//   // UI state
//   const [method, setMethod] = useState<"password" | "email">("password");
//   const [identifier, setIdentifier] = useState(prefillEmail);
//   const [password, setPassword] = useState("");
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState<null | "google" | "magic" | "cred">(null);
//   const [err, setErr] = useState<string | null>(null);
//   const [info, setInfo] = useState<string | null>(null);
//   const [success, setSuccess] = useState<boolean>(false);

//   // Registration success toast
//   useEffect(() => {
//     if (!justRegistered) return;
//     setSuccess(true);
//     const t = setTimeout(() => setSuccess(false), 6000);
//     return () => clearTimeout(t);
//   }, [justRegistered]);

//   // Friendly error mapping from NextAuth ?error=
//   useEffect(() => {
//     if (!errorParam) return;
//     const map: Record<string, string> = {
//       Callback: "Błąd linku logowania. Link mógł wygasnąć lub został już użyty.",
//       CredentialsSignin: "Nieprawidłowy email/nick lub hasło.",
//       OAuthAccountNotLinked: "Email jest już połączony z inną metodą logowania.",
//       AccessDenied: "Brak dostępu.",
//     };
//     setErr(map[errorParam] ?? "Nie udało się zalogować.");
//   }, [errorParam]);

//   const resetMsgs = () => {
//     setErr(null);
//     setInfo(null);
//   };

//   const onGoogle = async () => {
//     if (loading) return;
//     resetMsgs();
//     setLoading("google");
//     // OAuth will redirect away
//     await signIn("google", { callbackUrl });
//   };

//   const onMagic = async () => {
//     if (loading) return;
//     resetMsgs();
//     if (!identifier || !/^\S+@\S+\.\S+$/.test(identifier)) {
//       setErr("Podaj poprawny adres e-mail, aby wysłać magiczny link.");
//       return;
//     }
//     setLoading("magic");
//     const res = await signIn("email", { email: identifier, redirect: false, callbackUrl });
//     setLoading(null);
//     // ✅ Anti-enumeration: same message whether email exists or not
//     setInfo("Jeśli adres istnieje, wyślemy link do logowania. Sprawdź skrzynkę (i spam).");
//     if (res?.error) console.warn("email signIn error", res.error);
//   };

//   const onCreds = async () => {
//     if (loading) return;
//     resetMsgs();
//     if (!identifier || !password) {
//       setErr("Wpisz email/nick oraz hasło.");
//       return;
//     }
//     setLoading("cred");
//     const res = await signIn("credentials", {
//       redirect: false,
//       identifier,
//       password,
//       callbackUrl,
//     });
//     setLoading(null);
//     if (res?.ok && !res.error) router.push(callbackUrl);
//     else setErr("Nieprawidłowe dane logowania.");
//   };

//   return (
//     <div className="min-h-screen bg-black text-white flex flex-col">
//       {/* Top bar */}
      

//       {/* Body */}
//       <main className="flex-1 grid place-items-center px-6 py-16">
//         <div
//           className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-6"
//           role="region"
//           aria-labelledby="signin-heading"
//         >
//           <h1 id="signin-heading" className="text-2xl font-semibold">Login Area</h1>
//           <p className="text-sm text-white/60 mt-1">Monochrome · Minimal · Bold</p>

//           {/* Success after registration */}
//           {success && (
//             <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-3">
//               Konto utworzone pomyślnie. Zaloguj się, aby kontynuować.
//             </div>
//           )}

//           {/* Google */}
//           <button
//             onClick={onGoogle}
//             disabled={!!loading}
//             className="mt-6 w-full px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40 disabled:opacity-60"
//             aria-busy={loading === "google"}
//           >
//             {loading === "google" ? "Łączenie z Google…" : "Zaloguj przez Google"}
//           </button>

//           {/* Divider */}
//           <div className="mt-6 flex items-center gap-3 text-xs text-white/40">
//             <div className="flex-1 h-px bg-white/10" />
//             <span>lub</span>
//             <div className="flex-1 h-px bg-white/10" />
//           </div>

//           {/* Method toggle */}
//           <div className="mt-6 grid grid-cols-2 gap-2 text-sm" role="tablist" aria-label="Metoda logowania">
//             <button
//               type="button"
//               onClick={() => setMethod("password")}
//               aria-selected={method === "password"}
//               className={`px-3 py-2 rounded-2xl border ${method === "password" ? "border-white/60" : "border-white/20 hover:border-white/40"}`}
//             >
//               Password
//             </button>
//             <button
//               type="button"
//               onClick={() => setMethod("email")}
//               aria-selected={method === "email"}
//               className={`px-3 py-2 rounded-2xl border ${method === "email" ? "border-white/60" : "border-white/20 hover:border-white/40"}`}
//             >
//               Magic link (Email)
//             </button>
//           </div>

//           {/* Notices */}
//           {info && (
//             <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-3">
//               {info}
//             </div>
//           )}
//           {err && (
//             <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-200 text-sm p-3">
//               {err}
//             </div>
//           )}

//           {/* Identifier (shared) */}
//           <div className="mt-6">
//             <label htmlFor="identifier" className="sr-only">Email</label>
//             <input
//               id="identifier"
//               type={method === "email" ? "email" : "text"}
//               value={identifier}
//               onChange={(e) => setIdentifier(e.target.value)}
//               placeholder={method === "email" ? "you@example.com" : "Email"}
//               autoComplete="username"
//               inputMode={method === "email" ? "email" : undefined}
//               className="w-full px-4 py-3 rounded-2xl bg-transparent border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/40"
//             />
//           </div>

//           {/* Password (only for credentials) */}
//           {method === "password" && (
//             <div className="mt-3">
//               <label htmlFor="password" className="sr-only">Hasło</label>
//               <div className="flex">
//                 <input
//                   id="password"
//                   type={showPw ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="••••••••"
//                   autoComplete="current-password"
//                   className="w-full px-4 py-3 rounded-l-2xl bg-transparent border border-white/20 border-r-0 focus:outline-none focus:border-white/40 placeholder:text-white/40"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPw((s) => !s)}
//                   className="px-3 py-3 rounded-r-2xl border border-white/20 hover:border-white/40 text-xs"
//                   aria-pressed={showPw}
//                   aria-label={showPw ? "Ukryj hasło" : "Pokaż hasło"}
//                 >
//                   {showPw ? "Hide" : "Show"}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Submit */}
//           <div className="mt-5">
//             {method === "password" ? (
//               <button
//                 onClick={onCreds}
//                 disabled={!!loading}
//                 className="w-full px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-60"
//                 aria-busy={loading === "cred"}
//               >
//                 {loading === "cred" ? "Logowanie…" : "Zaloguj (hasło)"}
//               </button>
//             ) : (
//               <button
//                 onClick={onMagic}
//                 disabled={!!loading}
//                 className="w-full px-5 py-3 rounded-2xl border border-white/20 hover:border-white/40 disabled:opacity-60"
//                 aria-busy={loading === "magic"}
//               >
//                 {loading === "magic" ? "Wysyłanie linku…" : "Send Magic Link"}
//               </button>
//             )}
//           </div>

//           {/* Helper links */}
//           <div className="mt-6 flex items-center justify-between text-sm text-white/70">
//             <Link className="underline underline-offset-4" href="/auth/forgot">
//               Forgot your password?
//             </Link>
//             <Link className="underline underline-offset-4" href="/auth/register">
//               Create an account
//             </Link>
//           </div>

//           <p className="mt-4 text-xs text-white/50">
//             By logging in, you accept the terms and conditions and privacy policy.
//           </p>
//         </div>
//       </main>

//       {/* Footer */}

//     </div>
//   );
// }



// import { redirect } from "next/navigation";
// // import Link from "next/link";
// // import AuthAction from "@/components/ui/AuthAction";
// import { getSessionServer } from "@/lib/auth";
// import SignInClient from "./SignInClient";

// export default async function Page({ searchParams }: { searchParams?: { callbackUrl?: string } }) {
//   const session = await getSessionServer();
//   if (session?.user) {
//     const cb = searchParams?.callbackUrl;
//     const safeCb = cb && cb.startsWith("/") ? cb : "/designer/dashboard";
//     redirect(safeCb);
//   }

//   return (
//     <div className="min-h-screen bg-black text-white flex flex-col">
//       {/* Header with AuthAction (Sign in hidden if logged) */}

//       {/* Body (client) */}
//       <SignInClient />
//     </div>
//   );
// }


// app/auth/signin/page.tsx
import { redirect } from "next/navigation";
// import { getSessionServer } from "@/lib/auth";
import SignInClient from "./SignInClient";
import { auth } from "@/lib/auth";

//export const runtime = "edge"; //issue with cloudflare pages

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  //const session = await getSessionServer();
  const session = await auth();

  if (session?.user) {
    const cb = callbackUrl;
    const safeCb = cb && cb.startsWith("/") ? cb : "/designer/dashboard";
    redirect(safeCb);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SignInClient />
    </div>
  );
}
