"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to preferences page
    router.replace("/preferences");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to Preferences...</p>
      </div>
    </div>
  );
}
