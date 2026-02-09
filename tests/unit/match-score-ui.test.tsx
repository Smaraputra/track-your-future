import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Sparkles: () => <span data-testid="sparkles" />,
  Pencil: () => <span data-testid="pencil" />,
  Trash2: () => <span data-testid="trash" />,
  ExternalLink: () => <span data-testid="external-link" />,
  Lock: () => <span data-testid="lock" />,
  XIcon: () => <span data-testid="x-icon" />,
}));

import { MatchScoreButton } from '@/components/applications/match-score-button';
import { MatchScoreViewer } from '@/components/applications/match-score-viewer';

describe('MatchScoreButton', () => {
  const defaultProps = {
    applicationId: 'app-1',
    hasScore: false,
    hasParsedCv: true,
    hasJdAnalysis: true,
    onScored: vi.fn(),
  };

  it('renders "Score Match" when no score exists', () => {
    render(<MatchScoreButton {...defaultProps} />);
    expect(screen.getByText('Score Match')).toBeDefined();
  });

  it('renders "Re-score" when score exists', () => {
    render(<MatchScoreButton {...defaultProps} hasScore />);
    expect(screen.getByText('Re-score')).toBeDefined();
  });

  it('is disabled when no parsed CV', () => {
    render(<MatchScoreButton {...defaultProps} hasParsedCv={false} />);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled when no JD analysis', () => {
    render(<MatchScoreButton {...defaultProps} hasJdAnalysis={false} />);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('is enabled when both CV and JD exist', () => {
    render(<MatchScoreButton {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls onScored after successful fetch', async () => {
    const onScored = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '1', score: '85.00' }),
    });

    render(<MatchScoreButton {...defaultProps} onScored={onScored} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onScored).toHaveBeenCalled();
    });
  });

  it('shows error on 429', async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Limit reached' }),
    });

    render(<MatchScoreButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

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

    render(<MatchScoreButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('No parsed CV found')).toBeDefined();
    });
  });
});

describe('MatchScoreViewer', () => {
  const sampleData = {
    overallScore: 78,
    skillsMatch: 85,
    experienceMatch: 72,
    educationMatch: 60,
    keywordCoverage: 80,
    strengths: ['Strong TypeScript skills', '5 years React experience'],
    weaknesses: ['No AWS experience'],
    suggestions: ['Add AWS certifications', 'Highlight cloud experience'],
  };

  it('renders the overall score', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('78')).toBeDefined();
    expect(screen.getByText('/ 100')).toBeDefined();
  });

  it('renders score bars for all dimensions', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('Skills')).toBeDefined();
    expect(screen.getByText('Experience')).toBeDefined();
    expect(screen.getByText('Education')).toBeDefined();
    expect(screen.getByText('Keywords')).toBeDefined();
  });

  it('renders percentage values', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('85%')).toBeDefined();
    expect(screen.getByText('72%')).toBeDefined();
    expect(screen.getByText('60%')).toBeDefined();
    expect(screen.getByText('80%')).toBeDefined();
  });

  it('renders strengths section', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('Strengths')).toBeDefined();
    expect(screen.getByText('Strong TypeScript skills')).toBeDefined();
    expect(screen.getByText('5 years React experience')).toBeDefined();
  });

  it('renders gaps section', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('Gaps')).toBeDefined();
    expect(screen.getByText('No AWS experience')).toBeDefined();
  });

  it('renders suggestions section', () => {
    render(<MatchScoreViewer data={sampleData} />);
    expect(screen.getByText('Suggestions')).toBeDefined();
    expect(screen.getByText('Add AWS certifications')).toBeDefined();
    expect(screen.getByText('Highlight cloud experience')).toBeDefined();
  });

  it('hides sections when arrays are empty', () => {
    render(
      <MatchScoreViewer
        data={{
          ...sampleData,
          strengths: [],
          weaknesses: [],
          suggestions: [],
        }}
      />,
    );
    expect(screen.queryByText('Strengths')).toBeNull();
    expect(screen.queryByText('Gaps')).toBeNull();
    expect(screen.queryByText('Suggestions')).toBeNull();
  });
});
