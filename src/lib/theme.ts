export const THEMES = ['green', 'amber'] as const;

export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'amber';

export const THEME_STORAGE_KEY = 'tyf-theme';
