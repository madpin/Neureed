import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';

function getSwitch(container: HTMLElement) {
  return container.querySelector('button[role="switch"]') as HTMLButtonElement;
}

describe('ToggleSwitch', () => {
  it('renders with label', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Enable Feature"
      />
    );
    expect(screen.getByText('Enable Feature')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Feature"
        description="Enable this feature to unlock new capabilities"
      />
    );
    expect(screen.getByText('Enable this feature to unlock new capabilities')).toBeInTheDocument();
  });

  it('renders checked state', () => {
    const { container } = render(
      <ToggleSwitch
        checked={true}
        onChange={() => {}}
        label="Feature"
      />
    );

    const btn = getSwitch(container);
    expect(btn?.getAttribute('aria-checked')).toBe('true');
  });

  it('renders unchecked state', () => {
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Feature"
      />
    );

    const btn = getSwitch(container);
    expect(btn?.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange when clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={onChange}
        label="Feature"
      />
    );

    const btn = getSwitch(container);
    fireEvent.click(btn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={onChange}
        label="Feature"
        disabled
      />
    );

    const btn = getSwitch(container);
    fireEvent.click(btn);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies disabled state', () => {
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Feature"
        disabled
      />
    );

    const btn = getSwitch(container);
    expect(btn?.disabled).toBe(true);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Feature"
        className="custom-toggle"
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-toggle');
  });

  it('renders with correct ARIA attributes', () => {
    const { container } = render(
      <ToggleSwitch
        checked={true}
        onChange={() => {}}
        label="Feature"
      />
    );

    const btn = getSwitch(container);
    expect(btn?.getAttribute('role')).toBe('switch');
    expect(btn?.getAttribute('aria-checked')).toBe('true');
  });

  it('associates label with input', () => {
    const { container } = render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Feature"
        id="test-toggle"
      />
    );

    const btn = getSwitch(container);
    const label = container.querySelector('label');

    expect(btn?.id).toBe('test-toggle');
    expect(label?.getAttribute('for')).toBe('test-toggle');
  });
});
