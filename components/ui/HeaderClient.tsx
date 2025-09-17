"use client";
import Link from "next/link";
import LogoutButton from "@/components/ui/LogoutButton";

type UserLite = { name?: string | null; email?: string | null } | null;

export default function HeaderClient({ user }: { user: UserLite }){
  return (
    <div className="flex items-center gap-3">
              <Link
          href="/designer/dashboard"
          className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-sm"
        >
          Dashboard
        </Link>
      {user ? (
        <>
          <span className="hidden sm:inline text-sm text-white/70">
            {user.name ?? user.email}
          </span>
          <LogoutButton />
        </>
      ) : (
        <Link
          href="/auth/signin"
          className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-sm"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
