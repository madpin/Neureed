/**
 * PostgreSQL Maintenance Operations API
 * POST /api/admin/storage/postgres/maintenance - Run maintenance operations
 */

import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { z } from "zod";

const maintenanceSchema = z.object({
  operation: z.enum(["vacuum", "analyze", "vacuum_analyze", "reindex"]),
  table: z.string().optional(), // If not provided, runs on all tables
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation, table } = maintenanceSchema.parse(body);

    let result: string;
    const startTime = Date.now();

    switch (operation) {
      case "vacuum":
        if (table) {
          await prisma.$executeRawUnsafe(`VACUUM ${table}`);
          result = `VACUUM completed on table: ${table}`;
        } else {
          await prisma.$executeRawUnsafe(`VACUUM`);
          result = "VACUUM completed on all tables";
        }
        break;

      case "analyze":
        if (table) {
          await prisma.$executeRawUnsafe(`ANALYZE ${table}`);
          result = `ANALYZE completed on table: ${table}`;
        } else {
          await prisma.$executeRawUnsafe(`ANALYZE`);
          result = "ANALYZE completed on all tables";
        }
        break;

      case "vacuum_analyze":
        if (table) {
          await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table}`);
          result = `VACUUM ANALYZE completed on table: ${table}`;
        } else {
          await prisma.$executeRawUnsafe(`VACUUM ANALYZE`);
          result = "VACUUM ANALYZE completed on all tables";
        }
        break;

      case "reindex":
        if (table) {
          await prisma.$executeRawUnsafe(`REINDEX TABLE ${table}`);
          result = `REINDEX completed on table: ${table}`;
        } else {
          // REINDEX DATABASE requires superuser, so we'll reindex all tables individually
          const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
          `;
          
          for (const t of tables) {
            await prisma.$executeRawUnsafe(`REINDEX TABLE ${t.tablename}`);
          }
          result = `REINDEX completed on ${tables.length} tables`;
        }
        break;

      default:
        return apiError("Invalid operation", 400);
    }

    const duration = Date.now() - startTime;

    return apiResponse({
      message: result,
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error("Maintenance operation failed:", error);
    
    if (error instanceof z.ZodError) {
      return apiError("Invalid request: " + error.errors.map(e => e.message).join(", "), 400);
    }

    return apiError(
      error instanceof Error ? error.message : "Maintenance operation failed",
      500
    );
  }
}

