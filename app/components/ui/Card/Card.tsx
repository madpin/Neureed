import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Card component - Container with border, background, and optional shadow
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader title="Example Card" />
 *   <CardBody>
 *     <p>Content goes here</p>
 *   </CardBody>
 * </Card>
 * ```
 */
export function Card({
  children,
  className = "",
  padding = false,
  shadow = "sm",
  hover = false,
  onClick,
}: CardProps) {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
  };

  const classes = [
    "rounded-lg",
    "border",
    "border-border",
    "bg-background",
    shadowClasses[shadow],
    padding && "p-6",
    hover && "transition-shadow hover:shadow-md",
    onClick && "cursor-pointer",
    className,
  ].filter(Boolean).join(" ");

  const Component = onClick ? "button" : "div";

  return (
    <Component className={classes} onClick={onClick} type={onClick ? "button" : undefined}>
      {children}
    </Component>
  );
}
