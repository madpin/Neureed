import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

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

