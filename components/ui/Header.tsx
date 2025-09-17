    import Link from "next/link";
    import HeaderClient from "@/components/ui/HeaderClient";
    import { getSessionServer } from "@/lib/auth.server";
    import { unstable_noStore as noStore } from "next/cache";
 

     export default async function Header() {
      noStore(); // ensure no caching

      const session = await getSessionServer();
  return (
    <div className=" bg-black text-white">
     <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/70 bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl tracking-wide font-semibold">
            ZORY Studio
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a className="hover:opacity-80" href="/#collection">Collection</a>
            <a className="hover:opacity-80" href="/#designers">Designers</a>
            <a className="hover:opacity-80" href="/#about">About</a>
            <a className="hover:opacity-80" href="/#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* <Link href="/signin" className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-sm">Sign in</Link> */}
            <HeaderClient user={session?.user ?? null}/>
            <button aria-label="Cart" className="relative grid place-items-center w-10 h-10 rounded-full border border-white/20 hover:border-white/40">
              {/* simple cart icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path d="M6 6h15l-2 9H8L6 3H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="21" r="1.5" fill="currentColor"/>
                <circle cx="18" cy="21" r="1.5" fill="currentColor"/>
              </svg>
              <span className="absolute -top-1 -right-1 text-xs bg-white text-black rounded-full px-1.5 py-0.5">0</span>
            </button>
          </div>
        </div>
      </header>
    </div>
        );
}
