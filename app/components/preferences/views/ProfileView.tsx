"use client";

export interface ProfileViewProps {
  session: any;
}

/**
 * Profile View - Displays user profile information
 */
export function ProfileView({ session }: ProfileViewProps) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Profile</h2>
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-20 w-20 rounded-full"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-medium text-primary-foreground">
            {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
          </div>
        )}
        <div>
          <p className="text-lg font-medium">{session.user.name || "User"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{session.user.email}</p>
        </div>
      </div>
    </div>
  );
}
