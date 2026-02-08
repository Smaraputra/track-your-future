# Phase 4: Design System + UI Foundation

## Retro Terminal Theme

Two selectable themes stored in `localStorage` + `data-theme` attribute on `<html>`.

### Color Palette (CSS Variables)

| Token | Value |
|-------|-------|
| `--background` | `#0a0a0a` |
| `--surface` | `#111111` |
| `--dimmed` | `#404040` |
| `--text` | `#e5e5e5` |
| `--primary` (green theme) | `#22c55e` |
| `--primary` (amber theme) | `#f59e0b` |

### Typography

- **Headings**: VT323 (Google Fonts)
- **Body/UI**: JetBrains Mono (Google Fonts)

## Tailwind Extensions

- `retro` color namespace mapped to CSS variables
- Custom keyframes: `glow`, `blink`, `scanline`
- Utility classes: `.text-shadow-glow`, `.crt-overlay`

## Components (shadcn/ui restyled)

| Component | Description |
|-----------|-------------|
| `RetroWindow` | Terminal-style window frame with title bar, minimize/close dots |
| `RetroButton` | Bordered button with glow on hover, variants: primary/secondary/ghost/destructive |
| `RetroInput` | Monospaced input with underscore cursor animation |
| `RetroSelect` | Dropdown styled as terminal selector |
| `RetroDialog` | Modal with scanline overlay backdrop |
| `RetroStatusBadge` | Application status chip with color coding |
| `CRTOverlay` | Full-screen scanline effect (optional, toggle in settings) |
| `Sidebar` | Collapsible nav with retro icons |
| `Header` | Top bar with notification bell, user menu, theme toggle |
| `UpgradeGate` | Wraps Pro features with lock icon + "Upgrade to Pro" tooltip |

## Status

- [x] CSS variables and theme system
- [x] Font loading (VT323, JetBrains Mono)
- [x] Tailwind extensions (colors, keyframes, utilities)
- [x] shadcn/ui installed and configured
- [x] RetroWindow component
- [x] RetroButton component
- [x] RetroInput component
- [x] RetroSelect component
- [x] RetroDialog component
- [x] RetroStatusBadge component
- [x] CRTOverlay component
- [x] Sidebar component
- [x] Header component
- [x] UpgradeGate component
