import { redirect } from "next/navigation";
import ProfileTab from "./profile-tab";
import SalesTab from "./sales-tab";
import CreateProductTab from "./create-product-tab";
import Mydesign from "./myDesign";
import ProductDesignerClient from "./ProductDesignerClient";
import { auth } from "@/lib/auth";

export const revalidate = 0;

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/designer/dashboard");

  const email = session.user.email ?? "";
  const name = session.user.name ?? email.split("@")[0];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="relative min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* fine dot grid */}
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
        {/* top-left glow */}
        <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full blur-[120px] bg-violet-600/10" />
        {/* bottom-right glow */}
        <div className="absolute -bottom-32 -right-32 h-[32rem] w-[32rem] rounded-full blur-[120px] bg-fuchsia-500/8" />
        {/* center accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[20rem] w-[60rem] rounded-full blur-[140px] bg-indigo-500/5" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Page header ── */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-white/30 mb-1">Studio Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-white via-white/80 to-white/50 bg-clip-text text-transparent">
                {name}
              </span>
            </h1>
            <p className="text-sm text-white/35 mt-0.5">{email}</p>
          </div>

          {/* Avatar chip */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center text-xs font-bold text-white select-none">
              {initials}
            </div>
            <div className="text-xs text-white/50 hidden sm:block">
              <span className="block text-white/80 font-medium">{name}</span>
              Designer
            </div>
          </div>
        </header>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Sales", value: "—", sub: "all time" },
            { label: "Revenue", value: "—", sub: "USD" },
            { label: "Conversion", value: "—", sub: "rate" },
            { label: "Active Designs", value: "—", sub: "live" },
          ].map((s) => (
            <div
              key={s.label}
              className="group relative rounded-2xl border border-white/8 bg-white/[0.03] p-4 overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/8 to-fuchsia-500/8" />
              <p className="text-[11px] tracking-widest uppercase text-white/30">{s.label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-[11px] text-white/25 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <Tabs email={email} />
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Tabs                                                     */
/* ─────────────────────────────────────────────────────── */

function Tabs({ email }: { email: string }) {
  const tabs = [
    { id: "tab-profile",  peer: "profile",  label: "Profile" },
    { id: "tab-sales",    peer: "sales",    label: "Sales" },
    { id: "tab-create",   peer: "create",   label: "Create Product" },
    { id: "tab-my",       peer: "my",       label: "My Designs" },
  ];

  return (
    <div className="space-y-6">
      {/* hidden radio inputs — siblings of panels */}
      <input id="tab-profile"  name="dashTabs" type="radio" defaultChecked className="peer/profile hidden" />
      <input id="tab-sales"    name="dashTabs" type="radio" className="peer/sales hidden" />
      <input id="tab-create"   name="dashTabs" type="radio" className="peer/create hidden" />
      <input id="tab-my"       name="dashTabs" type="radio" className="peer/my hidden" />

      {/* Tab bar */}
      <nav className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/8 backdrop-blur w-fit">
        {tabs.map((t) => (
          <label
            key={t.id}
            htmlFor={t.id}
            className={[
              "relative cursor-pointer select-none rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
              "text-white/40 hover:text-white/70",
              `peer-checked/${t.peer}:text-white`,
              `peer-checked/${t.peer}:bg-white/10`,
              `peer-checked/${t.peer}:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]`,
            ].join(" ")}
          >
            {t.label}
          </label>
        ))}
      </nav>

      {/* Panels */}
      <section className="hidden peer-checked/profile:block">
        <Panel>
          <ProfileTab />
        </Panel>
      </section>

      <section className="hidden peer-checked/sales:block">
        <Panel>
          <SalesTab Useremail={email} />
        </Panel>
      </section>

      <section className="hidden peer-checked/create:block">
        <Panel>
          <div>
            <p className="text-[11px] tracking-[0.18em] uppercase text-white/30 mb-1">Designer</p>
            <h2 className="text-xl font-semibold mb-4">Place Your Design</h2>
            <ProductDesignerClient />
          </div>
          <div className="mt-8 pt-8 border-t border-white/8">
            <CreateProductTab />
          </div>
        </Panel>
      </section>

      <section className="hidden peer-checked/my:block">
        <Panel>
          <Mydesign />
        </Panel>
      </section>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur p-5 lg:p-7 overflow-hidden">
      {/* subtle corner sheen */}
      <div className="pointer-events-none absolute -top-px -left-px w-48 h-48 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.04),transparent_60%)]" />
      {children}
    </div>
  );
}
