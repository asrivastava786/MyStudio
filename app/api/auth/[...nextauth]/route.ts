// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/auth.options";


// const handler = NextAuth(authOptions);

// export const runtime = "edge"; //issue with cloudflare pages
// export { handler as GET, handler as POST };

// app/api/auth/[...nextauth]/route.ts
// export const runtime = "edge";
export { handlers as GET, handlers as POST } from "@/lib/auth";
