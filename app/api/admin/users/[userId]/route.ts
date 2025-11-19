import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

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
        preferences: true,
        _count: {
          select: {
            userFeeds: true,
            readArticles: true,
            articleFeedback: true,
            userPatterns: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Get recent activity
    const recentFeedback = await prisma.articleFeedback.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        article: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const recentReads = await prisma.readArticle.findMany({
      where: { userId },
      take: 10,
      orderBy: { readAt: "desc" },
      include: {
        article: {
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

