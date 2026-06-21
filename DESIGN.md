# LinkFlow — DESIGN.md

## Visual Theme
**"Warm Dark"** — Deep, rich dark background with vibrant coral-orange primary. Editorial contrast meets app precision.

## Color Palette (OKLCH)

### Base
- `--bg`: oklch(0.04 0.005 30) — #07050a
- `--bgSecondary`: oklch(0.06 0.008 30) — #0c0a14
- `--bgCard`: oklch(0.09 0.012 30) — #120f1e
- `--bgHover`: oklch(0.13 0.018 30) — #1a1630
- `--bgInverse`: oklch(0.95 0.01 80) — #f0ede6 (for light sections)

### Primary (Coral/Orange)
- `--primary`: oklch(0.65 0.18 35) — #ff6b35
- `--primaryForeground`: oklch(0.04 0.005 30) — #07050a
- `--primaryDim`: oklch(0.65 0.18 35 / 0.15)
- `--primaryGlow`: oklch(0.65 0.18 35 / 0.08)

### Accent (Purple)
- `--accent`: oklch(0.55 0.2 285) — #7c3aed
- `--accentDim`: oklch(0.55 0.2 285 / 0.15)

### Text
- `--textPrimary`: oklch(0.97 0.003 30) — #fcfcfc
- `--textSecondary`: oklch(0.65 0.015 285) — #a0a0b8
- `--textMuted`: oklch(0.45 0.01 285) — #6b6b80

### Border
- `--border`: oklch(0.65 0.18 35 / 0.12)
- `--borderHover`: oklch(0.65 0.18 35 / 0.35)

### Gradients
- `--gradientPrimary`: linear-gradient(135deg, #ff6b35, #f72585)
- `--gradientSubtle`: linear-gradient(135deg, rgba(255,107,53,0.08), rgba(247,37,133,0.05))
- `--gradientCard`: linear-gradient(180deg, rgba(255,107,53,0.03) 0%, transparent 60%)

## Typography

### Headings
- Family: "Instrument Serif", Georgia, serif (for editorial warmth)
- Weights: 400, 600
- Sizes: clamp(2.5rem, 5vw, 5rem) for hero, step down by ratio 1.25

### Body
- Family: "Inter Variable", system-ui, sans-serif
- Weights: 400 (regular), 500 (medium), 600 (semibold)
- Base size: 1rem / 1.6 line-height
- Max line length: 65ch

### Monospace
- Family: "JetBrains Mono", monospace
- For code, data, stats

## Spacing Scale
- `--space-xs`: 0.25rem
- `--space-sm`: 0.5rem
- `--space-md`: 1rem
- `--space-lg`: 2rem
- `--space-xl`: 4rem
- `--space-2xl`: 8rem

## Border Radius
- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-full`: 9999px

## Motion

### Easing (Emil Kowalski standard)
- `--ease-out`: cubic-bezier(0.23, 1, 0.32, 1)
- `--ease-in-out`: cubic-bezier(0.77, 0, 0.175, 1)
- `--ease-spring`: cubic-bezier(0.34, 1.56, 0.64, 1)

### Duration
- Micro-interaction: 150ms
- UI transition: 250ms
- Modal/drawer: 400ms
- Page reveal: 700ms
- Stagger gap: 60ms

## Design Principles
1. **Radical simplicity** — remove before adding
2. **Content hierarchy** — size = importance
3. **Intentional color** — primary only where it matters
4. **Motion that explains** — direction, origin, purpose
5. **Dark ≠ flat** — depth through layers, not effects
