---
name: brand-guidelines
description: Applies the “Pencil” site look and feel (neutral surfaces + warm amber/orange accents and typography) to artifacts that need consistent brand styling. Use it when brand colors/style guidelines and visual formatting matter.
license: Complete terms in LICENSE.txt
---

# Pencil Brand Styling

## Overview

Applies the “Pencil” site look and feel from your reference image: clean white layout, subtle gray surfaces and borders, and a warm amber/orange accent for primary emphasis.

**Keywords**: branding, visual identity, styling, brand colors, typography, UI polish, neutral surfaces, accent orange, code styling

## Brand Guidelines

### Colors

**Base (Neutral):**

- Background / Light: `#FFFFFF`
- Surface: `#F3F4F6` (light card panels)
- Border: `#E5E7EB` (1px dividers and outlines)
- Text (primary): `#0B1220` (near-black)
- Text (muted): `#6B7280` (secondary labels)

**Accent (Warm):**

- Primary accent (amber): `#F59E0B`
- Accent (orange): `#F97316`
- Accent (accent dark): `#B45309`

### Typography

- **Headings & UI labels**: Inter (with system fallback `system-ui, -apple-system, Segoe UI, Roboto, Arial`)
- **Body text**: Inter (same family; use regular weight + comfortable line height)
- **Code / CLI snippets**: monospace (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`)
- **Note**: Fonts should be pre-installed in your environment for best results

## Features

### Smart Font Application

- Applies Inter-like styling to headings and labels (typography hierarchy, not strict points)
- Applies monospace to code blocks and inline code
- Falls back automatically to system fonts if Inter is unavailable
- Preserves readability (>= 16px body in web artifacts)

### Visual Styling Rules

- Use the accent colors for primary CTAs, key highlights, and small iconography.
- Prefer neutral gray borders/surfaces over heavy shadows.
- Keep rounding consistent: `8px`–`16px` for cards/inputs (match the “soft card” feel).

## Technical Details

### Font Management

- Uses system-installed Inter and a monospace UI font when available
- Provides automatic fallback to system UI fonts for Inter
- Provides automatic fallback to common monospace fonts for code
- No font installation required — works with existing system fonts

### Color Application

- Uses RGB color values for precise brand matching
- Applied via python-pptx's `RGBColor` class when generating PPTX artifacts
- Maintains color fidelity across different systems
