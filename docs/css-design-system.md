# CSS Design System Documentation

## Overview

This document describes the responsive CSS design system implemented for the walk-up music manager application. The system uses modern CSS viewport units, flexible layouts, and logical properties to create a truly responsive experience without relying on media queries.

## Core Principles

### 1. Viewport-First Responsive Design
- Uses CSS viewport units (vh, vw, vmin, vmax) and newer dynamic viewport units (dvh, dvw)
- Creates truly responsive layouts that adapt fluidly to any screen size
- Eliminates the need for complex media query breakpoints

### 2. Touch-Friendly Design
- Ensures minimum 44px touch targets using `max()` function
- Uses `8vmin` as a responsive minimum to scale with viewport
- Provides adequate spacing for mobile interactions

### 3. Accessible Design
- Maintains proper color contrast ratios
- Provides focus indicators and screen reader utilities
- Uses logical properties for better internationalization support

### 4. Performance-Optimized
- Uses CSS custom properties for consistent theming
- Leverages CSS functions (clamp, min, max) for calculations
- Minimizes JavaScript dependency for responsive behavior

## CSS Custom Properties

### Viewport Units
```css
/* Dynamic viewport units with fallbacks */
--vh-dynamic: 100vh; /* Fallback */
--vh-dynamic: 100dvh; /* Dynamic viewport height */

--vw-dynamic: 100vw; /* Fallback */
--vw-dynamic: 100dvw; /* Dynamic viewport width */
```

### Spacing Scale
```css
/* Viewport-relative spacing using vmin for consistent scaling */
--spacing-xs: 1vmin;   /* ~7.68px on 768px screen */
--spacing-sm: 2vmin;   /* ~15.36px on 768px screen */
--spacing-md: 3vmin;   /* ~23.04px on 768px screen */
--spacing-lg: 4vmin;   /* ~30.72px on 768px screen */
--spacing-xl: 6vmin;   /* ~46.08px on 768px screen */
--spacing-xxl: 8vmin;  /* ~61.44px on 768px screen */
```

### Typography Scale
```css
/* Fluid typography using clamp() */
--font-size-xs: clamp(0.75rem, 1.5vmin, 0.875rem);
--font-size-sm: clamp(0.875rem, 2vmin, 1rem);
--font-size-md: clamp(1rem, 2.5vmin, 1.125rem);
--font-size-lg: clamp(1.125rem, 3vmin, 1.25rem);
--font-size-xl: clamp(1.25rem, 4vmin, 1.5rem);
--font-size-xxl: clamp(1.5rem, 5vmin, 2rem);
```

### Touch Targets
```css
/* Touch-friendly minimum sizes */
--touch-target-min: max(44px, 8vmin);
--button-height: var(--touch-target-min);
--input-height: var(--touch-target-min);
```

### Container Widths
```css
/* Responsive container widths using min() */
--container-xs: min(90vw, 320px);
--container-sm: min(90vw, 400px);
--container-md: min(90vw, 600px);
--container-lg: min(90vw, 800px);
--container-xl: min(90vw, 1200px);
--container-full: min(95vw, 1400px);
```

## Layout Utilities

### Flexbox System
```css
/* Basic flex container */
.layout-flex {
  display: flex;
  gap: var(--spacing-md);
}

/* Direction modifiers */
.layout-flex--column { flex-direction: column; }
.layout-flex--row { flex-direction: row; }

/* Alignment modifiers */
.layout-flex--center {
  align-items: center;
  justify-content: center;
}

.layout-flex--between { justify-content: space-between; }
.layout-flex--around { justify-content: space-around; }
```

### CSS Grid System
```css
/* Basic grid container */
.layout-grid {
  display: grid;
  gap: var(--spacing-md);
}

/* Responsive grid variants */
.layout-grid--responsive {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 45vw), 1fr));
}

.layout-grid--2col {
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 48vw), 1fr));
}
```

### Container System
```css
/* Base container */
.container {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--spacing-md);
}

/* Size variants */
.container--sm { max-width: var(--container-sm); }
.container--md { max-width: var(--container-md); }
.container--lg { max-width: var(--container-lg); }
```

## Form System

### Input Styling
```css
.input {
  height: var(--input-height);
  padding-inline: var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  background: var(--color-input-bg);
  color: var(--color-text);
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}
```

### Form Layouts
```css
/* Vertical form group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-block-end: var(--spacing-md);
}

/* Responsive form row */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 40vw), 1fr));
  gap: var(--spacing-md);
}
```

## Button System

### Base Button
```css
.button {
  height: var(--button-height);
  padding-inline: var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-width: var(--touch-target-min);
}
```

### Button Variants
```css
.button--primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.button--secondary {
  background: var(--color-secondary);
  color: var(--color-secondary-text);
  border: 1px solid var(--color-border);
}

.button--danger {
  background: var(--color-danger);
  color: var(--color-danger-text);
}
```

### Button Sizes
```css
.button--small {
  height: calc(var(--button-height) * 0.8);
  font-size: var(--font-size-sm);
}

.button--large {
  height: calc(var(--button-height) * 1.2);
  font-size: var(--font-size-lg);
}
```

## Modal System

### Modal Structure
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--vw-dynamic);
  height: var(--vh-dynamic);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: var(--container-md);
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### Modal Sections
```css
.modal-header {
  flex: 0 0 auto;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.modal-content {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: var(--spacing-md);
  min-height: 0;
}

.modal-actions {
  flex: 0 0 auto;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
```

## Logical Properties

The design system uses CSS logical properties for better internationalization support:

```css
/* Instead of left/right, use inline */
padding-inline: var(--spacing-md);
margin-inline: auto;

/* Instead of top/bottom, use block */
padding-block: var(--spacing-sm);
margin-block-end: var(--spacing-md);

/* Text alignment */
text-align: start; /* Instead of left */
text-align: end;   /* Instead of right */
```

## Container Queries

For components that need to adapt to their container size:

```css
.responsive-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Fallback for browsers without container query support */
@supports not (container-type: inline-size) {
  .responsive-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(200px, 45vw), 1fr));
  }
}
```

## Accessibility Features

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Focus Indicators
```css
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Usage Examples

### Creating a Responsive Card
```html
<div class="container container--md">
  <div class="layout-grid layout-grid--responsive space-lg">
    <div class="card p-md">
      <h2 class="text-lg text-semibold">Card Title</h2>
      <p class="text-md text-muted">Card content</p>
      <div class="button-group button-group--end">
        <button class="button button--secondary">Cancel</button>
        <button class="button button--primary">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

### Creating a Responsive Form
```html
<form class="container container--sm">
  <div class="form-group">
    <label class="form-label">Name</label>
    <input type="text" class="input" placeholder="Enter your name">
  </div>
  
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">First Name</label>
      <input type="text" class="input">
    </div>
    <div class="form-group">
      <label class="form-label">Last Name</label>
      <input type="text" class="input">
    </div>
  </div>
  
  <div class="button-group button-group--center">
    <button type="submit" class="button button--primary">Submit</button>
  </div>
</form>
```

### Creating a Modal
```html
<div class="modal-overlay">
  <div class="modal-container modal-container--medium">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-content">
      <p>Modal content goes here...</p>
    </div>
    <div class="modal-actions">
      <button class="button button--secondary">Cancel</button>
      <button class="button button--primary">Confirm</button>
    </div>
  </div>
</div>
```

## Browser Support

### Modern Features Used
- CSS Custom Properties (IE 11+)
- CSS Grid (IE 11+ with -ms- prefix)
- Flexbox (IE 11+)
- CSS Functions (clamp, min, max) (Chrome 79+, Firefox 75+, Safari 13.1+)
- Dynamic Viewport Units (Chrome 108+, Firefox 101+, Safari 15.4+)
- Container Queries (Chrome 105+, Firefox 110+, Safari 16.0+)

### Fallback Strategy
- Dynamic viewport units fall back to standard vh/vw
- Container queries have @supports fallbacks
- CSS functions have rem fallbacks where needed
- All features degrade gracefully in older browsers

## Performance Considerations

### CSS Custom Properties
- Calculated once and reused throughout the application
- Enable consistent theming without JavaScript
- Reduce bundle size by eliminating duplicate values

### Viewport Units
- Eliminate need for JavaScript-based responsive calculations
- Reduce layout thrashing compared to media queries
- Enable smooth scaling across all viewport sizes

### CSS Functions
- Perform calculations at render time, not runtime
- Reduce JavaScript dependency for responsive behavior
- Enable truly fluid layouts without breakpoints

## Testing

The design system includes comprehensive unit tests that verify:
- CSS custom property definitions
- Layout utility class application
- Form and button system functionality
- Modal structure and behavior
- Responsive behavior across viewport sizes
- Accessibility features

Run tests with:
```bash
npm test -- --testPathPattern="css-design-system"
```

## Migration Guide

### From Media Queries
```css
/* Old approach */
@media (min-width: 768px) {
  .component {
    padding: 2rem;
    font-size: 1.125rem;
  }
}

/* New approach */
.component {
  padding: var(--spacing-lg);
  font-size: var(--font-size-lg);
}
```

### From Fixed Pixel Values
```css
/* Old approach */
.button {
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
}

/* New approach */
.button {
  height: var(--button-height);
  padding-inline: var(--spacing-md);
  font-size: var(--font-size-md);
}
```

### From Absolute Positioning
```css
/* Old approach */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  max-width: 90vw;
}

/* New approach */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--vw-dynamic);
  height: var(--vh-dynamic);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: var(--container-md);
}
```

This design system provides a solid foundation for responsive, accessible, and maintainable CSS across the entire application.