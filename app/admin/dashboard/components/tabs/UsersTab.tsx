"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardBody } from "@/app/components/ui";
import { MetricCard } from "../shared/MetricCard";
import { Pagination } from "../shared/Pagination";
import { formatLocalizedDate } from "@/lib/date-utils";
import {
  useAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
  useResetUserFeeds,
  type AdminUser,
} from "@/hooks/queries/use-admin";

const UsersIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

/**
 * UsersTab component for managing system users.
 * Features search, sorting, pagination, role management, and user actions.
 *
 * @example
 * ```tsx
 * <UsersTab />
 * ```
 */
export function UsersTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [resetConfirmUserId, setResetConfirmUserId] = useState<string | null>(null);
  const limit = 20;

  // Fetch users with search and pagination
  const { data: usersData, isLoading } = useAdminUsers(
    {
      search: searchQuery || undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    },
    30000
  );

  const updateUserRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const resetUserFeeds = useResetUserFeeds();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole.mutateAsync({ userId, role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Failed to update user role:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update user role";
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const result = await deleteUser.mutateAsync(userId);
      toast.success(result.message);
      setDeleteConfirmUserId(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  const handleResetUser = async (userId: string) => {
    try {
      const result = await resetUserFeeds.mutateAsync(userId);
      toast.success(result.message);
      setResetConfirmUserId(null);
    } catch (error) {
      console.error("Failed to reset user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reset user";
      toast.error(errorMessage);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "USER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "GUEST":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const users = usersData?.users || [];
  const stats = usersData?.stats;
  const pagination = usersData?.pagination;

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle="Registered accounts"
          icon={<UsersIcon />}
          iconColor="blue"
        />
        <MetricCard
          title="Active Users (30d)"
          value={stats?.activeUsers || 0}
          subtitle="Recently active"
          icon={<UsersIcon />}
          iconColor="green"
        />
        <MetricCard
          title="Providing Feedback"
          value={stats?.usersWithFeedback || 0}
          subtitle="Engaged users"
          icon={<UsersIcon />}
          iconColor="purple"
        />
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "email" | "createdAt")}
            className="rounded-lg border border-border bg-background px-4 py-2 text-foreground"
          >
            <option value="createdAt">Joined Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="rounded-lg border border-border bg-background px-4 py-2 text-foreground hover:bg-muted"
            title={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <span className="ml-3 text-foreground/60">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-foreground/70">
                <tr>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium text-center">Feeds</th>
                  <th className="px-6 py-3 font-medium text-center">Articles Read</th>
                  <th className="px-6 py-3 font-medium text-center">Feedback</th>
                  <th className="px-6 py-3 font-medium text-center">Patterns</th>
                  <th className="px-6 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.name?.[0] || user.email[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{user.name || "Unnamed User"}</div>
                          <div className="text-xs text-foreground/60">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updateUserRole.isPending}
                        className={`rounded px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="USER">User</option>
                        <option value="GUEST">Guest</option>
                      </select>
                      {user.email === "madpin@gmail.com" && (
                        <div className="text-xs text-foreground/50 mt-1">Protected account</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-foreground/70">{formatLocalizedDate(user.createdAt)}</td>
                    <td className="px-6 py-4 text-center">{user._count.userFeeds}</td>
                    <td className="px-6 py-4 text-center">{user._count.readArticles}</td>
                    <td className="px-6 py-4 text-center">{user._count.articleFeedback}</td>
                    <td className="px-6 py-4 text-center">{user._count.userPatterns}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setResetConfirmUserId(user.id)}
                          disabled={resetUserFeeds.isPending}
                          className="rounded px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset user feeds to defaults"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setDeleteConfirmUserId(user.id)}
                          disabled={user.email === "madpin@gmail.com" || deleteUser.isPending}
                          className="rounded px-3 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.email === "madpin@gmail.com" ? "Protected account" : "Delete user and all data"}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-foreground/50">
                      {searchQuery ? "No users found matching your search" : "No users found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalUsers}
          itemsPerPage={pagination.limit}
          onPageChange={setPage}
          itemLabel="users"
        />
      )}

      {/* Role Information */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Role Permissions</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>
            <strong>Admin:</strong> Full access to all features including admin panel
          </li>
          <li>
            <strong>User:</strong> Can manage feeds and preferences (default for new users)
          </li>
          <li>
            <strong>Guest:</strong> Read-only access, can view feeds but cannot create/edit/delete them
          </li>
        </ul>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-foreground mb-3">Confirm User Deletion</h3>
            <p className="text-foreground/70 mb-4">
              Are you sure you want to delete this user? This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground/60 mb-4 space-y-1">
              <li>User account and profile</li>
              <li>All feed subscriptions</li>
              <li>Reading history and feedback</li>
              <li>User patterns and preferences</li>
              <li>Notifications and categories</li>
            </ul>
            <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-6">
              This action cannot be undone!
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmUserId(null)}
                disabled={deleteUser.isPending}
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUserId)}
                disabled={deleteUser.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleteUser.isPending ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {resetConfirmUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-foreground mb-3">Confirm User Reset</h3>
            <p className="text-foreground/70 mb-4">
              Are you sure you want to reset this user? This will:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground/60 mb-4 space-y-1">
              <li>Delete all current feed subscriptions</li>
              <li>Delete all custom categories</li>
              <li>Re-subscribe user to default feeds</li>
              <li>Create default categories</li>
            </ul>
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              Reading history, feedback, and preferences will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResetConfirmUserId(null)}
                disabled={resetUserFeeds.isPending}
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetUser(resetConfirmUserId)}
                disabled={resetUserFeeds.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {resetUserFeeds.isPending ? "Resetting..." : "Reset User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
