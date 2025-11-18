import { resetUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * POST /api/user/patterns/reset
 * Reset all learned patterns for the user
 */
export const POST = createHandler(
  async ({ session }) => {
    await resetUserPatterns(session!.user!.id);

    return { message: "Patterns reset successfully" };
  },
  { requireAuth: true }
);

