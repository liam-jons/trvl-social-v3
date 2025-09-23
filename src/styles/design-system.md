# TRVL Social Design System

## Overview

This document outlines the comprehensive design system for TRVL Social, including design tokens, component standards, and usage guidelines. The design system ensures visual consistency, accessibility, and maintainability across the application.

## Design Tokens

All design tokens are implemented as CSS custom properties in `/src/index.css` and should be used instead of hardcoded values.

### Color System

#### Brand Colors
- **Primary:** Blue scale (50-950) - Main brand color for primary actions
- **Secondary:** Gray scale (50-950) - Secondary content and subtle UI elements
- **Accent:** Amber scale (50-900) - Highlighting and call-to-action elements

#### Semantic Colors
- **Success:** Green scale (50-900) - Success states and positive feedback
- **Warning:** Yellow scale (50-900) - Warning states and caution messages
- **Error:** Red scale (50-900) - Error states and destructive actions
- **Info:** Blue scale (50-900) - Informational messages and tips

#### Surface Colors
- `--color-surface-base`: Base background color
- `--color-surface-raised`: Elevated surface color
- `--color-surface-overlay`: Modal/overlay backgrounds
- `--color-surface-inverse`: Inverted surface for contrast

#### Text Colors
- `--color-text-primary`: Main text color
- `--color-text-secondary`: Secondary text color
- `--color-text-tertiary`: Tertiary/muted text color
- `--color-text-inverse`: Text on dark backgrounds
- `--color-text-placeholder`: Placeholder text color

#### Border Colors
- `--color-border-base`: Default border color
- `--color-border-strong`: Emphasized borders
- `--color-border-inverse`: Borders on dark backgrounds

### Usage Guidelines
```css
/* ✅ Correct: Use design tokens */
.button {
  background-color: rgb(var(--color-primary-500));
  border: 1px solid rgb(var(--color-border-base));
}

/* ❌ Incorrect: Hardcoded values */
.button {
  background-color: #0ea5e9;
  border: 1px solid #e5e7eb;
}
```

### Spacing System

Based on an 8px grid system for consistent spatial relationships.

#### Spacing Scale
- `--space-0`: 0
- `--space-px`: 1px
- `--space-0-5`: 2px
- `--space-1`: 4px (0.5 grid units)
- `--space-2`: 8px (1 grid unit)
- `--space-3`: 12px (1.5 grid units)
- `--space-4`: 16px (2 grid units)
- `--space-6`: 24px (3 grid units)
- `--space-8`: 32px (4 grid units)
- `--space-12`: 48px (6 grid units)
- `--space-16`: 64px (8 grid units)
- `--space-20`: 80px (10 grid units)
- `--space-24`: 96px (12 grid units)

#### Usage Guidelines
```css
/* ✅ Correct: Use spacing tokens */
.component {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
}

/* ❌ Incorrect: Random spacing values */
.component {
  padding: 15px;
  margin-bottom: 25px;
}
```

### Typography System

#### Font Families
- `--font-family-sans`: Primary font stack (Inter-based)
- `--font-family-mono`: Monospace font stack

#### Font Sizes
- `--font-size-xs`: 12px
- `--font-size-sm`: 14px
- `--font-size-base`: 16px (default)
- `--font-size-lg`: 18px
- `--font-size-xl`: 20px
- `--font-size-2xl`: 24px
- `--font-size-3xl`: 30px
- `--font-size-4xl`: 36px
- `--font-size-5xl`: 48px
- `--font-size-6xl`: 60px

#### Font Weights
- `--font-weight-thin`: 100
- `--font-weight-light`: 300
- `--font-weight-normal`: 400 (default)
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700
- `--font-weight-extrabold`: 800
- `--font-weight-black`: 900

#### Line Heights
- `--line-height-tight`: 1.25
- `--line-height-snug`: 1.375
- `--line-height-normal`: 1.5 (default)
- `--line-height-relaxed`: 1.625
- `--line-height-loose`: 2

### Border Radius System

#### Radius Scale
- `--radius-none`: 0
- `--radius-sm`: 2px
- `--radius-base`: 4px (default)
- `--radius-md`: 6px
- `--radius-lg`: 8px
- `--radius-xl`: 12px
- `--radius-2xl`: 16px
- `--radius-3xl`: 24px
- `--radius-full`: 9999px (circular)

### Shadow System

#### Shadow Scale
- `--shadow-xs`: Subtle shadow for slight elevation
- `--shadow-sm`: Small shadow for cards
- `--shadow-base`: Default shadow for raised elements
- `--shadow-md`: Medium shadow for dropdowns
- `--shadow-lg`: Large shadow for modals
- `--shadow-xl`: Extra large shadow for major overlays
- `--shadow-2xl`: Maximum elevation shadow
- `--shadow-inner`: Inner shadow for inset elements

### Z-Index Management

#### Layering Scale
- `--z-hide`: -1 (Hidden elements)
- `--z-base`: 0 (Default layer)
- `--z-docked`: 10 (Docked elements)
- `--z-dropdown`: 100 (Dropdown menus)
- `--z-sticky`: 200 (Sticky headers)
- `--z-banner`: 300 (Notification banners)
- `--z-overlay`: 400 (Overlay backgrounds)
- `--z-modal`: 500 (Modal dialogs)
- `--z-popover`: 600 (Popovers and tooltips)
- `--z-skiplink`: 700 (Skip navigation)
- `--z-toast`: 800 (Toast notifications)
- `--z-tooltip`: 900 (Tooltips)
- `--z-max`: 2147483647 (Maximum z-index)

### Animation System

#### Duration Tokens
- `--duration-instant`: 100ms (immediate feedback)
- `--duration-fast`: 150ms (quick transitions)
- `--duration-normal`: 200ms (default)
- `--duration-moderate`: 300ms (noticeable changes)
- `--duration-slow`: 500ms (complex animations)
- `--duration-slower`: 750ms (major state changes)
- `--duration-slowest`: 1000ms (dramatic effects)

#### Easing Functions
- `--ease-linear`: linear
- `--ease-in`: cubic-bezier(0.4, 0, 1, 1)
- `--ease-out`: cubic-bezier(0, 0, 0.2, 1) (default)
- `--ease-in-out`: cubic-bezier(0.4, 0, 0.2, 1)
- `--ease-back`: cubic-bezier(0.68, -0.55, 0.265, 1.55)
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Glass Effect System

#### Glass Blur Levels
- `--glass-blur-xs`: 2px (subtle effect)
- `--glass-blur-sm`: 4px (light effect)
- `--glass-blur-md`: 12px (medium effect - default)
- `--glass-blur-lg`: 20px (strong effect)
- `--glass-blur-xl`: 40px (maximum effect)

#### Glass Opacity Levels
- `--glass-opacity-light`: 0.1 (subtle transparency)
- `--glass-opacity-medium`: 0.15 (balanced transparency)
- `--glass-opacity-heavy`: 0.2 (more prominent)

#### Glass Border Levels
- `--glass-border-light`: rgba(255, 255, 255, 0.1)
- `--glass-border-medium`: rgba(255, 255, 255, 0.2)
- `--glass-border-heavy`: rgba(255, 255, 255, 0.3)

## Component Standards

### Touch Targets

All interactive elements must meet minimum touch target requirements:

#### Touch Target Classes
- `.touch-target-sm`: 44px minimum (2.75rem)
- `.touch-target-md`: 48px minimum (3rem)
- `.touch-target-lg`: 56px minimum (3.5rem)

#### Usage Guidelines
```jsx
/* ✅ Correct: Meets accessibility standards */
<button className="touch-target-sm p-3">
  Click me
</button>

/* ❌ Incorrect: Too small for touch */
<button className="p-1">
  Click me
</button>
```

### Interactive States

#### Base Interactive Utility
```css
.interactive-base {
  transition-property: all;
  transition-duration: var(--duration-normal);
  transition-timing-function: var(--ease-out);
}
```

#### Focus States
All interactive elements should use the `.focus-ring` utility:
```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgb(var(--color-primary-500) / 0.2);
}
```

### Button Components

#### Standard Button (button.jsx)
- Uses design tokens consistently
- Implements proper touch targets
- Follows semantic color patterns
- Includes proper focus management

#### Glass Button (GlassButton.jsx)
- Extends standard button patterns
- Adds glass morphism effects
- Maintains accessibility standards
- Consistent with design token system

#### Button Variants
- `default`: Primary brand color
- `destructive`: Error/danger actions
- `outline`: Secondary actions
- `secondary`: Subtle actions
- `ghost`: Minimal visual weight
- `link`: Text-like links

#### Button Sizes
- `sm`: Small button (touch-target-sm)
- `default`: Standard button (touch-target-sm)
- `lg`: Large button (touch-target-md)
- `icon`: Square icon button (touch-target-sm)

### Card Components

#### Standard Card (card.jsx)
- Basic card structure
- Consistent padding and spacing
- Proper semantic markup

#### Glass Card (GlassCard.jsx)
- Glass morphism effects
- Configurable blur levels
- Responsive design patterns
- Accessibility considerations

#### Card Variants
- `default`: Standard glass effect
- `light`: Lighter transparency
- `dark`: Darker overlay
- `primary`: Brand color tint
- `secondary`: Secondary color tint
- `accent`: Accent color tint

## Responsive Design

### Breakpoint System

Following Tailwind CSS conventions with additional xs breakpoint:

- `xs`: 320px (extra small devices)
- `sm`: 640px (small devices)
- `md`: 768px (medium devices)
- `lg`: 1024px (large devices)
- `xl`: 1280px (extra large devices)
- `2xl`: 1536px (2x extra large devices)

### Responsive Patterns

#### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```css
/* ✅ Correct: Mobile-first responsive design */
.component {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .component {
    padding: var(--space-6);
  }
}

/* ❌ Incorrect: Desktop-first approach */
.component {
  padding: var(--space-6);
}

@media (max-width: 767px) {
  .component {
    padding: var(--space-4);
  }
}
```

#### Touch-Friendly Design
- Minimum 44px touch targets
- Adequate spacing between interactive elements
- Clear visual feedback for interactions
- Thumb-friendly navigation patterns

## Accessibility Guidelines

### Color Contrast
- Maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Use semantic colors appropriately
- Provide alternative communication methods beyond color

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order through content
- Skip links for keyboard navigation
- Proper focus trapping in modals

### Semantic HTML
- Use appropriate HTML elements for content structure
- Provide meaningful alt text for images
- Use ARIA labels and descriptions where needed
- Implement proper heading hierarchy

## Implementation Best Practices

### CSS Custom Properties Usage

#### Naming Conventions
- Use descriptive, semantic names
- Follow the `--category-property-modifier` pattern
- Group related properties together
- Maintain consistent naming across the system

#### Token Composition
```css
/* ✅ Good: Compose tokens for complex properties */
.glass-card {
  background-color: rgba(255, 255, 255, var(--glass-opacity-light));
  backdrop-filter: blur(var(--glass-blur-md));
  border: 1px solid var(--glass-border-medium);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

/* ❌ Avoid: Hardcoding values */
.glass-card {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

### Component Development

#### Consistency Checklist
- [ ] Uses design tokens instead of hardcoded values
- [ ] Implements proper touch targets
- [ ] Includes interactive states (hover, focus, active)
- [ ] Supports dark mode through CSS custom properties
- [ ] Follows semantic HTML patterns
- [ ] Includes proper ARIA attributes
- [ ] Responsive across all breakpoints
- [ ] Consistent with existing component patterns

#### Performance Considerations
- Use `transform` and `opacity` for animations
- Implement proper will-change declarations
- Optimize backdrop-filter usage
- Consider reduced motion preferences

### Dark Mode Support

All design tokens automatically support dark mode through CSS custom property overrides:

```css
:root {
  --color-surface-base: 255 255 255;
}

:root.dark {
  --color-surface-base: 17 24 39;
}
```

Components using design tokens will automatically adapt to dark mode without additional code.

## Migration Guide

### From Hardcoded Values to Design Tokens

1. **Identify hardcoded values** in your components
2. **Find corresponding design tokens** in the system
3. **Replace values** with token references
4. **Test across light and dark modes**
5. **Verify responsive behavior**

### Example Migration
```css
/* Before */
.button {
  background-color: #0ea5e9;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

/* After */
.button {
  background-color: rgb(var(--color-primary-500));
  color: rgb(var(--color-text-inverse));
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  transition: all var(--duration-normal) var(--ease-out);
}
```

## Tools and Resources

### Development Tools
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Custom Properties**: Design token implementation
- **Radix UI**: Accessible component primitives
- **Lucide React**: Consistent icon system

### Browser Support
- Modern browsers with CSS custom properties support
- Graceful degradation for backdrop-filter
- Progressive enhancement for advanced features

### Testing
- Visual regression testing for component consistency
- Accessibility testing with screen readers
- Cross-browser compatibility testing
- Performance monitoring for animation-heavy components

---

This design system documentation should be treated as a living document that evolves with the application. Regular reviews and updates ensure consistency and maintainability across the TRVL Social platform.