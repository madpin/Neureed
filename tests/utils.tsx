import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Add custom providers if needed
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
