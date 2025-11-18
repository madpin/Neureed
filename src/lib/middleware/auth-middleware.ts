import { auth } from "../auth";
import { apiError } from "../api-response";

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
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

