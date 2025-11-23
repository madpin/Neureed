import { createHandler } from "@/lib/api-handler";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { resetUserFeeds } from "@/lib/services/user-service";
import { subscribeUserToDefaultFeeds } from "@/lib/services/default-feeds-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[userId]/reset
 * Reset user to default state by:
 * 1. Deleting all current feed subscriptions and categories
 * 2. Re-subscribing user to default feeds
 * Protected accounts (madpin@gmail.com) cannot be reset
 */
export const POST = createHandler(
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

    // Protect madpin@gmail.com from reset
    if (user.email === "madpin@gmail.com") {
      return apiError("Cannot reset protected account", 403);
    }

    // Reset user feeds and categories
    const resetStats = await resetUserFeeds(userId);

    // Re-subscribe to default feeds
    await subscribeUserToDefaultFeeds(userId);

    // Get new subscription count
    const newSubscriptionCount = await prisma.user_feeds.count({
      where: { userId },
    });

    return {
      message: `User ${user.name || user.email} has been reset successfully`,
      stats: {
        deletedSubscriptions: resetStats.deletedSubscriptions,
        deletedCategories: resetStats.deletedCategories,
        newSubscriptions: newSubscriptionCount,
      },
    };
  },
  { requireAdmin: true }
);
