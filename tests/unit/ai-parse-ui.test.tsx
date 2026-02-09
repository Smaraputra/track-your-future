import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { ParseCvButton } from '@/components/documents/parse-cv-button';

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

describe('ParseCvButton', () => {
  it('shows "Parse CV" when no parsed profile', () => {
    render(
      <ParseCvButton
        documentId="doc-1"
        hasParsedProfile={false}
        onParsed={() => {}}
      />,
    );

    expect(screen.getByText('Parse CV')).toBeDefined();
  });

  it('shows "Re-parse" when profile exists', () => {
    render(
      <ParseCvButton
        documentId="doc-1"
        hasParsedProfile={true}
        onParsed={() => {}}
      />,
    );

    expect(screen.getByText('Re-parse')).toBeDefined();
  });

  it('renders sparkles icon', () => {
    render(
      <ParseCvButton
        documentId="doc-1"
        hasParsedProfile={false}
        onParsed={() => {}}
      />,
    );

    expect(screen.getByTestId('icon-sparkles')).toBeDefined();
  });

  it('button is not disabled initially', () => {
    render(
      <ParseCvButton
        documentId="doc-1"
        hasParsedProfile={false}
        onParsed={() => {}}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(false);
  });
});

describe('DocumentRow with parse support', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/components/documents/document-row.tsx'),
    'utf-8',
  );

  it('includes parsedProfileId in DocumentItem interface', () => {
    expect(source).toContain('parsedProfileId: string | null');
  });

  it('accepts onParse callback prop', () => {
    expect(source).toContain('onParse?:');
  });

  it('conditionally renders ParseCvButton for CV documents', () => {
    expect(source).toContain('isCv && onParse');
    expect(source).toContain('ParseCvButton');
  });

  it('shows Parsed badge when profile exists', () => {
    expect(source).toContain('hasParsedProfile');
    expect(source).toContain('ParsedProfileViewer');
    expect(source).toContain('Parsed');
  });
});

describe('DocumentsPageContent with parse handler', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/components/documents/documents-page-content.tsx'),
    'utf-8',
  );

  it('defines handleParsed callback', () => {
    expect(source).toContain('handleParsed');
  });

  it('passes onParse to DocumentRow', () => {
    expect(source).toContain('onParse={handleParsed}');
  });
});

describe('Documents API route (LEFT JOIN parsedProfiles)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/route.ts'),
    'utf-8',
  );

  it('LEFT JOINs parsedProfiles', () => {
    expect(source).toContain('leftJoin(parsedProfiles');
  });

  it('selects parsedProfileId', () => {
    expect(source).toContain('parsedProfileId: parsedProfiles.id');
  });
});

describe('Documents page (LEFT JOIN parsedProfiles)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/(dashboard)/documents/page.tsx'),
    'utf-8',
  );

  it('imports parsedProfiles from ai schema', () => {
    expect(source).toContain("from '@/db/schema/ai'");
  });

  it('LEFT JOINs parsedProfiles', () => {
    expect(source).toContain('leftJoin(parsedProfiles');
  });

  it('selects parsedProfileId', () => {
    expect(source).toContain('parsedProfileId: parsedProfiles.id');
  });
});
