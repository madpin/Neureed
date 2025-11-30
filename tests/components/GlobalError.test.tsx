import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  it('renders error message', () => {
    const error = new Error('Test error message');
    const reset = vi.fn();

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('calls reset when button clicked', () => {
    const error = new Error('Test error');
    const reset = vi.fn();

    render(<GlobalError error={error} reset={reset} />);

    const button = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(button);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('displays default message when error message is empty', () => {
    const error = new Error('');
    const reset = vi.fn();

    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const error = new Error('Snapshot error');
    const reset = vi.fn();

    const { container } = render(<GlobalError error={error} reset={reset} />);

    expect(container).toMatchSnapshot();
  });
});
