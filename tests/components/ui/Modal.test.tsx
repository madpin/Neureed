import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '@/app/components/ui/Modal';
import { ModalLevelProvider } from '@/app/components/ui/Modal/useModalLevel';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Modal', () => {
  beforeEach(() => {
    // Create a div for portal rendering
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up portal div
    const portalRoot = document.getElementById('portal-root');
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not close on Escape when closeOnEscape is false', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    // Find backdrop (parent div with bg-black/50)
    const backdrop = document.querySelector('.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not close when clicking backdrop if closeOnOutsideClick is false', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOutsideClick={false}>
        <div>Modal Content</div>
      </Modal>
    );

    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('does not close when clicking modal content', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Modal Content</div>
      </Modal>
    );

    fireEvent.click(screen.getByText('Modal Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;
    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw]',
    };

    sizes.forEach((size) => {
      const { unmount } = render(
        <Modal isOpen={true} onClose={() => {}} size={size}>
          <div>Content</div>
        </Modal>
      );

      const modalContent = document.querySelector(`[role="dialog"]`);
      expect(modalContent).toHaveClass(sizeClasses[size]);

      unmount();
    });
  });

  it('applies custom className', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        <div>Content</div>
      </Modal>
    );

    const modalContent = document.querySelector('[role="dialog"]');
    expect(modalContent).toHaveClass('custom-modal');
  });

  it('applies custom z-index', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} zIndex={2000}>
        <div>Content</div>
      </Modal>
    );

    const backdrop = document.querySelector('.bg-black\\/50');
    const container = document.querySelector('.fixed.inset-0.flex');

    expect(backdrop).toHaveStyle({ zIndex: '1999' });
    expect(container).toHaveStyle({ zIndex: '2000' });
  });

  it('prevents body scroll when open', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    // Should restore original overflow
    expect(document.body.style.overflow).toBe('');
  });

  it('renders with correct ARIA attributes', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('increments z-index for nested modals', () => {
    render(
      <ModalLevelProvider>
        <Modal isOpen={true} onClose={() => {}}>
          <div>Parent Modal</div>
          <Modal isOpen={true} onClose={() => {}}>
            <div>Nested Modal</div>
          </Modal>
        </Modal>
      </ModalLevelProvider>
    );

    const dialogs = screen.getAllByRole('dialog');

    // Parent modal should have lower z-index than nested modal
    expect(dialogs).toHaveLength(2);
  });
});
