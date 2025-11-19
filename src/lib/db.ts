import { PrismaClient } from "@prisma/client";
import { env } from "@/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Database health check function
 * Returns true if the database is accessible, false otherwise
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  message: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      message: "Database connection successful",
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check if pgvector extension is enabled
 */
export async function checkPgVectorExtension(): Promise<{
  enabled: boolean;
  message: string;
}> {
  try {
    const result = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `;
    
    if (result.length > 0) {
      return {
        enabled: true,
        message: "pgvector extension is enabled",
      };
    } else {
      return {
        enabled: false,
        message: "pgvector extension is not enabled",
      };
    }
  } catch (error) {
    return {
      enabled: false,
      message: `Failed to check pgvector extension: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

