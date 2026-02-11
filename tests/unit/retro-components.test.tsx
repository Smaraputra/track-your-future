import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroStatusBadge, STATUS_COLORS, STATUS_LABELS } from '@/components/retro-status-badge';
import { CRTOverlay, useCRTOverlay } from '@/components/crt-overlay';
import { renderHook, act } from '@testing-library/react';

describe('RetroWindow', () => {
  it('renders children', () => {
    render(<RetroWindow>content here</RetroWindow>);
    expect(screen.getByText('content here')).toBeDefined();
  });

  it('renders title when provided', () => {
    render(<RetroWindow title="Terminal">content</RetroWindow>);
    expect(screen.getByText('Terminal')).toBeDefined();
  });

  it('renders three colored dots', () => {
    const { container } = render(<RetroWindow>x</RetroWindow>);
    const dots = container.querySelectorAll('span.block');
    expect(dots.length).toBe(3);
  });

  it('applies custom className', () => {
    const { container } = render(
      <RetroWindow className="custom-class">x</RetroWindow>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('RetroButton', () => {
  it('renders with default primary variant', () => {
    render(<RetroButton>Click</RetroButton>);
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('border-primary');
  });

  it('renders secondary variant', () => {
    render(<RetroButton variant="secondary">Sec</RetroButton>);
    const btn = screen.getByRole('button', { name: 'Sec' });
    expect(btn.className).toContain('border-border');
  });

  it('renders ghost variant', () => {
    render(<RetroButton variant="ghost">Ghost</RetroButton>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn.className).toContain('text-muted-foreground');
  });

  it('renders destructive variant', () => {
    render(<RetroButton variant="destructive">Del</RetroButton>);
    const btn = screen.getByRole('button', { name: 'Del' });
    expect(btn.className).toContain('border-destructive');
  });

  it('passes through onClick', () => {
    const fn = vi.fn();
    render(<RetroButton onClick={fn}>Click</RetroButton>);
    fireEvent.click(screen.getByRole('button', { name: 'Click' }));
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('RetroInput', () => {
  it('renders an input element', () => {
    render(<RetroInput placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeDefined();
  });

  it('applies custom className', () => {
    render(<RetroInput className="my-input" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveClass('my-input');
  });
});

describe('RetroStatusBadge', () => {
  const allStatuses = [
    'draft',
    'applied',
    'phone_screen',
    'interview',
    'offer',
    'rejected',
    'ghosted',
    'withdrawn',
  ];

  it.each(allStatuses)('renders %s status with correct label', (status) => {
    render(<RetroStatusBadge status={status} />);
    expect(screen.getByText(STATUS_LABELS[status])).toBeDefined();
  });

  it.each(allStatuses)('applies correct color class for %s', (status) => {
    const { container } = render(<RetroStatusBadge status={status} />);
    const badge = container.firstChild as HTMLElement;
    const expectedClasses = STATUS_COLORS[status].split(' ');
    for (const cls of expectedClasses) {
      expect(badge.className).toContain(cls);
    }
  });

  it('handles unknown status gracefully', () => {
    render(<RetroStatusBadge status="unknown_value" />);
    expect(screen.getByText('unknown_value')).toBeDefined();
  });
});

describe('CRTOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders by default when localStorage is empty', () => {
    const { container } = render(<CRTOverlay />);
    expect(container.querySelector('.crt-overlay')).not.toBeNull();
  });

  it('does not render when localStorage has crt disabled', () => {
    localStorage.setItem('tyf-crt-overlay', 'false');
    const { container } = render(<CRTOverlay />);
    expect(container.querySelector('.crt-overlay')).toBeNull();
  });
});

describe('useCRTOverlay', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to enabled', () => {
    const { result } = renderHook(() => useCRTOverlay());
    expect(result.current.enabled).toBe(true);
  });

  it('toggle switches enabled state and persists', () => {
    const { result } = renderHook(() => useCRTOverlay());
    expect(result.current.enabled).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem('tyf-crt-overlay')).toBe('false');
    act(() => {
      result.current.toggle();
    });
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem('tyf-crt-overlay')).toBe('true');
  });
});
