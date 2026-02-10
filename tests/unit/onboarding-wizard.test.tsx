import { render, screen, fireEvent } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Loader2: (props: Record<string, unknown>) => (
    <svg data-testid="icon-loader" {...props} />
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('OnboardingWizard', () => {
  it('renders step 1 (name) by default', () => {
    render(<OnboardingWizard initialName="John" initialEmail="john@example.com" />);

    expect(screen.getByText('Welcome')).toBeDefined();
    expect(screen.getByText(/john@example.com/)).toBeDefined();
  });

  it('prefills name from props', () => {
    render(<OnboardingWizard initialName="John Doe" initialEmail="john@example.com" />);

    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeDefined();
  });

  it('navigates to step 2 (role) on Next', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('First Role')).toBeDefined();
  });

  it('navigates to step 3 (CV) from step 2', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next')); // step 1 -> 2
    fireEvent.click(screen.getByText('Skip')); // step 2 -> 3 (no role name)
    expect(screen.getByText('Upload CV')).toBeDefined();
  });

  it('navigates to step 4 (summary) from step 3', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByText('Skip'));
    expect(screen.getByText('Ready to Launch')).toBeDefined();
  });

  it('can go back from step 2 to step 1', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('First Role')).toBeDefined();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Welcome')).toBeDefined();
  });

  it('shows role name in summary', () => {
    render(<OnboardingWizard initialName="Jane" initialEmail="jane@test.com" />);

    // Step 1 -> 2
    fireEvent.click(screen.getByText('Next'));

    // Enter role name
    const input = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(input, { target: { value: 'Backend Engineer' } });

    // Step 2 -> 3 -> 4
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Skip'));

    expect(screen.getByText('Backend Engineer')).toBeDefined();
  });

  it('shows "Skipped" for empty role in summary', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByText('Skip'));

    expect(screen.getByText('Skipped')).toBeDefined();
  });

  it('shows Initialize Dashboard button in summary', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByText('Skip'));

    expect(screen.getByText('Initialize Dashboard')).toBeDefined();
  });

  it('renders progress indicators', () => {
    const { container } = render(
      <OnboardingWizard initialName="" initialEmail="test@test.com" />,
    );

    // Should have 4 step indicators
    const indicators = container.querySelectorAll('.rounded-full.flex');
    expect(indicators.length).toBe(4);
  });

  it('renders color picker in role step', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));

    // Should have color buttons
    const colorButtons = screen.getAllByRole('button', { name: /Select color/ });
    expect(colorButtons.length).toBe(8);
  });

  it('updates role color on click', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));

    const blueButton = screen.getByLabelText('Select color #3b82f6');
    fireEvent.click(blueButton);

    // Blue button should now be selected (scaled)
    expect(blueButton.className).toContain('scale-110');
  });

  it('shows "Next" instead of "Skip" when role name is provided', () => {
    render(<OnboardingWizard initialName="" initialEmail="test@test.com" />);

    fireEvent.click(screen.getByText('Next'));

    const input = screen.getByPlaceholderText('e.g. Frontend Developer');
    fireEvent.change(input, { target: { value: 'Test Role' } });

    // Button should now say "Next" instead of "Skip"
    expect(screen.getByText('Next')).toBeDefined();
    expect(screen.queryByText('Skip')).toBeNull();
  });
});
