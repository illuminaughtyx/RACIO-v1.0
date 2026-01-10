# RACIO Brand Guidelines

## Brand Identity

**Product Name:** RACIO  
**Logo Form:** [RACIO]  
**Short Form / Favicon:** [R]

---

## Logo Rules (NEVER BREAK)

### Primary Logo
```
[RACIO]
```
- Uppercase only
- Square brackets included
- Monospace font
- Black or white only

### Favicon / Icon
```
[R]
```
- Square brackets included
- Centered in square
- Black background, white text (default)
- White background, black text (light variant)

---

## Typography

| Property | Value |
|----------|-------|
| **Font Family** | System monospace stack |
| **Fallbacks** | ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace |
| **Weight** | 700 (Bold) |
| **Style** | Normal (no italic) |

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Black** | #000000 | Text on light backgrounds |
| **White** | #FFFFFF | Text on dark backgrounds |

**No other colors in the logo. Ever.**

---

## Asset Files

### Favicons
| File | Size | Usage |
|------|------|-------|
| `favicon.svg` | 32×32 | Browser tab, standard |
| `favicon-16.svg` | 16×16 | Small browser tab |
| `apple-touch-icon.svg` | 180×180 | iOS home screen |

### Logos
| File | Background | Usage |
|------|------------|-------|
| `logo-dark.svg` | Dark/Black | White text logo |
| `logo-light.svg` | Light/White | Black text logo |

---

## Usage Examples

### ✅ Correct
- `[RACIO]` in header
- `[R]` as favicon
- Black text on white
- White text on black

### ❌ Incorrect
- `RACIO` without brackets
- `[racio]` lowercase
- Colored text
- Gradients or shadows
- Icons or illustrations
- Mixed bracket styles

---

## Placement

### Web Header
```
┌─────────────────────────────────────────────┐
│ [RACIO]              Features  Pricing  ☀️  │
└─────────────────────────────────────────────┘
```
Position: Top-left, 16px padding

### Mobile Header
```
┌─────────────────────────────────┐
│ [RACIO]    Features  Pricing   │
└─────────────────────────────────┘
```
Position: Top-left, 12px padding, never wrap

### Browser Tab
```
[R] RACIO — The Ratio Engine
```

### Stripe Checkout
```
[R] Pay with RACIO
```

---

## Design Philosophy

- **Technical:** Looks like a developer tool
- **Fast:** Sharp, minimal, no decorations
- **System-level:** Command-line aesthetic
- **Flat:** No 3D, no shadows
- **Modern:** SaaS/startup ready

---

## File Locations

```
public/
├── favicon.svg          # 32×32 favicon
├── favicon-16.svg       # 16×16 favicon
├── apple-touch-icon.svg # 180×180 iOS icon
├── logo-dark.svg        # White [RACIO] for dark bg
└── logo-light.svg       # Black [RACIO] for light bg
```

---

**Version:** 1.0  
**Last Updated:** January 11, 2026
