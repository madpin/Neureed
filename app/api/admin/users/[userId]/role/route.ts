/**
 * User Role Management API
 * PATCH /api/admin/users/[userId]/role - Update user role
 */

import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER", "GUEST"]),
});

/**
 * Update user role handler
 */
const updateRoleHandler = createHandler(
  async ({ body, params }) => {
    const { userId } = params;
    const { role } = body;

    // Prevent removing admin role from madpin@gmail.com
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.email === "madpin@gmail.com" && role !== "ADMIN") {
      throw new Error("Cannot remove admin role from madpin@gmail.com");
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as UserRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return {
      user: updatedUser,
      message: `User role updated to ${role}`,
    };
  },
  { bodySchema: updateRoleSchema, requireAdmin: true }
);

/**
 * PATCH - Update user role
 */
export const PATCH = updateRoleHandler;

/**
 * PUT - Update user role (same as PATCH for backward compatibility)
 */
export const PUT = updateRoleHandler;

