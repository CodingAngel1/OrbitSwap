import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('applies primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button.className).toContain('from-stellar-600');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button.className).toContain('border-orbit-border');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('disables button when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByText('Loading') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('calls onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByText('Small').className).toContain('px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByText('Large').className).toContain('px-6');
  });
});

describe('StatusBadge', () => {
  it('renders confirmed status', async () => {
    const { StatusBadge } = await import('@/components/ui/StatusBadge');
    render(<StatusBadge status="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeDefined();
  });

  it('renders failed status', async () => {
    const { StatusBadge } = await import('@/components/ui/StatusBadge');
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('Failed')).toBeDefined();
  });

  it('renders pending status', async () => {
    const { StatusBadge } = await import('@/components/ui/StatusBadge');
    render(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeDefined();
  });
});

describe('Skeleton', () => {
  it('renders skeleton with correct class', async () => {
    const { Skeleton } = await import('@/components/ui/Skeleton');
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.className).toContain('animate-pulse');
  });
});
