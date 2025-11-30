/**
 * Card Component Library
 *
 * A set of composable components for creating card layouts with consistent styling.
 *
 * @example Basic Card
 * ```tsx
 * <Card>
 *   <CardHeader title="Example" />
 *   <CardBody>
 *     <p>Content</p>
 *   </CardBody>
 * </Card>
 * ```
 *
 * @example Stat Card
 * ```tsx
 * <StatCard
 *   title="Users"
 *   value={1234}
 *   label="Total users"
 *   icon={<UsersIcon />}
 *   iconColor="blue"
 * />
 * ```
 */

export { Card } from "./Card";
export type { CardProps } from "./Card";

export { CardHeader } from "./CardHeader";
export type { CardHeaderProps } from "./CardHeader";

export { CardBody } from "./CardBody";
export type { CardBodyProps } from "./CardBody";

export { CardFooter } from "./CardFooter";
export type { CardFooterProps } from "./CardFooter";

export { StatCard } from "./StatCard";
export type { StatCardProps } from "./StatCard";
