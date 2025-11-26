import { ReactNode } from "react";
import { Card, CardBody } from "@/app/components/ui";

export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Subtitle text below the value */
  subtitle: string;
  /** Icon element to display in the top right */
  icon: ReactNode;
  /** Icon background color theme */
  iconColor: "blue" | "green" | "purple" | "orange" | "red";
  /** Optional badge to display in the header */
  badge?: {
    label: string;
    color: "green" | "red" | "yellow" | "blue";
  };
  /** Optional footer content */
  footer?: {
    label: string;
    value: string | number;
    valueClassName?: string;
  };
  /** Additional className for the Card */
  className?: string;
}

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const badgeColorClasses = {
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

/**
 * MetricCard component for displaying key metrics in the admin dashboard.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Users"
 *   value={150}
 *   subtitle="Total Registered Users"
 *   icon={<UsersIcon />}
 *   iconColor="blue"
 *   footer={{ label: "Active (30d)", value: 45 }}
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  badge,
  footer,
  className = "",
}: MetricCardProps) {
  return (
    <Card className={`bg-background shadow-sm ${className}`}>
      <CardBody>
        {/* Header with title, badge, and icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-foreground">{title}</h3>
            {badge && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${badgeColorClasses[badge.color]}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <div className={`rounded-full p-2 ${iconColorClasses[iconColor]}`}>
            <div className="h-5 w-5">{icon}</div>
          </div>
        </div>

        {/* Main value and subtitle */}
        <div className="mt-4">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <p className="text-sm text-foreground/60">{subtitle}</p>
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">{footer.label}</span>
              <span className={footer.valueClassName || "font-medium text-foreground"}>
                {footer.value}
              </span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
