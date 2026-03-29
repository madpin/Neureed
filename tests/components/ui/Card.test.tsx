import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardBody, CardFooter, StatCard } from '@/app/components/ui/Card';

describe('Card', () => {
  it('renders with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-card');
  });
});

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<CardHeader title="Title" subtitle="Subtitle" />);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('renders actions', () => {
    render(
      <CardHeader title="Title" action={<button>Action</button>} />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CardHeader title="Title" className="custom-header" />
    );
    const header = container.firstChild;
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardBody', () => {
  it('renders children', () => {
    render(<CardBody>Body Content</CardBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  it('applies padding', () => {
    const { container } = render(<CardBody padding>Content</CardBody>);
    const body = container.firstChild;
    expect(body).toHaveClass('p-6');
  });

  it('applies custom className', () => {
    const { container } = render(<CardBody className="custom-body">Content</CardBody>);
    const body = container.firstChild;
    expect(body).toHaveClass('custom-body');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardFooter className="custom-footer">Content</CardFooter>);
    const footer = container.firstChild;
    expect(footer).toHaveClass('custom-footer');
  });
});

describe('StatCard', () => {
  it('renders label and value', () => {
    render(
      <StatCard title="Total Users" value="1,234" label="All accounts" />
    );
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(
      <StatCard title="Users" value="100" label="Active" icon={icon} />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <StatCard
        title="Users"
        value="100"
        label="Active this month"
      />
    );
    expect(screen.getByText('Active this month')).toBeInTheDocument();
  });

  it('renders trend indicator', () => {
    render(
      <StatCard
        title="Revenue"
        value="$50K"
        label="Monthly"
        trend={{ value: 12, label: 'vs last month', direction: 'up' }}
      />
    );
    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it('applies different colors for trend directions', () => {
    const { container: upContainer } = render(
      <StatCard
        title="Up"
        value="100"
        label="L"
        trend={{ value: 10, label: 'x', direction: 'up' }}
      />
    );

    const { container: downContainer } = render(
      <StatCard
        title="Down"
        value="100"
        label="L"
        trend={{ value: 10, label: 'x', direction: 'down' }}
      />
    );

    const upTrend = upContainer.querySelector('.text-green-600');
    const downTrend = downContainer.querySelector('.text-red-600');

    expect(upTrend).toBeInTheDocument();
    expect(downTrend).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard title="Test" value="123" label="L" className="custom-stat" />
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-stat');
  });
});
