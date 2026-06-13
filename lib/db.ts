import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  }).$extends(withAccelerate());
}

type DbClient = ReturnType<typeof createClient>;

const globalForPrisma = global as unknown as { prisma: DbClient };

export const db: DbClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
