/**
 * Auth hooks for checking user roles and permissions
 */

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/query/api-client";

interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER" | "GUEST";
}

/**
 * Fetch the current user with their role from the database
 */
async function fetchCurrentUserRole(): Promise<UserWithRole | null> {
  try {
    return await apiGet<UserWithRole>("/api/user/role");
  } catch {
    return null;
  }
}

/**
 * Hook to check if the current user is an admin
 * Returns { isAdmin: boolean, isLoading: boolean }
 */
export function useIsAdmin() {
  const { data: session, status } = useSession();

  const { data: user, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user", "role", session?.user?.id],
    queryFn: fetchCurrentUserRole,
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = status === "loading" || (!!session?.user?.id && isLoadingRole);
  const isAdmin = user?.role === "ADMIN";

  return {
    isAdmin,
    isLoading,
    role: user?.role,
  };
}

/**
 * Hook to check if the current user is at least a USER (not GUEST)
 */
export function useIsUserOrAbove() {
  const { data: session, status } = useSession();

  const { data: user, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user", "role", session?.user?.id],
    queryFn: fetchCurrentUserRole,
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = status === "loading" || (!!session?.user?.id && isLoadingRole);
  const isUserOrAbove = user?.role === "USER" || user?.role === "ADMIN";

  return {
    isUserOrAbove,
    isLoading,
    role: user?.role,
  };
}
