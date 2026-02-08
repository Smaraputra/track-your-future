import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BootSequence,
  BOOT_SEEN_KEY,
  BOOT_LINES,
} from '@/components/boot-sequence';

describe('BootSequence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows boot animation when not seen', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );
    expect(screen.getByTestId('boot-sequence')).toBeDefined();
    expect(screen.queryByText('Main content')).toBeNull();
  });

  it('shows children immediately when already seen', () => {
    localStorage.setItem(BOOT_SEEN_KEY, 'true');
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );
    expect(screen.queryByTestId('boot-sequence')).toBeNull();
    expect(screen.getByText('Main content')).toBeDefined();
  });

  it('renders boot lines progressively', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );

    // Initially no lines visible
    expect(screen.queryByText(BOOT_LINES[0].text)).toBeNull();

    // After first delay, first line appears
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(BOOT_LINES[0].text)).toBeDefined();
  });

  it('shows children after animation completes', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText('Main content')).toBeDefined();
    expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe('true');
  });

  it('skips on click', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );

    // Show at least one line so the boot screen is interactive
    act(() => {
      vi.advanceTimersByTime(1);
    });

    fireEvent.click(screen.getByTestId('boot-sequence'));

    expect(screen.getByText('Main content')).toBeDefined();
    expect(localStorage.getItem(BOOT_SEEN_KEY)).toBe('true');
  });

  it('skips on key press', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    fireEvent.keyDown(screen.getByTestId('boot-sequence'), { key: 'Enter' });

    expect(screen.getByText('Main content')).toBeDefined();
  });

  it('does not skip on Tab key', () => {
    render(
      <BootSequence>
        <div>Main content</div>
      </BootSequence>,
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });

    fireEvent.keyDown(screen.getByTestId('boot-sequence'), { key: 'Tab' });

    expect(screen.queryByText('Main content')).toBeNull();
    expect(screen.getByTestId('boot-sequence')).toBeDefined();
  });

  it('exports BOOT_LINES with expected structure', () => {
    expect(BOOT_LINES.length).toBeGreaterThan(10);
    expect(BOOT_LINES[0]).toHaveProperty('text');
    expect(BOOT_LINES[0]).toHaveProperty('delay');
  });
});
