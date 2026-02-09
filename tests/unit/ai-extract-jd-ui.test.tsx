import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { ExtractJdButton } from '@/components/applications/extract-jd-button';
import { JdAnalysisViewer } from '@/components/applications/jd-analysis-viewer';

const ROOT = resolve(__dirname, '../..');

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Sparkles: (props: Record<string, unknown>) => (
    <svg data-testid="icon-sparkles" {...props} />
  ),
  Loader2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-loader" {...props} />
  ),
}));

describe('ExtractJdButton', () => {
  it('shows "Extract JD" when no analysis exists', () => {
    render(
      <ExtractJdButton
        applicationId="app-1"
        jobUrl="https://example.com/job"
        hasAnalysis={false}
        onExtracted={() => {}}
      />,
    );
    expect(screen.getByText('Extract JD')).toBeDefined();
  });

  it('shows "Re-extract JD" when analysis exists', () => {
    render(
      <ExtractJdButton
        applicationId="app-1"
        jobUrl="https://example.com/job"
        hasAnalysis={true}
        onExtracted={() => {}}
      />,
    );
    expect(screen.getByText('Re-extract JD')).toBeDefined();
  });

  it('renders sparkles icon', () => {
    render(
      <ExtractJdButton
        applicationId="app-1"
        jobUrl="https://example.com/job"
        hasAnalysis={false}
        onExtracted={() => {}}
      />,
    );
    expect(screen.getByTestId('icon-sparkles')).toBeDefined();
  });

  it('button is not disabled initially', () => {
    render(
      <ExtractJdButton
        applicationId="app-1"
        jobUrl="https://example.com/job"
        hasAnalysis={false}
        onExtracted={() => {}}
      />,
    );
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(false);
  });
});

describe('JdAnalysisViewer', () => {
  const fullData = {
    companyName: 'Acme Corp',
    jobTitle: 'Senior Engineer',
    location: 'San Francisco, CA',
    locationType: 'hybrid' as const,
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: 'USD',
    requiredSkills: ['TypeScript', 'React'],
    preferredSkills: ['GraphQL'],
    experienceYears: 5,
    educationRequired: "Bachelor's in CS",
    responsibilities: ['Lead team', 'Code reviews'],
    benefits: ['401k', 'Health insurance'],
  };

  it('renders job title', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('Senior Engineer')).toBeDefined();
  });

  it('renders company name', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('Acme Corp')).toBeDefined();
  });

  it('renders location', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('San Francisco, CA')).toBeDefined();
  });

  it('renders required skills', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('TypeScript')).toBeDefined();
    expect(screen.getByText('React')).toBeDefined();
  });

  it('renders preferred skills', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('GraphQL')).toBeDefined();
  });

  it('renders salary range', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText(/150,000/)).toBeDefined();
    expect(screen.getByText(/200,000/)).toBeDefined();
  });

  it('renders experience years', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText(/5\+ years/)).toBeDefined();
  });

  it('renders responsibilities', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('Lead team')).toBeDefined();
    expect(screen.getByText('Code reviews')).toBeDefined();
  });

  it('renders benefits', () => {
    render(<JdAnalysisViewer data={fullData} />);
    expect(screen.getByText('401k')).toBeDefined();
    expect(screen.getByText('Health insurance')).toBeDefined();
  });

  it('renders minimal data without errors', () => {
    render(
      <JdAnalysisViewer
        data={{ requiredSkills: [], preferredSkills: [] }}
      />,
    );
    // Should render without crashing, no sections visible
    expect(screen.queryByText('Overview')).toBeNull();
    expect(screen.queryByText('Skills')).toBeNull();
  });
});

describe('ApplicationDetail JD section', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/components/applications/application-detail.tsx'),
    'utf-8',
  );

  it('imports ExtractJdButton', () => {
    expect(source).toContain("from './extract-jd-button'");
  });

  it('imports JdAnalysisViewer', () => {
    expect(source).toContain("from './jd-analysis-viewer'");
  });

  it('accepts jobAnalysis prop', () => {
    expect(source).toContain('jobAnalysis:');
    expect(source).toContain('JobAnalysisData | null');
  });

  it('renders Job Description heading', () => {
    expect(source).toContain('Job Description');
  });

  it('shows extract prompt when no analysis and URL exists', () => {
    expect(source).toContain('Extract JD');
    expect(source).toContain('analyze the job posting');
  });

  it('shows message when no URL', () => {
    expect(source).toContain('Add a job URL to enable JD extraction');
  });

  it('refreshes job analysis after extraction', () => {
    expect(source).toContain('refreshJobAnalysis');
    expect(source).toContain('/api/ai/extract-jd/');
  });
});
