/**
 * User Preference Constraints API
 * GET/PUT /api/admin/settings/constraints
 * Manage min/max bounds for user preferences
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  getUserConstraints,
  updateUserConstraints,
} from "@/lib/services/admin-settings-service";
import { userConstraintsSchema } from "@/lib/validations/admin-validation";

export const dynamic = "force-dynamic";

/**
 * GET - Get user preference constraints
 */
export const GET = createHandler(
  async () => {
    const constraints = await getUserConstraints();

    return {
      constraints,
      message: "User preference constraints retrieved successfully",
    };
  },
  { requireAdmin: true }
);

/**
 * PUT - Update user preference constraints
 * Validates that min < max for each constraint pair
 */
export const PUT = createHandler(
  async ({ body }) => {
    logger.info("Updating user preference constraints", body);

    try {
      await updateUserConstraints(body);

      // Get updated constraints
      const constraints = await getUserConstraints();

      return {
        constraints,
        message: "User preference constraints updated successfully",
      };
    } catch (error) {
      logger.error("Failed to update user preference constraints", { error, body });
      throw error;
    }
  },
  { bodySchema: userConstraintsSchema, requireAdmin: true }
);

