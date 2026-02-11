import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from '@/lib/theme';

describe('Theme constants', () => {
  it('exports green and amber themes', () => {
    expect(THEMES).toEqual(['green', 'amber']);
  });

  it('defaults to amber', () => {
    expect(DEFAULT_THEME).toBe('amber');
  });

  it('has a storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('tyf-theme');
  });
});

describe('globals.css', () => {
  const css = readFileSync(
    resolve(__dirname, '../../src/app/globals.css'),
    'utf-8'
  );

  it('contains :root selector with CSS variables', () => {
    expect(css).toContain(':root');
    expect(css).toContain('--background: #0a0a0a');
    expect(css).toContain('--foreground: #e5e5e5');
    expect(css).toContain('--surface: #111111');
    expect(css).toContain('--primary: #f59e0b');
  });

  it('contains [data-theme="green"] selector', () => {
    expect(css).toContain('[data-theme="green"]');
    expect(css).toContain('--primary: #22c55e');
  });

  it('contains all required shadcn CSS variables', () => {
    const requiredVars = [
      '--secondary',
      '--muted',
      '--accent',
      '--destructive',
      '--card',
      '--popover',
      '--border',
      '--input',
      '--ring',
      '--radius',
    ];
    for (const v of requiredVars) {
      expect(css).toContain(v);
    }
  });

  it('contains @theme inline block with Tailwind mappings', () => {
    expect(css).toContain('@theme inline');
    expect(css).toContain('--color-primary: var(--primary)');
    expect(css).toContain('--font-heading:');
    expect(css).toContain('--font-body:');
  });

  it('contains keyframe animations', () => {
    expect(css).toContain('@keyframes glow');
    expect(css).toContain('@keyframes blink');
    expect(css).toContain('@keyframes scanline');
  });

  it('contains utility classes', () => {
    expect(css).toContain('.text-shadow-glow');
    expect(css).toContain('.crt-overlay');
  });

  it('imports tw-animate-css', () => {
    expect(css).toContain('tw-animate-css');
  });
});

describe('layout.tsx', () => {
  const layout = readFileSync(
    resolve(__dirname, '../../src/app/layout.tsx'),
    'utf-8'
  );

  it('imports VT323 and JetBrains_Mono', () => {
    expect(layout).toContain('VT323');
    expect(layout).toContain('JetBrains_Mono');
  });

  it('does not import Geist fonts', () => {
    expect(layout).not.toContain('Geist');
  });

  it('sets data-theme on html element', () => {
    expect(layout).toContain('data-theme="amber"');
  });

  it('has suppressHydrationWarning', () => {
    expect(layout).toContain('suppressHydrationWarning');
  });

  it('includes inline theme script', () => {
    expect(layout).toContain('dangerouslySetInnerHTML');
    expect(layout).toContain('themeScript');
  });

  it('sets correct metadata', () => {
    expect(layout).toContain('Track Your Future');
  });
});
