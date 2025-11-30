import type { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  icon?: ReactNode;
  iconColor?: "blue" | "green" | "purple" | "red" | "yellow" | "indigo";
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down";
  };
  footer?: ReactNode;
  className?: string;
}

/**
 * StatCard component - Specialized card for displaying dashboard metrics
 *
 * @example
 * ```tsx
 * <StatCard
 *   title="Total Users"
 *   value={1234}
 *   label="Active users"
 *   icon={<UsersIcon />}
 *   iconColor="blue"
 *   trend={{ value: 12, label: "vs last month", direction: "up" }}
 * />
 * ```
 */
export function StatCard({
  title,
  value,
  label,
  icon,
  iconColor = "blue",
  trend,
  footer,
  className = "",
}: StatCardProps) {
  const iconColors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  const trendColors = trend
    ? trend.direction === "up"
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400"
    : "";

  const classes = [
    "rounded-lg border border-border bg-background p-6 shadow-sm",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        {icon && (
          <div className={`rounded-full p-2 ${iconColors[iconColor]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-sm text-foreground/60">{label}</p>
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className={trendColors}>
            {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-foreground/60">{trend.label}</span>
        </div>
      )}
      {footer && (
        <div className="mt-4 border-t border-border pt-4">
          {footer}
        </div>
      )}
    </div>
  );
}
