import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthOptions, getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { db } from "./db";
import type { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import { Adapter } from "next-auth/adapters";


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

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db as any) as Adapter,
  session: { strategy: "jwt" },



   providers: [
    // 1) Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // unify accounts by email
    }),

    // 2) Magic Link (Email)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT!),
        auth: { user: process.env.EMAIL_SERVER_USER!, pass: process.env.EMAIL_SERVER_PASSWORD! },
      },
      from: process.env.EMAIL_FROM!,
      maxAge: 60 * 60, // 1 hour
    }),

    // 3) Credentials (email/handle + password)
    CredentialsProvider({
      name: "Email/Nick + Hasło",
      credentials: {
        identifier: { label: "Email lub nick", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const user = await db.user.findFirst({
          where: { OR: [{ email: credentials.identifier }, { handle: credentials.identifier }] },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name ?? user.handle ?? "", email: user.email ?? null, image: user.image ?? null,role: user.role,  };
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
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token as any).role ?? "DESIGNER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },

};
export const getSessionServer = () => getServerSession(authOptions);
