import { auth } from "../auth";
import { apiError } from "../api-response";
import { prisma } from "../db";
import { UserRole } from "@prisma/client";

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Get the current authenticated user with their role from database
 * Returns null if not authenticated
 */
export async function getCurrentUserWithRole() {
  const user = await getCurrentUser();
  if (!user?.id) return null;
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true },
  });
  
  return dbUser;
}

/**
 * Get the current authenticated user or throw an error
 * Use this in API routes that require authentication
 */
export async function requireAuth(): Promise<{ id: string; email?: string | null; name?: string | null }> {
  const user = await getCurrentUser();
  
  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }
  
  return { id: user.id, email: user.email, name: user.name };
}

/**
 * Require that the current user has admin role
 * Throws error if not authenticated or not an admin
 */
export async function requireAdmin(): Promise<{ id: string; email?: string | null; name?: string | null; role: UserRole }> {
  const user = await getCurrentUserWithRole();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  
  return user;
}

/**
 * Require that the current user has at least USER role (USER or ADMIN)
 * Throws error if not authenticated or is only GUEST
 */
export async function requireUserOrAbove(): Promise<{ id: string; email?: string | null; name?: string | null; role: UserRole }> {
  const user = await getCurrentUserWithRole();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  if (user.role === "GUEST") {
    throw new Error("Forbidden: User access required");
  }
  
  return user;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  return user?.role === "ADMIN";
}

/**
 * Check if current user is at least a user (not guest)
 */
export async function isUserOrAbove(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  return user?.role === "USER" || user?.role === "ADMIN";
}

/**
 * Middleware wrapper for API routes that require authentication
 * Returns a 401 error if the user is not authenticated
 * 
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withAuth(async (user) => {
 *     // Your authenticated route logic here
 *     // user.id is guaranteed to exist
 *     return apiResponse({ data: "success" });
 *   });
 * }
 * ```
 */
export async function withAuth<T>(
  handler: (user: { id: string; email?: string | null; name?: string | null }) => Promise<T>
): Promise<T> {
  try {
    const user = await requireAuth();
    return await handler(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return apiError("Unauthorized. Please sign in.", 401) as T;
    }
    throw error;
  }
}

/**
 * Check if a user is authenticated (for conditional logic)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.id;
}
