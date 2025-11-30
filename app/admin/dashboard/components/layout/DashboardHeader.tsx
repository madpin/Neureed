import Link from "next/link";
import { Tooltip } from "@/app/components/ui";

/**
 * DashboardHeader component displays the page title and navigation.
 * Provides context about the current page and a link back to the main application.
 *
 * @example
 * ```tsx
 * <DashboardHeader />
 * ```
 */
export function DashboardHeader() {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-sm sm:text-base text-foreground/70">
          System management and monitoring
        </p>
      </div>
      <Tooltip content="Return to the main application">
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to Home
        </Link>
      </Tooltip>
    </div>
  );
}
