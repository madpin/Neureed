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
      <CardHeader title="Title" actions={<button>Action</button>} />
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
    expect(body).toHaveClass('p-4');
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
    render(<StatCard label="Total Users" value="1,234" />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const icon = <span data-testid="icon">Icon</span>;
    render(<StatCard label="Users" value="100" icon={icon} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <StatCard
        label="Users"
        value="100"
        description="Active this month"
      />
    );
    expect(screen.getByText('Active this month')).toBeInTheDocument();
  });

  it('renders trend indicator', () => {
    render(
      <StatCard
        label="Revenue"
        value="$50K"
        trend={{ value: 12, direction: 'up' }}
      />
    );
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('applies different colors for trend directions', () => {
    const { container: upContainer } = render(
      <StatCard label="Up" value="100" trend={{ value: 10, direction: 'up' }} />
    );

    const { container: downContainer } = render(
      <StatCard label="Down" value="100" trend={{ value: 10, direction: 'down' }} />
    );

    const upTrend = upContainer.querySelector('.text-green-600');
    const downTrend = downContainer.querySelector('.text-red-600');

    expect(upTrend).toBeInTheDocument();
    expect(downTrend).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Test" value="123" className="custom-stat" />
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-stat');
  });
});
