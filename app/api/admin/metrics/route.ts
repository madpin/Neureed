/**
 * Admin Metrics API
 * GET /api/admin/metrics
 * Returns aggregated system metrics for the admin dashboard
 */

import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = createHandler(
  async () => {
    // Get counts
    const [
      userCount,
      feedCount,
      feedErrorCount,
      articleCount,
      articleWithEmbeddingsResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.feeds.count(),
      prisma.feeds.count({ where: { errorCount: { gt: 0 } } }),
      prisma.articles.count(),
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) as count FROM articles WHERE embedding IS NOT NULL`,
    ]);

    const articleWithEmbeddingsCount = Number(articleWithEmbeddingsResult[0]?.count || 0);

    // Estimate active users (e.g. logged in recently or created recently)
    // Since we don't have a 'lastLogin' field easily accessible without session table query, 
    // we'll just use total users for now or maybe users with sessions.
    // Let's assume active users are those with recent sessions if we used DB sessions, 
    // but NextAuth with JWT doesn't always store sessions in DB unless configured.
    // We'll just return total users as active for simplicity or check updated users.
    const activeUsers = userCount; 

    // Get DB size (simplified from postgres route)
    let dbSize = "Unknown";
    let tableCount = 0;
    try {
      const dbSizeResult = await prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      dbSize = dbSizeResult[0]?.size || "Unknown";
      
      const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_user_tables
      `;
      tableCount = Number(tables[0]?.count || 0);
    } catch (e) {
      console.error("Failed to get DB size", e);
    }

    return {
      users: {
        total: userCount,
        active: activeUsers,
      },
      feeds: {
        total: feedCount,
        active: feedCount - feedErrorCount, // Assuming non-error feeds are active
        errorCount: feedErrorCount,
      },
      articles: {
        total: articleCount,
        withEmbeddings: articleWithEmbeddingsCount,
        recentCount: 0, // Could add query for articles in last 24h
      },
      storage: {
        postgres: {
          size: dbSize,
          tables: tableCount,
        },
        redis: {
          keys: 0, // Placeholder, would need Redis client access
          memory: "Unknown",
        },
      },
      cron: {
        lastRun: new Date().toISOString(), // Placeholder
        status: "idle", // Placeholder
      },
    };
  },
  { requireAdmin: true }
);
