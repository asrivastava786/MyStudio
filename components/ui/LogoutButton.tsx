"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="px-4 py-1 rounded-full bg-black text-white hover:bg-red-400"
    >
      Logout
    </button>
  );
}
