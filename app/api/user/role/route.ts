/**
 * User Role API
 * GET /api/user/role
 * Returns the current user's role
 */

import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = createHandler(
  async ({ session }) => {
    const userId = session!.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
  { requireAuth: true }
);
