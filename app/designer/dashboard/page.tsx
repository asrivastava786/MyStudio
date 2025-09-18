

// import ProfileTab from "./profile-tab";
// import SalesTab from "./sales-tab";
// import { getSessionServer } from "@/lib/auth";
// import CreateProductTab from "./create-product-tab";
// import Mydesign from "./myDesign"
// import ProductDesigner from "./productDesigner"


// export default async function Dashboard() {
//   const session = await getSessionServer();
//   if (!session?.user) return <div className="p-6">No Available.</div>;

//   return (
//     <main className="max-w-4xl mx-auto p-6 space-y-6">
//       <h1 className="text-2xl font-semibold">Artist Panel</h1>
//       <p className="text-sm text-gray-600">Logged in as {session.user.email}</p>         
       
       
//       <div className="border rounded-2xl p-4">
        

//         <Tabs />
//       </div>
//     </main>
//   );
// }

// function Tabs() {
//   return (
//     <div className="space-y-4">
//       <input type="radio" id="tab1" name="tabs" defaultChecked className="hidden peer/tab1" />
//       <input type="radio" id="tab2" name="tabs" className="hidden peer/tab2" />
//       <input type="radio" id="tab3" name="tabs" className="hidden peer/tab3" />
//       <input type="radio" id="tab4" name="tabs" className="hidden peer/tab4" />      
    

//       <div className="flex gap-2">
//         <label htmlFor="tab1" className="px-3 py-2 rounded-full border cursor-pointer">Profile</label>
//         <label htmlFor="tab2" className="px-3 py-2 rounded-full border cursor-pointer">Sales</label>
//         <label htmlFor="tab3" className="px-3 py-2 rounded-full border cursor-pointer">Create Produkt</label>
//         <label htmlFor="tab4" className="px-3 py-2 rounded-full border cursor-pointer">My Designs</label>
//       </div>
//       <div className="peer-checked/tab1:block hidden">
//         <ProfileTab />
//       </div>
//       <div className="peer-checked/tab2:block hidden">
//         <SalesTab />
//       </div>
//       <div className="peer-checked/tab3:block hidden">
//         <CreateProductTab />
//       </div>

//       <div className="peer-checked/tab3:block hidden">
//         <ProductDesigner />
//       </div>
//         <div className="peer-checked/tab4:block hidden">
//         <Mydesign/>
//       </div>
//     </div>
//   );
// }


// app/designer/dashboard/page.tsx — server component
// Modern "Aurora" look with tasteful gradients, grid overlay, and accessible CSS-only tabs.

import { redirect } from "next/navigation";
//import { getSessionServer } from "@/lib/auth.server"; // server-only helper
import ProfileTab from "./profile-tab";
import SalesTab from "./sales-tab";
import CreateProductTab from "./create-product-tab";
import Mydesign from "./myDesign";
import ProductDesignerClient from "./ProductDesignerClient"; // client wrapper
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

export const runtime = "edge"; //issue with cloudflare pages

export const revalidate = 0; // keep session fresh on each request

export default async function Dashboard() {
  //const session = await getSessionServer();
  const session = await auth();

  if (!session?.user) redirect("/auth/signin?callbackUrl=/designer/dashboard");
  const email = session.user.email ?? ""; // ensure defined for SalesTab prop

  return (
    <main className="relative min-h-screen text-white">
      {/* --- Decorative background: subtle grid + aurora blobs --- */}
      <div className="pointer-events-none absolute inset-0 -z-10 " >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-50 [mask-image:radial-gradient(80%_60%_at_50%_10%,black,transparent)] bg-[linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:22px_22px]" />
        {/* Aurora blobs */}
        <div className="absolute -top-24 -left-24 h-[32rem] w-[32rem] rounded-full blur-3xl bg-gradient-to-br from-fuchsia-500/25 via-violet-500/15 to-cyan-400/20" />
        <div className="absolute -bottom-24 -right-16 h-[28rem] w-[28rem] rounded-full blur-3xl bg-gradient-to-tr from-emerald-400/20 via-cyan-400/10 to-indigo-500/20" />
      </div>

      {/* Page container */}
      <section className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Artist Panel
            </h1>
            <p className="mt-1 text-sm text-black/70">Logged in as {session.user.email}</p>
          </div>
        </header>

        {/* KPI Row (placeholders; wire real data later) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: "—" },
            { label: "Revenue", value: "—" },
            { label: "Conversion", value: "—" },
            { label: "Active Designs", value: "—" },
          ].map((s) => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-black/40 bg-black/5 p-4 backdrop-blur">
              <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-fuchsia-400/20 via-cyan-300/20 to-emerald-300/20" />
              <p className="text-xs text-black/60">{s.label}</p>
              <p className="mt-1 text-xl font-medium tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs email={email}/>
      </section>
    </main>
  );
}

function Tabs({ email }: { email: string }) {
  return (
    <div className="space-y-6">
      {/* Radios (must be siblings of panels for peer-checked utilities) */}
      <input id="tab-profile"  name="dashTabs" type="radio" defaultChecked className="peer/profile hidden" />
      <input id="tab-sales"    name="dashTabs" type="radio" className="peer/sales hidden" />
      <input id="tab-create"   name="dashTabs" type="radio" className="peer/create hidden" />
      <input id="tab-designer" name="dashTabs" type="radio" className="peer/designer hidden" />
      <input id="tab-my"       name="dashTabs" type="radio" className="peer/my hidden" />

      {/* Tab controls */}
      <div className="rounded-2xl border border-black/50 p-1 bg-black/80 backdrop-blur flex flex-wrap gap-2">
        {[
          { id: "tab-profile",  title: "Profile",  peer: "profile" },
        { id: "tab-sales",    title: "Sales",    peer: "sales" },
          { id: "tab-create",   title: "Create Product", peer: "create" },
          // { id: "tab-designer", title: "Product Designer", peer: "designer" },
          { id: "tab-my",       title: "My Designs", peer: "my" },
        ].map((t) => (
          <label
            key={t.id}
            htmlFor={t.id}
            role="tab"
            aria-controls={`panel-${t.peer}`}
            className={
              "relative cursor-pointer select-none rounded-full px-3 py-2 text-sm transition border border-white/10 " +
              `peer-checked/${t.peer}:text-black peer-checked/${t.peer}:border-transparent ` +
              `hover:border-black/30 ` +
              // gradient chip when selected
              `peer-checked/${t.peer}:bg-gradient-to-r peer-checked/${t.peer}:from-fuchsia-400 peer-checked/${t.peer}:via-cyan-300 peer-checked/${t.peer}:to-emerald-300`
            }
          >
            {t.title}
          </label>
        ))}
      </div>

      {/* Panels */}
      <section id="panel-profile" role="tabpanel" className="hidden peer-checked/profile:block">
        <Card>
          <ProfileTab />
        </Card>
      </section>

      <section id="panel-sales" role="tabpanel" className="hidden peer-checked/sales:block">
        <Card>

          <SalesTab Useremail={email}/>
          
        </Card>
      </section>


      <section id="panel-create" role="tabpanel" className="hidden peer-checked/create:block">
        <Card id="create">
          <CreateProductTab />
          <section className="mt-5">

           <ProductDesignerClient />

           </section>
        </Card>
      </section>


      <section id="panel-my" role="tabpanel" className="hidden peer-checked/my:block">
        <Card>
          <Mydesign />
        </Card>
      </section>
    </div>
  );
}

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-2xl border border-black/20 bg-white/5 p-4 lg:p-6 backdrop-blur"
    >
      {/* faint angle sheen */}
      <div className="pointer-events-none absolute -inset-px opacity-0 hover:opacity-100 transition-opacity duration-500 bg-[conic-gradient(from_180deg_at_50%_0%,rgba(255,255,255,0.06),rgba(255,255,255,0)_30%,rgba(255,255,255,0.06)_60%,rgba(255,255,255,0)_100%)]" />
      {children}
    </div>
  );
}

