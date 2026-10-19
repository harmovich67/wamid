import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// PRISMA_QUERY_LOG=1 prints every SQL statement: handy for counting round trips per page.
export const prisma = globalForPrisma.__wameedPrisma ?? new PrismaClient({ log: process.env.PRISMA_QUERY_LOG ? ["query"] : [] });

if (process.env.NODE_ENV !== "production") globalForPrisma.__wameedPrisma = prisma;
