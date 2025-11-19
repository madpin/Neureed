/**
 * PostgreSQL Storage Information API
 * GET /api/admin/storage/postgres - Get database storage stats and health
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiResponse, apiError } from "@/lib/api-response";

interface TableSize {
  tableName: string;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  rowCount: number;
}

interface DatabaseStats {
  databaseSize: string;
  tables: TableSize[];
  connectionInfo: {
    maxConnections: number;
    currentConnections: number;
    activeConnections: number;
    idleConnections: number;
  };
  cacheHitRatio: number;
  indexUsage: Array<{
    schemaName: string;
    tableName: string;
    indexName: string;
    indexScans: number;
    tupleReads: number;
    tupleFetches: number;
  }>;
  vacuumStats: Array<{
    schemaName: string;
    tableName: string;
    lastVacuum: string | null;
    lastAutoVacuum: string | null;
    lastAnalyze: string | null;
    lastAutoAnalyze: string | null;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    // Get database size
    const dbSizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const databaseSize = dbSizeResult[0]?.size || "Unknown";

    // Get table sizes
    const tableSizesRaw = await prisma.$queryRaw<Array<{
      tableName: string;
      totalSize: string;
      tableSize: string;
      indexSize: string;
      rowCount: bigint;
    }>>`
      SELECT 
        schemaname || '.' || relname as "tableName",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as "totalSize",
        pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as "tableSize",
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as "indexSize",
        n_live_tup as "rowCount"
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
    `;
    
    // Convert BigInt to number
    const tableSizes: TableSize[] = tableSizesRaw.map(t => ({
      ...t,
      rowCount: Number(t.rowCount)
    }));

    // Get connection info
    const connectionResultRaw = await prisma.$queryRaw<Array<{
      maxConnections: number;
      currentConnections: bigint;
      activeConnections: bigint;
      idleConnections: bigint;
    }>>`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as "maxConnections",
        (SELECT count(*) FROM pg_stat_activity) as "currentConnections",
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as "activeConnections",
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as "idleConnections"
    `;
    const connectionInfo = {
      maxConnections: connectionResultRaw[0].maxConnections,
      currentConnections: Number(connectionResultRaw[0].currentConnections),
      activeConnections: Number(connectionResultRaw[0].activeConnections),
      idleConnections: Number(connectionResultRaw[0].idleConnections),
    };

    // Get cache hit ratio
    const cacheHitResult = await prisma.$queryRaw<Array<{ ratio: number }>>`
      SELECT 
        CASE 
          WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 0
          ELSE round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::numeric, 4)
        END as ratio
      FROM pg_statio_user_tables
    `;
    const cacheHitRatio = cacheHitResult[0]?.ratio || 0;

    // Get index usage stats (top 20)
    const indexUsageRaw = await prisma.$queryRaw<Array<{
      schemaName: string;
      tableName: string;
      indexName: string;
      indexScans: bigint;
      tupleReads: bigint;
      tupleFetches: bigint;
    }>>`
      SELECT 
        schemaname as "schemaName",
        relname as "tableName",
        indexrelname as "indexName",
        idx_scan as "indexScans",
        idx_tup_read as "tupleReads",
        idx_tup_fetch as "tupleFetches"
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 20
    `;
    
    const indexUsage = indexUsageRaw.map(i => ({
      ...i,
      indexScans: Number(i.indexScans),
      tupleReads: Number(i.tupleReads),
      tupleFetches: Number(i.tupleFetches),
    }));

    // Get vacuum stats
    const vacuumStats = await prisma.$queryRaw<Array<{
      schemaName: string;
      tableName: string;
      lastVacuum: Date | null;
      lastAutoVacuum: Date | null;
      lastAnalyze: Date | null;
      lastAutoAnalyze: Date | null;
    }>>`
      SELECT 
        schemaname as "schemaName",
        relname as "tableName",
        last_vacuum as "lastVacuum",
        last_autovacuum as "lastAutoVacuum",
        last_analyze as "lastAnalyze",
        last_autoanalyze as "lastAutoAnalyze"
      FROM pg_stat_user_tables
      ORDER BY relname
    `;

    const stats: DatabaseStats = {
      databaseSize,
      tables: tableSizes,
      connectionInfo,
      cacheHitRatio,
      indexUsage,
      vacuumStats: vacuumStats.map(stat => ({
        ...stat,
        lastVacuum: stat.lastVacuum ? stat.lastVacuum.toISOString() : null,
        lastAutoVacuum: stat.lastAutoVacuum ? stat.lastAutoVacuum.toISOString() : null,
        lastAnalyze: stat.lastAnalyze ? stat.lastAnalyze.toISOString() : null,
        lastAutoAnalyze: stat.lastAutoAnalyze ? stat.lastAutoAnalyze.toISOString() : null,
      })),
    };

    return apiResponse({ stats });
  } catch (error) {
    console.error("Failed to get PostgreSQL stats:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to retrieve database statistics",
      500
    );
  }
}

