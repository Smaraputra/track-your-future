import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Sparkles: () => <span data-testid="sparkles" />,
  Lock: () => <span data-testid="lock" />,
  XIcon: () => <span data-testid="x-icon" />,
}));

import { InterviewPrepButton } from '@/components/applications/interview-prep-button';
import { InterviewPrepViewer } from '@/components/applications/interview-prep-viewer';
import type { InterviewPrepResult } from '@/lib/ai/schemas';

describe('InterviewPrepButton', () => {
  const defaultProps = {
    applicationId: 'app-1',
    hasPrep: false,
    hasJdAnalysis: true,
    isPro: true,
    onGenerated: vi.fn(),
  };

  it('renders Generate button', () => {
    render(<InterviewPrepButton {...defaultProps} />);
    expect(screen.getByText('Generate')).toBeDefined();
  });

  it('shows Regenerate when prep exists', () => {
    render(<InterviewPrepButton {...defaultProps} hasPrep={true} />);
    expect(screen.getByText('Regenerate')).toBeDefined();
  });

  it('is disabled when not pro', () => {
    render(<InterviewPrepButton {...defaultProps} isPro={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled when no JD analysis', () => {
    render(<InterviewPrepButton {...defaultProps} hasJdAnalysis={false} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is enabled when Pro + JD available', () => {
    render(<InterviewPrepButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls onGenerated after successful fetch', async () => {
    const onGenerated = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', result: {} }),
    });

    render(<InterviewPrepButton {...defaultProps} onGenerated={onGenerated} />);
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

    render(<InterviewPrepButton {...defaultProps} />);
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

    render(<InterviewPrepButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Monthly limit reached')).toBeDefined();
    });
  });

  it('shows error on 422', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'No JD found' }),
    });

    render(<InterviewPrepButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('No JD found')).toBeDefined();
    });
  });

  it('shows network error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('fail'));

    render(<InterviewPrepButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });
});

describe('InterviewPrepViewer', () => {
  const mockData: InterviewPrepResult = {
    categories: [
      {
        name: 'behavioral',
        questions: [
          {
            question: 'Tell me about a time you led a team.',
            starHint: 'Think about a project where you took initiative.',
            suggestedAnswer: 'In my previous role, I led a team of 5 engineers...',
          },
          {
            question: 'How do you handle conflict?',
            starHint: 'Recall a disagreement with a colleague.',
            suggestedAnswer: 'When I disagreed with a teammate about architecture...',
          },
        ],
      },
      {
        name: 'technical',
        questions: [
          {
            question: 'Explain your experience with React.',
            starHint: 'Describe a complex component you built.',
            suggestedAnswer: 'I have 4 years of React experience...',
          },
        ],
      },
      {
        name: 'situational',
        questions: [
          {
            question: 'What would you do if a deadline was at risk?',
            starHint: 'Think about prioritization and communication.',
            suggestedAnswer: 'I would first assess the critical path...',
          },
        ],
      },
    ],
  };

  it('renders category badges', () => {
    render(<InterviewPrepViewer data={mockData} />);
    expect(screen.getByText('Behavioral')).toBeDefined();
    expect(screen.getByText('Technical')).toBeDefined();
    expect(screen.getByText('Situational')).toBeDefined();
  });

  it('renders all questions', () => {
    render(<InterviewPrepViewer data={mockData} />);
    expect(screen.getByText('Tell me about a time you led a team.')).toBeDefined();
    expect(screen.getByText('How do you handle conflict?')).toBeDefined();
    expect(screen.getByText('Explain your experience with React.')).toBeDefined();
    expect(screen.getByText('What would you do if a deadline was at risk?')).toBeDefined();
  });

  it('does not show answers by default', () => {
    render(<InterviewPrepViewer data={mockData} />);
    expect(screen.queryByText(/In my previous role/)).toBeNull();
    expect(screen.queryByText(/Think about a project/)).toBeNull();
  });

  it('shows STAR hint and answer on expand', () => {
    render(<InterviewPrepViewer data={mockData} />);
    fireEvent.click(screen.getByText('Tell me about a time you led a team.'));

    expect(screen.getByText('STAR Hint')).toBeDefined();
    expect(screen.getByText('Think about a project where you took initiative.')).toBeDefined();
    expect(screen.getByText('Suggested Answer')).toBeDefined();
    expect(screen.getByText('In my previous role, I led a team of 5 engineers...')).toBeDefined();
  });

  it('collapses answer on second click', () => {
    render(<InterviewPrepViewer data={mockData} />);

    // Expand
    fireEvent.click(screen.getByText('Tell me about a time you led a team.'));
    expect(screen.getByText('In my previous role, I led a team of 5 engineers...')).toBeDefined();

    // Collapse
    fireEvent.click(screen.getByText('Tell me about a time you led a team.'));
    expect(screen.queryByText(/In my previous role/)).toBeNull();
  });

  it('can expand multiple questions independently', () => {
    render(<InterviewPrepViewer data={mockData} />);

    fireEvent.click(screen.getByText('Tell me about a time you led a team.'));
    fireEvent.click(screen.getByText('Explain your experience with React.'));

    expect(screen.getByText('In my previous role, I led a team of 5 engineers...')).toBeDefined();
    expect(screen.getByText('I have 4 years of React experience...')).toBeDefined();
  });
});
