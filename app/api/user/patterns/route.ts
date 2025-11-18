import { getUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/user/patterns
 * Get all learned patterns for the current user
 */
export const GET = createHandler(
  async ({ session }) => {
    const patterns = await getUserPatterns(session!.user!.id);

    return { patterns };
  },
  { requireAuth: true }
);

