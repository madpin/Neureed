"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/queries/use-notifications";
import { user_notifications } from "@prisma/client";

export function NotificationBell() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Only fetch notifications when user is authenticated
  const { data: unreadCount, error: countError } = useUnreadNotificationCount(status === "authenticated");
  const { data: notifications, isLoading, error: notificationsError } = useNotifications(false, 10, 0, status === "authenticated");
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const count = unreadCount?.data?.count || 0;
  
  // Show toast when new notifications arrive
  useEffect(() => {
    if (count > prevCount && prevCount > 0) {
      // New notification(s) arrived
      const latestNotification = notifications?.data?.[0];
      
      if (latestNotification && latestNotification.type === "feed_refresh") {
        const metadata = latestNotification.metadata as any;
        const toastId = `notification-${latestNotification.id}`;
        
        toast.success(
          <div 
            className="flex flex-col gap-2 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(toastId);
            }}
          >
            <div className="font-semibold text-base">{latestNotification.title}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{latestNotification.message}</div>
            {metadata && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                {metadata.newArticles > 0 && (
                  <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    📰 {metadata.newArticles} new
                  </span>
                )}
                {metadata.updatedArticles > 0 && (
                  <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                    🔄 {metadata.updatedArticles} updated
                  </span>
                )}
                {metadata.articlesCleanedUp > 0 && (
                  <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded">
                    🧹 {metadata.articlesCleanedUp} cleaned
                  </span>
                )}
                {metadata.embeddingsGenerated > 0 && (
                  <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                    🧠 {metadata.embeddingsGenerated} embeddings
                  </span>
                )}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              Click to dismiss
            </div>
          </div>,
          {
            id: toastId,
            duration: 8000,
            position: "top-right",
            dismissible: true,
          }
        );
      } else if (latestNotification) {
        const toastId = `notification-${latestNotification.id}`;
        
        toast.success(
          <div 
            className="flex flex-col gap-1 cursor-pointer" 
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(toastId);
            }}
          >
            <div className="font-semibold">{latestNotification.title}</div>
            <div className="text-sm">{latestNotification.message}</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
              Click to dismiss
            </div>
          </div>,
          {
            id: toastId,
            duration: 5000,
            position: "top-right",
            dismissible: true,
          }
        );
      }
    }
    setPrevCount(count);
  }, [count, prevCount, notifications]);
  
  // Don't render if user is not authenticated
  if (status === "loading") {
    return null;
  }
  
  if (status === "unauthenticated") {
    return null;
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification.mutateAsync(notificationId);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "feed_refresh":
        return "🔄";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${
          count > 0 ? "animate-pulse" : ""
        }`}
        aria-label="Notifications"
        title={count > 0 ? `${count} unread notification${count > 1 ? "s" : ""}` : "No notifications"}
      >
        <svg
          className={`w-6 h-6 ${count > 0 ? "text-blue-600 dark:text-blue-400" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Notification Badge */}
        {count > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full animate-bounce">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {count > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : !notifications?.data || !Array.isArray(notifications.data) || notifications.data.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-2xl mb-2">🔔</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.data.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    formatRelativeTime={formatRelativeTime}
                    getNotificationIcon={getNotificationIcon}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: user_notifications;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  formatRelativeTime: (date: Date) => string;
  getNotificationIcon: (type: string) => string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  formatRelativeTime,
  getNotificationIcon,
}: NotificationItemProps) {
  const metadata = notification.metadata as any;

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>

          {/* Metadata - show feed refresh stats */}
          {metadata && notification.type === "feed_refresh" && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 space-y-0.5">
              {metadata.newArticles > 0 && (
                <div>📰 {metadata.newArticles} new article{metadata.newArticles > 1 ? "s" : ""}</div>
              )}
              {metadata.updatedArticles > 0 && (
                <div>🔄 {metadata.updatedArticles} updated</div>
              )}
              {metadata.articlesCleanedUp > 0 && (
                <div>🧹 {metadata.articlesCleanedUp} cleaned up</div>
              )}
              {metadata.embeddingsGenerated > 0 && (
                <div>🧠 {metadata.embeddingsGenerated} embeddings generated</div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatRelativeTime(notification.createdAt)}
            </span>
            
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

