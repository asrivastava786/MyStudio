// import { PrismaAdapter } from "@auth/prisma-adapter";
// import { type NextAuthOptions, getServerSession } from "next-auth";
// import EmailProvider from "next-auth/providers/email";
// import { db } from "./db";
// import type { DefaultSession } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import bcrypt from "bcrypt";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { Adapter } from "next-auth/adapters";


// declare module "next-auth" {
//   interface Session extends DefaultSession {
//     user: {
//       id: string;
//       role: "DESIGNER" | "ADMIN";
//       email?: string | null;
//       name?: string | null;
//       image?: string | null;
//     } & DefaultSession["user"];
//   }
//   interface User {
//     role: "DESIGNER" | "ADMIN";
//   }
// }

// export const authOptions: NextAuthOptions = {
//   adapter: PrismaAdapter(db as any) as Adapter,
//   session: { strategy: "jwt" },



//    providers: [
//     // 1) Google OAuth
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID!,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//       allowDangerousEmailAccountLinking: true, // unify accounts by email
//     }),

//     // 2) Magic Link (Email)
//     EmailProvider({
//       server: {
//         host: process.env.EMAIL_SERVER_HOST!,
//         port: Number(process.env.EMAIL_SERVER_PORT!),
//         auth: { user: process.env.EMAIL_SERVER_USER!, pass: process.env.EMAIL_SERVER_PASSWORD! },
//       },
//       from: process.env.EMAIL_FROM!,
//       maxAge: 60 * 60, // 1 hour
//     }),

//     // 3) Credentials (email/handle + password)
//     CredentialsProvider({
//       name: "Email/Nick + Hasło",
//       credentials: {
//         identifier: { label: "Email lub nick", type: "text" },
//         password: { label: "Hasło", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.identifier || !credentials?.password) return null;

//         const user = await db.user.findFirst({
//           where: { OR: [{ email: credentials.identifier }, { handle: credentials.identifier }] },
//         });
//         if (!user?.passwordHash) return null;

//         const ok = await bcrypt.compare(credentials.password, user.passwordHash);
//         if (!ok) return null;

//         return { id: user.id, name: user.name ?? user.handle ?? "", email: user.email ?? null, image: user.image ?? null,role: user.role,  };
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = (user as any).id;
//         token.role = (user as any).role ?? "DESIGNER";
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         (session.user as any).id = token.id as string;
//         (session.user as any).role = (token as any).role ?? "DESIGNER";
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: "/auth/signin",
//     verifyRequest: "/auth/verify",
//   },

// };
// export const getSessionServer = () => getServerSession(authOptions);


// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db"; // should use @prisma/client/edge in there

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "DESIGNER" | "ADMIN";
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    role: "DESIGNER" | "ADMIN";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },

  providers: [
    // Google OAuth (enabled only if env present)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // Email magic link via Brevo HTTP API (Edge-friendly; no SMTP)
    Email({
      maxAge: 60 * 60, // 1 hour
      async sendVerificationRequest({ identifier, url }) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY!,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            to: [{ email: identifier }],
            sender: {
              email: process.env.EMAIL_FROM!,
              name: process.env.EMAIL_SENDER_NAME || "ZORY Studio",
            },
            subject: "Your sign-in link",
            htmlContent: `
              <div style="font-family:Inter,system-ui,sans-serif;line-height:1.6">
                <h2>Sign in to ZORY Studio</h2>
                <p>Click the link below to sign in (expires in 1 hour):</p>
                <p><a href="${url}">${url}</a></p>
              </div>
            `,
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Brevo send failed: ${res.status} ${txt}`);
        }
      },
    }),

    // Email/nick + password (bcryptjs is pure JS → Edge OK)
    Credentials({
      name: "Email/Nick + Password",
      credentials: {
        identifier: { label: "Email or nick", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.identifier === "string" ? credentials.identifier : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!identifier || !password) return null;

        const user = await db.user.findFirst({
          where: { OR: [{ email: identifier }, { handle: identifier }] },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user?.passwordHash) return null;

        const ok = await compare(password, user.passwordHash as string);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? identifier,
          image: user.image ?? null,
          
          role: (user.role as "DESIGNER" | "ADMIN") ?? "DESIGNER",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
       
        token.id = (user as any).id;
        
        token.role = (user as any).role ?? "DESIGNER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
       
        session.user.id = token.id as string;
       
        session.user.role = (token as any).role ?? "DESIGNER";
      }
      return session;
    },
    // Safe redirect (no open redirects)
    redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl);
        if (u.origin === baseUrl) return u.toString();
      } catch {}
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
});
