import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Testing Library Setup', () => {
  it('renders a simple component', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('uses custom matchers', () => {
    const { container } = render(<button disabled>Click me</button>);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });
});
