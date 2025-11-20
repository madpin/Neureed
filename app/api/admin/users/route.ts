import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Get list of all users with statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all users with their related data counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
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
        createdAt: "desc",
      },
    });

    // Get additional statistics
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u._count.read_articles > 0).length,
      usersWithFeedback: users.filter(u => u._count.article_feedback > 0).length,
    };

    return apiResponse({ users, stats });
  } catch (error) {
    console.error("Error fetching users:", error);
    return apiError(
      "Failed to fetch users",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

