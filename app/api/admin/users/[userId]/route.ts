import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/[userId]
 * Get detailed information about a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_preferences: true,
        _count: {
          select: {
            user_feeds: true,
            read_articles: true,
            article_feedback: true,
            user_patterns: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Get recent activity
    const recentFeedback = await prisma.article_feedback.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const recentReads = await prisma.read_articles.findMany({
      where: { userId },
      take: 10,
      orderBy: { readAt: "desc" },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return apiResponse({
      user,
      recentFeedback,
      recentReads,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return apiError(
      "Failed to fetch user details",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Delete a user and all associated data (cascading delete)
 * Protected accounts (madpin@gmail.com) cannot be deleted
 */
export const DELETE = createHandler(
  async ({ params }) => {
    const { userId } = params;

    // Get user to check if it's a protected account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Protect madpin@gmail.com from deletion
    if (user.email === "madpin@gmail.com") {
      return apiError("Cannot delete protected account", 403);
    }

    // Delete user (cascades to all related data via Prisma schema)
    await prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: `User ${user.name || user.email} has been deleted successfully`,
      deletedUserId: userId,
    };
  },
  { requireAdmin: true }
);

