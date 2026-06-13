"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterSchema, type RegisterInput } from "@/lib/validation";

type Errors = Partial<Record<keyof RegisterInput, string>>;

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function FieldInput({ label, error, id, className, ...rest }: FieldInputProps) {
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
}

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
      const single = RegisterSchema.pick({ [key]: true } as any);
      const res = single.safeParse({ [key]: form[key] });
      setErrors((prev) => ({ ...prev, [key]: res.success ? undefined : res.error.issues[0]?.message }));
    } catch {
      // ignore schema shape errors during dev
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
    const res = RegisterSchema.safeParse(trimmed);
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
        if (res.status === 429) setServerErr("Zbyt wiele prób. Spróbuj ponownie później.");
        else setServerErr(json?.error || "Nie udało się utworzyć konta. Spróbuj ponownie.");
        return;
      }

      setServerMsg("Konto zostało utworzone. Zaloguj się, aby kontynuować.");
      setTimeout(() => {
        router.push(`/auth/signin?registered=1&email=${encodeURIComponent(form.email)}`);
      }, 1500);
    } catch {
      setServerErr("Wystąpił błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
            <FieldInput
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

            <FieldInput
              id="handle"
              label="Nick (handle)"
              placeholder="np. janek.design"
              autoComplete="username"
              value={form.handle}
              onChange={setField("handle")}
              onBlur={() => validateField("handle")}
              error={errors.handle}
            />

            <FieldInput
              id="name"
              label="Imię i nazwisko (opcjonalnie)"
              placeholder="Imię i nazwisko (opcjonalnie)"
              value={form.name ?? ""}
              onChange={setField("name")}
              onBlur={() => validateField("name")}
              error={errors.name}
            />

            <FieldInput
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

          <div className="mt-6 text-sm text-white/70">
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
