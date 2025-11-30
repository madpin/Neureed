import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/app/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const button = container.querySelector('button');

    expect(button).toHaveClass('btn-danger');
  });

  it('applies size classes', () => {
    const { container: smContainer } = render(<Button size="sm">Small</Button>);
    const { container: lgContainer } = render(<Button size="lg">Large</Button>);

    expect(smContainer.querySelector('button')).toHaveClass('btn-sm');
    expect(lgContainer.querySelector('button')).toHaveClass('btn-lg');
  });

  it('applies fullWidth prop', () => {
    const { container } = render(<Button fullWidth>Full Width</Button>);
    const button = container.querySelector('button');

    expect(button).toHaveClass('w-full');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders icon on left', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Button icon={icon} iconPosition="left">Button</Button>);

    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');

    // Icon should come before text
    expect(button.firstChild).toBe(iconElement);
  });

  it('renders icon on right', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Button icon={icon} iconPosition="right">Button</Button>);

    const button = screen.getByRole('button');
    const iconElement = screen.getByTestId('icon');

    // Icon should come after text
    expect(button.lastChild).toBe(iconElement);
  });

  it('hides icon when loading', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<Button icon={icon} loading>Loading</Button>);

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Button</Button>);
    const button = container.querySelector('button');

    expect(button).toHaveClass('custom-class');
  });

  it('sets button type correctly', () => {
    const { container: submitContainer } = render(<Button type="submit">Submit</Button>);
    const { container: buttonContainer } = render(<Button type="button">Button</Button>);

    expect(submitContainer.querySelector('button')).toHaveAttribute('type', 'submit');
    expect(buttonContainer.querySelector('button')).toHaveAttribute('type', 'button');
  });

  it('defaults to type="button"', () => {
    const { container } = render(<Button>Default</Button>);

    expect(container.querySelector('button')).toHaveAttribute('type', 'button');
  });

  it('forwards additional HTML attributes', () => {
    const { container } = render(
      <Button data-testid="custom-button" aria-label="Custom Button">
        Button
      </Button>
    );
    const button = container.querySelector('button');

    expect(button).toHaveAttribute('data-testid', 'custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom Button');
  });
});
