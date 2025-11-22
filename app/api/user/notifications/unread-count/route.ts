import { createHandler } from "@/lib/api-handler";
import { getUnreadNotificationCount } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/notifications/unread-count
 * Get count of unread notifications
 */
export const GET = createHandler(
  async ({ session }) => {
    const userId = session!.user.id;
    const count = await getUnreadNotificationCount(userId);

    return {
      data: { count },
    };
  },
  {
    requireAuth: true,
  }
);

