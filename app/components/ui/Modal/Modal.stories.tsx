/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useModal,
  ModalLevelProvider,
} from "./index";
import { Button } from "../Button";

const meta: Meta = {
  title: "UI/Modal",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

/**
 * Basic modal with title, content, and actions
 */
export const BasicModal: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button onClick={modal.open}>Open Modal</Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader title="Basic Modal" onClose={modal.close} />
          <ModalBody>
            <p>This is a basic modal with a header, body, and footer.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={modal.close}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Modal size variants
 */
export const ModalSizes: StoryObj = {
  render: () => {
    const [size, setSize] = useState<"sm" | "md" | "lg" | "xl" | "full">("md");
    const modal = useModal();

    const openWithSize = (newSize: typeof size) => {
      setSize(newSize);
      modal.open();
    };

    return (
      <div className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => openWithSize("sm")}>
          Small
        </Button>
        <Button size="sm" onClick={() => openWithSize("md")}>
          Medium
        </Button>
        <Button size="sm" onClick={() => openWithSize("lg")}>
          Large
        </Button>
        <Button size="sm" onClick={() => openWithSize("xl")}>
          X-Large
        </Button>
        <Button size="sm" onClick={() => openWithSize("full")}>
          Full Width
        </Button>

        <Modal isOpen={modal.isOpen} onClose={modal.close} size={size}>
          <ModalHeader title={`${size.toUpperCase()} Modal`} onClose={modal.close} />
          <ModalBody>
            <p>This is a {size} sized modal.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Modal sizes help control the width of your dialog based on content needs.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={modal.close}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },
};

/**
 * Modal with scrollable content
 */
export const ScrollableContent: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button onClick={modal.open}>Open Scrollable Modal</Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader title="Long Content" onClose={modal.close} />
          <ModalBody>
            <div className="space-y-4">
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i}>
                  This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur
                  adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
                  magna aliqua.
                </p>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={modal.close}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Modal without close button (must use footer actions)
 */
export const NoCloseButton: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button onClick={modal.open}>Open Modal</Button>
        <Modal
          isOpen={modal.isOpen}
          onClose={modal.close}
          closeOnOutsideClick={false}
          closeOnEscape={false}
        >
          <ModalHeader
            title="Confirm Action"
            showCloseButton={false}
          />
          <ModalBody>
            <p>
              This modal can only be closed using the buttons below. Outside clicks and
              Escape key are disabled.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={modal.close}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Modal with custom header content
 */
export const CustomHeader: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button onClick={modal.open}>Open Modal</Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader onClose={modal.close}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Custom Header</h2>
                <p className="text-sm text-muted-foreground">With icon and subtitle</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <p>You can customize the header content with any React elements.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={modal.close}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Modal with footer alignment options
 */
export const FooterAlignment: StoryObj = {
  render: () => {
    const modal = useModal();
    const [align, setAlign] = useState<"left" | "center" | "right" | "between">("right");

    const openWithAlign = (newAlign: typeof align) => {
      setAlign(newAlign);
      modal.open();
    };

    return (
      <div className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => openWithAlign("left")}>
          Left
        </Button>
        <Button size="sm" onClick={() => openWithAlign("center")}>
          Center
        </Button>
        <Button size="sm" onClick={() => openWithAlign("right")}>
          Right
        </Button>
        <Button size="sm" onClick={() => openWithAlign("between")}>
          Space Between
        </Button>

        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader title="Footer Alignment" onClose={modal.close} />
          <ModalBody>
            <p>Footer buttons are aligned to the {align}.</p>
          </ModalBody>
          <ModalFooter align={align}>
            {align === "between" ? (
              <>
                <Button variant="danger" size="sm">
                  Delete
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={modal.close}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={modal.close}>
                    Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={modal.close}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={modal.close}>
                  Confirm
                </Button>
              </>
            )}
          </ModalFooter>
        </Modal>
      </div>
    );
  },
};

/**
 * Nested modals with automatic z-index management
 */
export const NestedModals: StoryObj = {
  render: () => {
    const parentModal = useModal();
    const childModal = useModal();

    return (
      <>
        <Button onClick={parentModal.open}>Open Parent Modal</Button>

        <Modal isOpen={parentModal.isOpen} onClose={parentModal.close}>
          <ModalHeader title="Parent Modal" onClose={parentModal.close} />
          <ModalBody>
            <p className="mb-4">This is the parent modal.</p>
            <Button onClick={childModal.open}>Open Child Modal</Button>

            <ModalLevelProvider>
              <Modal isOpen={childModal.isOpen} onClose={childModal.close} size="sm">
                <ModalHeader title="Child Modal" onClose={childModal.close} />
                <ModalBody>
                  <p>
                    This modal appears above the parent with automatic z-index
                    management.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button variant="primary" onClick={childModal.close}>
                    Close Child
                  </Button>
                </ModalFooter>
              </Modal>
            </ModalLevelProvider>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={parentModal.close}>
              Close Parent
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Modal without padding for custom layouts
 */
export const NoPadding: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button onClick={modal.open}>Open Modal</Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader title="Custom Layout" onClose={modal.close} />
          <ModalBody padding={false}>
            <div className="grid grid-cols-2">
              <div className="bg-primary/10 p-6">
                <h3 className="font-semibold mb-2">Left Panel</h3>
                <p className="text-sm">Content with custom padding</p>
              </div>
              <div className="bg-muted/50 p-6">
                <h3 className="font-semibold mb-2">Right Panel</h3>
                <p className="text-sm">More custom content</p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={modal.close}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Form modal example with validation
 */
export const FormModal: StoryObj = {
  render: () => {
    const modal = useModal();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
      if (!name || !email) {
        setError("All fields are required");
        return;
      }
      if (!email.includes("@")) {
        setError("Invalid email address");
        return;
      }
      setError("");
      modal.close();
      // Reset form
      setTimeout(() => {
        setName("");
        setEmail("");
      }, 300);
    };

    return (
      <>
        <Button onClick={modal.open}>Open Form</Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close}>
          <ModalHeader title="Create Account" onClose={modal.close} />
          <ModalBody>
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Create Account
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

/**
 * Confirmation dialog example
 */
export const ConfirmationDialog: StoryObj = {
  render: () => {
    const modal = useModal();

    return (
      <>
        <Button variant="danger" onClick={modal.open}>
          Delete Item
        </Button>
        <Modal isOpen={modal.isOpen} onClose={modal.close} size="sm">
          <ModalHeader onClose={modal.close}>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Confirm Deletion</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-foreground/70">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button variant="danger" onClick={modal.close}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};
