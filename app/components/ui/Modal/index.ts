/**
 * Modal Components
 *
 * Composable modal system with support for nested modals, customizable sizes,
 * and consistent styling across the application.
 */

export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { ModalHeader } from "./ModalHeader";
export type { ModalHeaderProps } from "./ModalHeader";

export { ModalBody } from "./ModalBody";
export type { ModalBodyProps } from "./ModalBody";

export { ModalFooter } from "./ModalFooter";
export type { ModalFooterProps } from "./ModalFooter";

export { useModal } from "./useModal";
export type { UseModalReturn } from "./useModal";

export { useModalLevel, ModalLevelProvider } from "./useModalLevel";
export type { ModalLevelProviderProps } from "./useModalLevel";
