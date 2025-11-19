import { getUserPatterns } from "@/lib/services/pattern-detection-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

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

