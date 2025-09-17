// // app/auth/register/page.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { RegisterSchema, type RegisterInput } from "@/lib/validation";
// import { z } from "zod";

// type Errors = Partial<Record<keyof RegisterInput, string>>;

// export default function Register() {
//   const router = useRouter();
//   const [form, setForm] = useState<RegisterInput>({
//     email: "",
//     handle: "",
//     name: "",
//     country: "",
//     password: "",
//   });

//   const [errors, setErrors] = useState<Errors>({});
//   const [loading, setLoading] = useState(false);
//   const [serverErr, setServerErr] = useState("");
//   const [success, setSuccess] = useState(false);

//   const setField =
//     (key: keyof RegisterInput) =>
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       setForm((f) => ({ ...f, [key]: e.target.value }));
//       setErrors((prev) => ({ ...prev, [key]: undefined })); // clear field error on change
//     };

//   const validateField = (key: keyof RegisterInput) => {
//     const single = RegisterSchema.pick({ [key]: true } as any);
//     const res = single.safeParse({ [key]: form[key] });
//     setErrors((prev) => ({ ...prev, [key]: res.success ? undefined : res.error.issues[0]?.message }));
//   };

//   const validateAll = (): boolean => {
//     const res = RegisterSchema.safeParse(form);
//     if (res.success) {
//       setErrors({});
//       return true;
//     }
//     const fieldErrors: Errors = {};
//     for (const issue of res.error.issues) {
//       const path = issue.path[0] as keyof RegisterInput;
//       if (!fieldErrors[path]) fieldErrors[path] = issue.message;
//     }
//     setErrors(fieldErrors);
//     return false;
//   };

//   const submit = async () => {
//     setServerErr("");
//     if (!validateAll()) return;

//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       });
//       const json = await res.json();
//       if (!res.ok) {
//         setServerErr(json.error || "Błąd rejestracji");
//       } else {
//         setSuccess(true);
//       }
//     } catch {
//       setServerErr("Wystąpił błąd sieci. Spróbuj ponownie.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen flex items-center justify-center p-6">
//       <div className="w-full max-w-md border rounded-2xl p-6 space-y-4">
//         <h1 className="text-2xl font-semibold">Rejestracja Projektanta</h1>

//         {success ? (
//           <div className="space-y-4">
//             <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
//               Konto zostało utworzone pomyślnie. Możesz teraz się zalogować.
//             </div>
//             <button
//               onClick={() =>
//                 router.push(`api/auth/signin?registered=1&email=${encodeURIComponent(form.email)}`)
//               }
//               className="w-full bg-black text-white rounded px-3 py-2"
//             >
//               Przejdź do logowania
//             </button>
//           </div>
//         ) : (
//           <>
//             {/* Email */}
//             <div>
//               <input
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Email"
//                 value={form.email}
//                 onChange={setField("email")}
//                 onBlur={() => validateField("email")}
//                 autoComplete="email"
//               />
//               {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
//             </div>

//             {/* Handle */}
//             <div>
//               <input
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Nick (handle) — np. janek.design"
//                 value={form.handle}
//                 onChange={setField("handle")}
//                 onBlur={() => validateField("handle")}
//                 autoComplete="username"
//               />
//               {errors.handle && <p className="text-sm text-red-600 mt-1">{errors.handle}</p>}
//             </div>

//             {/* Name (optional) */}
//             <div>
//               <input
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Imię i nazwisko (opcjonalnie)"
//                 value={form.name ?? ""}
//                 onChange={setField("name")}
//                 onBlur={() => validateField("name")}
//               />
//               {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
//             </div>

//             {/* Country */}
//             <div>
//               <input
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Kraj — np. Polska"
//                 value={form.country}
//                 onChange={setField("country")}
//                 onBlur={() => validateField("country")}
//               />
//               {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country}</p>}
//             </div>

//             {/* Password */}
//             <div>
//               <input
//                 type="password"
//                 className="w-full border rounded px-3 py-2"
//                 placeholder="Hasło (min 8, litera + cyfra)"
//                 value={form.password}
//                 onChange={setField("password")}
//                 onBlur={() => validateField("password")}
//                 autoComplete="new-password"
//               />
//               {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
//             </div>

//             {/* Server error */}
//             {serverErr && <p className="text-sm text-red-600">{serverErr}</p>}

//             <button
//               onClick={submit}
//               disabled={loading}
//               className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-60"
//             >
//               {loading ? "Tworzenie konta…" : "Utwórz konto"}
//             </button>

//             <p className="text-sm text-gray-600 text-center">
//               Masz już konto?{" "}
//               <a className="underline underline-offset-2" href="api/auth/signin">
//                 Zaloguj się
//               </a>
//             </p>
//           </>
//         )}
//       </div>
//     </main>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { RegisterSchema, type RegisterInput } from "@/lib/validation";

// Fallback schema in case RegisterSchema is missing at dev time
const FallbackRegisterSchema = z.object({
  email: z.string().email("Podaj poprawny email"),
  handle: z.string().min(3, "Nick za krótki").max(24, "Nick za długi"),
  name: z.string().optional().or(z.literal("")),
  country: z.string().min(2, "Podaj kraj"),
  password: z
    .string()
    .min(8, "Min. 8 znaków")
    .regex(/[A-Za-z]/, "Wymagana litera")
    .regex(/\d/, "Wymagana cyfra"),
});

const Schema: z.ZodType<RegisterInput> = (RegisterSchema as any) ?? (FallbackRegisterSchema as any);

type Errors = Partial<Record<keyof RegisterInput, string>>;

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterInput>({
    email: "",
    handle: "",
    name: "",
    country: "",
    password: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);

  const setField = (key: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateField = (key: keyof RegisterInput) => {
    try {
      const single = (Schema as any).pick({ [key]: true });
      const res = single.safeParse({ [key]: form[key] });
      setErrors((prev) => ({ ...prev, [key]: res.success ? undefined : res.error.issues[0]?.message }));
    } catch {
      // ignore
    }
  };

  const validateAll = (): boolean => {
    const trimmed: RegisterInput = {
      email: form.email.trim(),
      handle: form.handle.trim(),
      name: (form.name || "").trim(),
      country: form.country.trim(),
      password: form.password,
    };
    const res = (Schema as any).safeParse(trimmed);
    if (res.success) {
      setErrors({});
      setForm(trimmed);
      return true;
    }
    const fieldErrors: Errors = {};
    for (const issue of res.error.issues) {
      const path = issue.path[0] as keyof RegisterInput;
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    setErrors(fieldErrors);
    return false;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerErr(null);
    setServerMsg(null);
    if (!validateAll()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const json: any = isJson ? await res.json() : null;

      if (!res.ok) {
        // ✅ Production-safe: generic error to avoid enumeration
        if (res.status === 429) setServerErr("Zbyt wiele prób. Spróbuj ponownie później.");
        else setServerErr(json?.error || "Nie udało się utworzyć konta. Spróbuj ponownie.");
        return;
      }

      // Success
      setServerMsg("Konto zostało utworzone. Zaloguj się, aby kontynuować.");
    } catch (err) {
      setServerErr("Wystąpił błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignin = () => {
    router.push(`/signin?registered=1&email=${encodeURIComponent(form.email)}`);
  };

  const Input = useMemo(
    () =>
      function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
        const { label, error, id, className, ...rest } = props;
        return (
          <div>
            <label htmlFor={id} className="sr-only">
              {label}
            </label>
            <input
              id={id}
              className={`w-full px-4 py-3 rounded-2xl bg-transparent border focus:outline-none placeholder:text-white/40 border-white/20 focus:border-white/40 ${className || ""}`}
              aria-invalid={!!error}
              {...rest}
            />
            {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
          </div>
        );
      },
    []
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top bar */}
     
      {/* Body */}
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div
          className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-6"
          role="region"
          aria-labelledby="register-heading"
        >
          <h1 id="register-heading" className="text-2xl font-semibold">
            Designer Registration
          </h1>
          <p className="text-sm text-white/60 mt-1">Monochrome · Minimal · Bold</p>

          {/* Success banner */}
          {serverMsg && (
            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm p-3">
              {serverMsg}
            </div>
          )}
          {serverErr && (
            <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 text-red-200 text-sm p-3">
              {serverErr}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={setField("email")}
              onBlur={() => validateField("email")}
              error={errors.email}
            />

            <Input
              id="handle"
              label="Nick (handle)"
              placeholder="np. janek.design"
              autoComplete="username"
              value={form.handle}
              onChange={setField("handle")}
              onBlur={() => validateField("handle")}
              error={errors.handle}
            />

            <Input
              id="name"
              label="Imię i nazwisko (opcjonalnie)"
              placeholder="Imię i nazwisko (opcjonalnie)"
              value={form.name ?? ""}
              onChange={setField("name")}
              onBlur={() => validateField("name")}
              error={errors.name}
            />

            <Input
              id="country"
              label="Kraj"
              placeholder="Kraj — np. Polska"
              value={form.country}
              onChange={setField("country")}
              onBlur={() => validateField("country")}
              error={errors.country}
            />

            <div>
              <label htmlFor="password" className="sr-only">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                placeholder="Hasło (min 8, litera + cyfra)"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-2xl bg-transparent border border-white/20 focus:outline-none focus:border-white/40 placeholder:text-white/40"
                value={form.password}
                onChange={setField("password")}
                onBlur={() => validateField("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-3 rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-60"
              aria-busy={loading}
            >
              {loading ? "Tworzenie konta…" : "Utwórz konto"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-white/70">
          <Link
            href="/auth/signin"
            className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-sm"
          >
              Already have an account? Log in
          </Link>
              

          </div>
        </div>
      </main>

    </div>
  );
}

