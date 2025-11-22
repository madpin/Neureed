/**
 * Summarization Configuration API
 * GET/POST /api/admin/summarization/config
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getSummarizationConfiguration,
  setSummarizationAutoGenerate,
} from "@/lib/services/admin-settings-service";

export const dynamic = "force-dynamic";

/**
 * Schema for updating summarization configuration
 */
const summarizationConfigSchema = z.object({
  autoGenerate: z.boolean(),
});

/**
 * GET - Get summarization configuration
 */
export const GET = createHandler(
  async () => {
    logger.info("[API] Getting summarization configuration");

    const config = await getSummarizationConfiguration();

    return {
      data: config,
      message: "Summarization configuration retrieved successfully",
    };
  },
  { requireAdmin: true }
);

/**
 * POST - Update summarization configuration
 */
export const POST = createHandler(
  async ({ body }) => {
    const { autoGenerate } = body as { autoGenerate: boolean };

    logger.info("[API] Updating summarization configuration", {
      autoGenerate,
    });

    await setSummarizationAutoGenerate(autoGenerate);

    const config = await getSummarizationConfiguration();

    return {
      data: config,
      message: `Automatic summarization ${autoGenerate ? "enabled" : "disabled"} successfully`,
    };
  },
  {
    requireAdmin: true,
    bodySchema: summarizationConfigSchema,
  }
);
