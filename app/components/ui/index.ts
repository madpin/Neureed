/**
 * UI Component Library
 *
 * Centralized exports for all reusable UI components.
 * Import from this file to use the component library.
 *
 * @example
 * ```tsx
 * import { Button, Modal, Card } from '@/app/components/ui';
 * ```
 */

// Buttons
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Toggle Switches
export { ToggleSwitch } from "./ToggleSwitch";
export type { ToggleSwitchProps } from "./ToggleSwitch";

// Form Components (with React Hook Form support)
export {
  Form,
  FormField,
  Input,
  Select,
  TextArea,
  ControlledInput,
  ControlledSelect,
  ControlledTextArea,
} from "./Form";
export type {
  FormProps,
  FormFieldProps,
  InputProps,
  SelectProps,
  TextAreaProps,
  ControlledInputProps,
  ControlledSelectProps,
  ControlledTextAreaProps,
} from "./Form";

// Tooltips
export { Tooltip } from "./Tooltip";
export type { TooltipProps } from "./Tooltip";

// Modals
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useModal,
  useModalLevel,
  ModalLevelProvider,
} from "./Modal";
export type {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
  UseModalReturn,
  ModalLevelProviderProps,
} from "./Modal";

// Cards
export { Card, CardHeader, CardBody, CardFooter, StatCard } from "./Card";
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps, StatCardProps } from "./Card";

// Loading States
export { LoadingSpinner } from "./LoadingSpinner";
export type { LoadingSpinnerProps } from "./LoadingSpinner";

// Empty States
export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

// Error Boundaries
export { ErrorBoundary } from "./ErrorBoundary";

// Icons (lucide-react)
export * from "./icons";
