import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

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
    id: string;
    role: "DESIGNER" | "ADMIN";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // `db` is a Prisma Accelerate-extended client; its type doesn't structurally
  // match PrismaClient even though it implements the same delegate methods
  // PrismaAdapter actually calls at runtime.
  adapter: PrismaAdapter(db as unknown as PrismaClient),
  session: { strategy: "jwt" },

  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // Magic link — Brevo HTTP API (no SMTP transport needed at runtime)
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "smtp.example.com",
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? "",
          pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
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
              name: process.env.EMAIL_SENDER_NAME ?? "ZORY Studio",
            },
            subject: "Your sign-in link",
            htmlContent: `
              <div style="font-family:Inter,system-ui,sans-serif;line-height:1.6">
                <h2>Sign in to ZORY Studio</h2>
                <p>Click the link below to sign in (expires in 1 hour):</p>
                <p><a href="${url}">${url}</a></p>
                <p style="font-size:12px;color:#888">If you didn't request this, ignore this email.</p>
              </div>
            `,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Brevo send failed [${res.status}]: ${body}`);
        }
      },
    }),

    Credentials({
      name: "Password",
      credentials: {
        identifier: { label: "Email or username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier =
          typeof credentials?.identifier === "string"
            ? credentials.identifier.trim()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

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

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email ?? null,
          name: user.name ?? identifier,
          image: user.image ?? null,
          role: user.role as "DESIGNER" | "ADMIN",
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as "DESIGNER" | "ADMIN") ?? "DESIGNER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.id as string ?? token.sub;
        session.user.role =
          (token.role as "DESIGNER" | "ADMIN") ?? "DESIGNER";
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
});
