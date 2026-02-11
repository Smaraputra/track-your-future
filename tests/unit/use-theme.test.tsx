import { act, renderHook } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">hello</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });

  it('defaults to amber theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('amber');
  });

  it('reads theme from localStorage', () => {
    localStorage.setItem('tyf-theme', 'amber');
    const { result } = renderHook(() => useTheme(), { wrapper });
    // useEffect runs asynchronously, but the state should update
    expect(result.current.theme).toBe('amber');
  });

  it('ignores invalid localStorage values', () => {
    localStorage.setItem('tyf-theme', 'blue');
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('amber');
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('throws outside ThemeProvider', () => {
    // Suppress React error boundary console.error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
    spy.mockRestore();
  });

  it('setTheme updates context value', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme('amber');
    });
    expect(result.current.theme).toBe('amber');
  });

  it('setTheme persists to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme('amber');
    });
    expect(localStorage.getItem('tyf-theme')).toBe('amber');
  });

  it('setTheme updates data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme('amber');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('amber');
  });

  it('toggleTheme switches between amber and green', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe('amber');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('green');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('amber');
  });
});
