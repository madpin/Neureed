import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { user_notifications } from "@prisma/client";

interface NotificationsResponse {
  data: user_notifications[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface UnreadCountResponse {
  data: {
    count: number;
  };
}

/**
 * Fetch user notifications
 */
async function fetchNotifications(
  unreadOnly: boolean = false,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    unreadOnly: unreadOnly.toString(),
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/user/notifications?${params}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch notifications" }));
    const errorMsg = `${response.status}: ${error.error || "Failed to fetch notifications"}`;
    throw new Error(errorMsg);
  }
  const result = await response.json();
  // Handle nested data structure from API handler
  return result.data || result;
}

/**
 * Fetch unread notification count
 */
async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const response = await fetch("/api/user/notifications/unread-count", {
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch unread count" }));
    const errorMsg = `${response.status}: ${error.error || "Failed to fetch unread count"}`;
    throw new Error(errorMsg);
  }
  const result = await response.json();
  // Handle nested data structure from API handler
  return result.data || result;
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/user/notifications/${notificationId}`, {
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(): Promise<void> {
  const response = await fetch("/api/user/notifications", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}

/**
 * Delete notification
 */
async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/user/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete notification");
  }
}

/**
 * Hook to get user notifications
 */
export function useNotifications(
  unreadOnly: boolean = false,
  limit: number = 20,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["notifications", unreadOnly, limit, offset],
    queryFn: () => fetchNotifications(unreadOnly, limit, offset),
    refetchInterval: 60000, // Refetch every minute
    enabled, // Only fetch when enabled
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401)
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled, // Only fetch when enabled
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401)
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalidate notifications queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

