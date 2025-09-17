import "server-only";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { Adapter } from "next-auth/adapters";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

// ---- Module augmentation ----
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: "DESIGNER" | "ADMIN";
      email?: string | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: "DESIGNER" | "ADMIN";
  }
}

// ---- Auth options (providers live ONLY here) ----
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any) as Adapter,
  session: { strategy: "jwt" },

  providers: [
    // Google (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // Magic link (Email) — this pulls Nodemailer (server-only)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 60 * 60, // 1 hour
    }),

    // Credentials
    CredentialsProvider({
      name: "Email/Nick + Hasło",
      credentials: {
        identifier: { label: "Email lub nick", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { handle: credentials.identifier },
            ],
          },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name ?? user.handle ?? "",
          email: user.email ?? null,
          image: user.image ?? null,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = (user as any).id;
        (token as any).role = (user as any).role ?? "DESIGNER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role ?? "DESIGNER";
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
};
