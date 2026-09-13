---
name: Precision Auto Ledger
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#973400'
  on-tertiary: '#ffffff'
  tertiary-container: '#c04400'
  on-tertiary-container: '#ffede7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

### Vision & Personality
This design system powers a high-trust automotive intelligence platform tailored to Pakistan's dynamic used and new car economy (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar). The product strips away the chaotic, banner-saturated look of traditional vehicle classifieds in favor of a focused, systematic interface inspired by Linear's precision, AutoTrader's transactional transparency, and Notion's dense utility.

The aesthetic communicates algorithmic authority, absolute vehicle inspection integrity, and financial clarity. It treats cars as serious financial assets rather than impulse purchases.

### Visual Aesthetic & Philosophy
- **Style Archetype:** Modern Utilitarian SaaS meets High-Density Classifieds Marketplace.
- **Design Tenets:**
  - **No Gimmicks:** Strict avoidance of generic purple/cyan "AI neon glows", faux-futuristic gradients, or exaggerated glassmorphism. Artificial intelligence features manifest as surgical UI enhancements (smart price estimators, auto-filled mechanical specs, instant visual defect tags) rather than flashy novelties.
  - **Data Precision:** Uncompromising typography and tabular data alignments optimized for complex Pakistani automotive market metadata (e.g., engine displacement in cc, local vs. imported assembly, registration city, transfer status, token tax status, and high-denomination PKR values in Crores and Lacs).
  - **Atmospheric Restraint:** Cool off-white canvas with sharp, structural 1px slate boundaries and disciplined typography, giving car photography and verified status indicators maximum focal dominance.

## Colors

The palette establishes an immediate sense of financial security and engineering discipline. High-contrast neutral slates construct the backbone of the application, paired with a commanding automotive blue primary and an intentional warm amber/orange accent strictly reserved for conversion pathways.

### Palette Architecture
- **Primary (`#2563EB` | Active `#1D4ED8`):** Deep cobalt blue representing administrative trust, algorithmic precision, verified badge states, and primary product navigation.
- **Secondary (`#0F172A`):** Obsidian slate anchor for high-priority headings, table values, active listing headers, and high-emphasis button states.
- **Tertiary / Conversion Accent (`#EA580C` | Supporting `#F59E0B`):** Warm burnished ember applied selectively to critical transaction actions: "Make Offer", "Feature Ad", "Deposit Token", and instant price alert notifications.
- **Surface & Canvas Tiers:**
  - `surface-canvas`: `#F8FAFC` (Cool off-white, reduces glare during lengthy browsing sessions)
  - `surface-card`: `#FFFFFF` (Crisp base for cards, sheets, tables, and modal dialogs)
  - `surface-subtle`: `#F1F5F9` (Nested containers, table row hovers, input backgrounds)
  - `surface-border`: `#E2E8F0` (Default hairline separation lines)
  - `surface-border-strong`: `#CBD5E1` (Input borders, selected card perimeters, column rules)

### Status & Lifecycle Token Mapping
Every car listing operates within a strict state machine with dedicated semantic tokens:
- **`active` & `paid`:** `#059669` (Emerald 600) with `#ECFDF5` background.
- **`pending_payment`:** `#D97706` (Amber 600) with `#FFFBEB` background.
- **`pending_moderation`:** `#2563EB` (Blue 600) with `#EFF6FF` background.
- **`unpaid` & `paused`:** `#475569` (Slate 600) with `#F1F5F9` background.
- **`sold`:** `#4F46E5` (Indigo 600) with `#EEF2FF` background.
- **`rejected` & `suspended_blocked`:** `#E11D48` (Rose 600) with `#FFF1F2` background.

## Typography

Typography establishes clear visual hierarchy between technical machine-evaluated specifications and commercial vehicle titles.

### Hierarchy & Pairing Strategy
- **Display & Section Headings (`Plus Jakarta Sans`):** Selected for its crisp geometric authority, wide apertures, and balanced x-height. Gives car makes, models, and dashboard totals a high-end editorial feel without feeling playful.
- **Product UI, Forms, and Data Tables (`Inter`):** Selected for industry-standard legibility in dense multi-column tables, micro-labels, and filtering criteria. 
- **Tabular Numerics:** All currency figures (`PKR 4,850,000` or `PKR 1.25 Crore`), mileage counters (`34,200 km`), chassis numbers, and VIN tags must render with `font-feature-settings: "tnum" 1` to ensure vertical alignment in listing tables and breakdown sheets.
- **Micro-Labels (`label-sm`):** Styled in uppercase with `0.02em` tracking when identifying vehicle attributes (e.g., `VARIANTS`, `TRANSMISSION`, `TAX STATUS`, `CITY`).

## Layout & Spacing

The system enforces a baseline 4px grid rhythm. Density is calibrated to permit dense inventory inspection while preventing visual fatigue.

### Grid Systems
- **Desktop (1280px and above):** 12-column layout conforming to a maximum content width of `1440px`. Column gutter is set to `1.5rem` (`24px`), with outer section margins of `2rem` (`32px`).
- **Tablet (768px – 1279px):** 8-column layout with `1rem` (`16px`) gutters and `1.5rem` (`24px`) margins. Sidebar filters collapse into an off-canvas drawer.
- **Mobile (320px – 767px):** 4-column layout with `0.75rem` (`12px`) gutters and `1rem` (`16px`) horizontal canvas padding.

### Information Architecture Rhythm
- **Listing Matrix:** Desktop car search results use a 3-column configuration (`col-span-4`), collapsing to 2 columns on tablet, and single-column horizontal cards on mobile.
- **Dealer & Admin Portals:** Data tables run across full 12-column frames with compressed vertical padding (`0.5rem` / `space-sm` on table cells) for high density.

## Elevation & Depth

This system avoids heavy drop shadows and fuzzy layering. It relies on architectural low-contrast borders combined with ultra-diffused, cool-tinted ambient shadows to construct a crisp physical plane.

### Elevation Levels
- **Level 0 (Flat Ground):** Canvas background (`#F8FAFC`). No shadow. Borderless or separated strictly by structural rules (`1px solid #E2E8F0`).
- **Level 1 (Cards, Specs, Filters):** Background `#FFFFFF`, 1px perimeter border `rgba(15, 23, 42, 0.08)`, ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hovered Listing Cards, Active Drawers, Sticky Toolbars):** Background `#FFFFFF`, border `rgba(15, 23, 42, 0.12)`, shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Level 3 (Modals, AI Inspection Deep-Dives, City Selectors):** Background `#FFFFFF`, shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)`. Backdropped by an obsidian scrim with heavy slate tint: `rgba(15, 23, 42, 0.6)`.

### Border Integrity
Every container (card, pill, button, chip) preserves structural definition through a hairline 1px border. Depth is never communicated by blurred shadow alone; edges must remain razor-sharp.

## Shapes

The design system employs a restrained **Soft (`1`)** shape geometry.

### Radius Distribution
- **Base UI Elements (`0.25rem` / `4px`):** Status indicators, technical specs labels, small tooltips, table checkboxes, and inner segment toggles.
- **Medium Components (`0.375rem` / `6px`):** Form input fields, buttons, dropdown triggers, and filter chips.
- **Large Surfaces (`0.5rem` / `8px`):** Vehicle listing cards, modal containers, image gallery thumbnails, and inspection checklist panels.
- **Pill Caps (`9999px`):** Strictly restricted to dynamic status badges (e.g., `ACTIVE`, `PENDING MODERATION`, `SOLD`) and active verification chips. Vehicle images never use pill clipping.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, border `1px solid #1D4ED8`, height `40px` (desktop) / `44px` (touch targets). Hover: `#1D4ED8`. Active: `#1E40AF`.
- **Accent CTA ("Instant Buy" / "Make Offer"):** Background `#EA580C`, text `#FFFFFF`, border `1px solid #C2410C`. Hover: `#C2410C`.
- **Secondary (Data Actions):** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`. Hover: `#F1F5F9`, border `#CBD5E1`.
- **Ghost (Inline Table Actions):** Background transparent, text `#64748B`, hover text `#0F172A`, hover background `#F1F5F9`.

### Status Badges
Constructed using an inner 6px solid circular pulse indicator paired with a uppercase tracking micro-label (`11px`, weight `600`).
- Border: `1px solid` matching 20% border opacity of the status color.
- Height: `22px`, padding: `0 8px`.
- Combinations:
  - `active` / `paid`: Background `#ECFDF5`, text `#065F46`, dot `#059669`.
  - `pending_payment`: Background `#FFFBEB`, text `#92400E`, dot `#D97706`.
  - `pending_moderation`: Background `#EFF6FF`, text `#1E40AF`, dot `#2563EB`.
  - `unpaid` / `paused`: Background `#F1F5F9`, text `#334155`, dot `#64748B`.
  - `sold`: Background `#EEF2FF`, text `#3730A3`, dot `#4F46E5`.
  - `rejected` / `suspended`: Background `#FFF1F2`, text `#9F1239`, dot `#E11D48`.

### Input Fields & City Filters
- Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `6px`, text `#0F172A`, placeholder `#94A3B8`.
- Focus state: Border `#2563EB`, subtle ring `0 0 0 3px rgba(37, 99, 235, 0.12)`.
- City Quick-Select: Tab-style segmented switch with options for "Karachi", "Lahore", "Islamabad", "All Pakistan". Active tab features `#FFFFFF` background with 1px border and subtle Level 1 elevation over a `#F1F5F9` tray.

### Cards & Vehicle Listing Tiles
- Structural container with `0.5rem` radius, `1px solid #E2E8F0`, `#FFFFFF` surface.
- Top section: 16:10 photography viewport with AI-assisted defect tag overlays floating top-left (e.g., `9.2/10 Bumper Condition`) and city tag top-right (`Lahore, DHA Phase 5`).
- Bottom section: Vehicle model heading (`Plus Jakarta Sans`), followed by a 3-column micro-spec row (Year | Mileage | Fuel Type) separated by 1px vertical borders, concluding with bold PKR pricing in `headline-sm` tabular numbers.

### AI Inspection Scorecard (Product Specific)
- Dense, tabular diagnostic card displaying machine-checked vehicle parameters (Engine Health, Transmission, Body/Paint, Suspension).
- Displays a prominent numeric badge (e.g., `94/100`) accompanied by a subtle monochrome meter bar and natural-language prompt: `"AI verified: Zero repainted panels detected."`