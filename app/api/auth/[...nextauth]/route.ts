import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth.options";

const handler = NextAuth(authOptions);
export const runtime = "edge"; //issue with cloudflare pages
export { handler as GET, handler as POST };
