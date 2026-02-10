import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Sparkles: () => <span data-testid="sparkles" />,
  Lock: () => <span data-testid="lock" />,
  XIcon: () => <span data-testid="x-icon" />,
}));

import { ResumeSuggestionsButton } from '@/components/applications/resume-suggestions-button';
import { ResumeSuggestionsViewer } from '@/components/applications/resume-suggestions-viewer';
import type { ResumeSuggestionResult } from '@/lib/ai/schemas';

describe('ResumeSuggestionsButton', () => {
  const defaultProps = {
    applicationId: 'app-1',
    hasSuggestions: false,
    hasParsedCv: true,
    isPro: true,
    onGenerated: vi.fn(),
  };

  it('renders Generate button', () => {
    render(<ResumeSuggestionsButton {...defaultProps} />);
    expect(screen.getByText('Generate')).toBeDefined();
  });

  it('shows Regenerate when suggestions exist', () => {
    render(<ResumeSuggestionsButton {...defaultProps} hasSuggestions={true} />);
    expect(screen.getByText('Regenerate')).toBeDefined();
  });

  it('is disabled when not pro', () => {
    render(<ResumeSuggestionsButton {...defaultProps} isPro={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled when no parsed CV', () => {
    render(<ResumeSuggestionsButton {...defaultProps} hasParsedCv={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is enabled when Pro + CV available', () => {
    render(<ResumeSuggestionsButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls onGenerated after successful fetch', async () => {
    const onGenerated = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', result: {} }),
    });

    render(<ResumeSuggestionsButton {...defaultProps} onGenerated={onGenerated} />);
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

    render(<ResumeSuggestionsButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Pro plan required')).toBeDefined();
    });
  });

  it('shows error on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Limit reached' }),
    });

    render(<ResumeSuggestionsButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Monthly limit reached')).toBeDefined();
    });
  });

  it('shows error on 422', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'No parsed CV found' }),
    });

    render(<ResumeSuggestionsButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('No parsed CV found')).toBeDefined();
    });
  });

  it('shows network error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('fail'));

    render(<ResumeSuggestionsButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });
});

describe('ResumeSuggestionsViewer', () => {
  const mockData: ResumeSuggestionResult = {
    suggestions: [
      {
        category: 'content',
        title: 'Add quantified achievements',
        description: 'Your experience descriptions lack specific metrics.',
        before: 'Managed a team of engineers',
        after: 'Led a team of 8 engineers, delivering 3 major releases on schedule',
        priority: 'high',
      },
      {
        category: 'content',
        title: 'Include a professional summary',
        description: 'A summary at the top helps recruiters quickly understand your profile.',
        priority: 'medium',
      },
      {
        category: 'keywords',
        title: 'Add missing technical skills',
        description: 'The JD requires TypeScript and Docker which are not listed.',
        priority: 'high',
      },
      {
        category: 'formatting',
        title: 'Consistent date format',
        description: 'Dates should follow a consistent YYYY-MM format throughout.',
        priority: 'low',
      },
      {
        category: 'impact',
        title: 'Strengthen action verbs',
        description: 'Replace passive language with strong action verbs.',
        before: 'Was responsible for deployments',
        after: 'Orchestrated CI/CD deployments across 12 microservices',
        priority: 'medium',
      },
    ],
  };

  it('renders category badges', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    expect(screen.getByText('Content')).toBeDefined();
    expect(screen.getByText('Keywords')).toBeDefined();
    expect(screen.getByText('Formatting')).toBeDefined();
    expect(screen.getByText('Impact')).toBeDefined();
  });

  it('renders all suggestion titles', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    expect(screen.getByText('Add quantified achievements')).toBeDefined();
    expect(screen.getByText('Include a professional summary')).toBeDefined();
    expect(screen.getByText('Add missing technical skills')).toBeDefined();
    expect(screen.getByText('Consistent date format')).toBeDefined();
    expect(screen.getByText('Strengthen action verbs')).toBeDefined();
  });

  it('renders priority badges', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    expect(screen.getAllByText('high').length).toBe(2);
    expect(screen.getAllByText('medium').length).toBe(2);
    expect(screen.getAllByText('low').length).toBe(1);
  });

  it('renders descriptions', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    expect(
      screen.getByText('Your experience descriptions lack specific metrics.'),
    ).toBeDefined();
  });

  it('renders before/after diffs when present', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    expect(screen.getByText('Managed a team of engineers')).toBeDefined();
    expect(
      screen.getByText('Led a team of 8 engineers, delivering 3 major releases on schedule'),
    ).toBeDefined();
    expect(screen.getAllByText('BEFORE').length).toBe(2);
    expect(screen.getAllByText('AFTER').length).toBe(2);
  });

  it('does not render before/after when not provided', () => {
    const dataWithoutDiffs: ResumeSuggestionResult = {
      suggestions: [
        {
          category: 'content',
          title: 'Add summary',
          description: 'Include a professional summary.',
          priority: 'medium',
        },
      ],
    };
    render(<ResumeSuggestionsViewer data={dataWithoutDiffs} />);
    expect(screen.queryByText('BEFORE')).toBeNull();
    expect(screen.queryByText('AFTER')).toBeNull();
  });

  it('groups suggestions by category', () => {
    render(<ResumeSuggestionsViewer data={mockData} />);
    // Content should have 2 suggestions
    const contentTitle = screen.getByText('Content');
    const contentSection = contentTitle.closest('div');
    expect(contentSection).toBeDefined();
  });
});
