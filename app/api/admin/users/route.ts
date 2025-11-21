import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * Query params schema
 */
const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * GET /api/admin/users
 * Get list of all users with statistics
 * Supports search, pagination, and sorting
 */
export const GET = createHandler(
  async ({ query }) => {
    const search = query.search;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get paginated users with their related data counts
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        _count: {
          select: {
            user_feeds: true,
            read_articles: true,
            article_feedback: true,
            user_patterns: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get additional statistics (from all users, not just current page)
    const allUsers = await prisma.user.findMany({
      select: {
        _count: {
          select: {
            read_articles: true,
            article_feedback: true,
          },
        },
      },
    });

    const stats = {
      totalUsers,
      activeUsers: allUsers.filter((u) => u._count.read_articles > 0).length,
      usersWithFeedback: allUsers.filter((u) => u._count.article_feedback > 0).length,
    };

    return {
      users,
      stats,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    };
  },
  { querySchema, requireAdmin: true }
);

