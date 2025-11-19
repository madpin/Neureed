/**
 * Admin Settings API
 * GET/PUT /api/admin/settings
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getAllAdminSettings,
  updateAdminSetting,
  getAdminSetting,
} from "@/lib/services/admin-settings-service";
import { z } from "zod";

/**
 * GET - Get all admin settings
 */
export async function GET() {
  try {
    const settings = await getAllAdminSettings();

    return apiResponse({
      settings: settings.map((s) => ({
        key: s.key,
        value: s.value,
        description: s.description,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    logger.error("Failed to get admin settings", { error });
    return apiError(
      "Failed to get settings",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  description: z.string().optional(),
});

/**
 * PUT - Update a specific admin setting
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateSettingSchema.parse(body);

    // Validate specific setting types
    if (validated.key === "embedding_auto_generate") {
      if (typeof validated.value !== "boolean") {
        return apiError(
          "Invalid value",
          "embedding_auto_generate must be a boolean",
          { status: 400 }
        );
      }
    }

    if (validated.key === "default_search_recency_weight") {
      if (typeof validated.value !== "number" || validated.value < 0 || validated.value > 1) {
        return apiError(
          "Invalid value",
          "default_search_recency_weight must be a number between 0 and 1",
          { status: 400 }
        );
      }
    }

    if (validated.key === "default_search_recency_decay_days") {
      if (typeof validated.value !== "number" || validated.value < 1 || validated.value > 365) {
        return apiError(
          "Invalid value",
          "default_search_recency_decay_days must be a number between 1 and 365",
          { status: 400 }
        );
      }
    }

    const setting = await updateAdminSetting(
      validated.key,
      validated.value,
      validated.description
    );

    logger.info("Admin setting updated via API", {
      key: validated.key,
      value: validated.value,
    });

    return apiResponse({
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
      },
      message: "Setting updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", error.errors[0].message, {
        status: 400,
      });
    }

    logger.error("Failed to update admin setting", { error });
    return apiError(
      "Failed to update setting",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * POST - Get a specific admin setting by key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== "string") {
      return apiError("Invalid request", "Key is required", { status: 400 });
    }

    const value = await getAdminSetting(key);

    return apiResponse({
      key,
      value,
    });
  } catch (error) {
    logger.error("Failed to get admin setting", { error });
    return apiError(
      "Failed to get setting",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

