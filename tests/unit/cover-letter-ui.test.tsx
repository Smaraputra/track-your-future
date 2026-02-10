import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Sparkles: () => <span data-testid="sparkles" />,
  Lock: () => <span data-testid="lock" />,
  Check: () => <span data-testid="check" />,
  Copy: () => <span data-testid="copy" />,
  XIcon: () => <span data-testid="x-icon" />,
}));

import { CoverLetterSection } from '@/components/applications/cover-letter-section';
import { CoverLetterViewer } from '@/components/applications/cover-letter-viewer';

describe('CoverLetterSection', () => {
  const defaultProps = {
    applicationId: 'app-1',
    hasParsedCv: true,
    hasJdAnalysis: true,
    isPro: true,
    onGenerated: vi.fn(),
  };

  it('renders Generate button', () => {
    render(<CoverLetterSection {...defaultProps} />);
    expect(screen.getByText('Generate')).toBeDefined();
  });

  it('renders all tone options', () => {
    render(<CoverLetterSection {...defaultProps} />);
    expect(screen.getByText('Formal')).toBeDefined();
    expect(screen.getByText('Casual')).toBeDefined();
    expect(screen.getByText('Technical')).toBeDefined();
    expect(screen.getByText('Leadership')).toBeDefined();
  });

  it('is disabled when not pro', () => {
    render(<CoverLetterSection {...defaultProps} isPro={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled when no parsed CV', () => {
    render(<CoverLetterSection {...defaultProps} hasParsedCv={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled when no JD analysis', () => {
    render(<CoverLetterSection {...defaultProps} hasJdAnalysis={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is enabled when Pro + CV + JD all available', () => {
    render(<CoverLetterSection {...defaultProps} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls onGenerated after successful fetch', async () => {
    const onGenerated = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', content: 'Dear...' }),
    });

    render(<CoverLetterSection {...defaultProps} onGenerated={onGenerated} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(onGenerated).toHaveBeenCalled();
    });
  });

  it('shows error on 403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Pro required' }),
    });

    render(<CoverLetterSection {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Pro plan required')).toBeDefined();
    });
  });
});

describe('CoverLetterViewer', () => {
  const mockContent =
    'I am excited to apply for the Senior Engineer position at Acme Corp.\n\nWith 5 years of experience...';

  it('renders content text', () => {
    render(<CoverLetterViewer content={mockContent} tone="formal" />);
    expect(
      screen.getByText(/I am excited to apply/),
    ).toBeDefined();
  });

  it('renders tone badge', () => {
    render(<CoverLetterViewer content={mockContent} tone="technical" />);
    expect(screen.getByText('technical')).toBeDefined();
  });

  it('renders copy button', () => {
    render(<CoverLetterViewer content={mockContent} tone="formal" />);
    expect(screen.getByText('Copy')).toBeDefined();
  });

  it('copies to clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CoverLetterViewer content={mockContent} tone="formal" />);
    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(mockContent);
      expect(screen.getByText('Copied')).toBeDefined();
    });
  });
});
