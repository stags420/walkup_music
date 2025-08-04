# Design Document

## Overview

This design addresses mobile UI issues throughout the walk-up music manager application by implementing a comprehensive responsive design system that uses modern CSS viewport units, flexible layouts, and centralized state management. The solution focuses on eliminating media query dependencies in favor of fluid, viewport-relative sizing across all components and ensuring proper global state management for scroll behavior and playback state.

## Architecture

### Design Principles

1. **Viewport-First Responsive Design**: Use CSS viewport units (vh, vw, vmin, vmax) and newer dynamic viewport units (dvh, dvw) where supported to create truly responsive layouts
2. **Flexbox-Based Layout**: Replace fixed positioning and pixel-based sizing with flexible box layouts that adapt to content and viewport
3. **Component State Isolation**: Ensure proper cleanup of global state (scroll behavior, playback) when components unmount
4. **Progressive Enhancement**: Design for mobile-first with graceful degradation for older browsers

### Application Structure

The entire application will be redesigned with responsive principles applied consistently across all components:

```
Application
├── Global CSS System (viewport units, flexible layouts)
├── Centralized State Management (scroll, playback)
├── Player Management
│   ├── Player List (responsive grid/flex)
│   ├── Player Form (adaptive inputs)
│   └── Song Selector Modal (viewport-relative)
├── Game Mode
│   ├── Current Batter Display (flexible layout)
│   ├── Batting Order (touch-friendly)
│   └── Game Controls (accessible buttons)
├── Modals & Overlays
│   ├── SegmentSelector (viewport-relative)
│   ├── Song Search (responsive results)
│   └── Confirmation Dialogs (adaptive sizing)
└── Shared Components
    ├── TrackPreview (configurable controls)
    ├── Button (consistent touch targets)
    └── Modal (reusable responsive container)
```

## Components and Interfaces

### Global CSS System

#### 1. CSS Custom Properties Foundation

Establish a comprehensive design system using CSS custom properties:

```css
:root {
  /* Viewport-relative spacing scale */
  --spacing-xs: 1vmin;
  --spacing-sm: 2vmin;
  --spacing-md: 3vmin;
  --spacing-lg: 4vmin;
  --spacing-xl: 6vmin;
  --spacing-xxl: 8vmin;
  
  /* Responsive font sizes using clamp() */
  --font-size-xs: clamp(0.75rem, 1.5vmin, 0.875rem);
  --font-size-sm: clamp(0.875rem, 2vmin, 1rem);
  --font-size-md: clamp(1rem, 2.5vmin, 1.125rem);
  --font-size-lg: clamp(1.125rem, 3vmin, 1.25rem);
  --font-size-xl: clamp(1.25rem, 4vmin, 1.5rem);
  
  /* Touch-friendly minimum sizes */
  --touch-target-min: max(44px, 8vmin);
  --button-height: var(--touch-target-min);
  --input-height: var(--touch-target-min);
  
  /* Responsive container widths */
  --container-sm: min(90vw, 400px);
  --container-md: min(90vw, 600px);
  --container-lg: min(90vw, 800px);
  --container-xl: min(90vw, 1200px);
  
  /* Dynamic viewport units with fallbacks */
  --vh-small: 100vh; /* Fallback */
  --vh-small: 100svh; /* Small viewport */
  --vh-large: 100vh; /* Fallback */
  --vh-large: 100lvh; /* Large viewport */
  --vh-dynamic: 100vh; /* Fallback */
  --vh-dynamic: 100dvh; /* Dynamic viewport */
}
```

### Component-Specific Architecture Changes

#### 1. Universal Modal System

Create a reusable modal system that works across all components:

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: var(--vh-dynamic);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: var(--spacing-md);
  box-sizing: border-box;
}

.modal-container {
  background: var(--color-surface);
  border-radius: clamp(8px, 2vmin, 16px);
  box-shadow: 0 4vmin 8vmin rgba(0, 0, 0, 0.3);
  width: var(--container-md);
  max-height: 90vh;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Size variants */
.modal-container--small { width: var(--container-sm); }
.modal-container--large { width: var(--container-lg); }
.modal-container--full { width: var(--container-xl); }
```

#### 2. Universal Layout System

Implement consistent flexible layouts across all components:

```css
/* Base layout classes */
.layout-flex {
  display: flex;
  gap: var(--spacing-md);
}

.layout-flex--column {
  flex-direction: column;
}

.layout-flex--wrap {
  flex-wrap: wrap;
}

.layout-grid {
  display: grid;
  gap: var(--spacing-md);
}

.layout-grid--auto {
  grid-template-columns: repeat(auto-fit, minmax(var(--container-sm), 1fr));
}

.layout-grid--responsive {
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 45vw), 1fr));
}

/* Modal-specific layouts */
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
  min-height: calc(var(--touch-target-min) + var(--spacing-md) * 2);
}
```

#### 3. Universal Form and Control System

Create responsive form layouts that work across all components:

```css
/* Form layouts */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 40vw), 1fr));
  gap: var(--spacing-md);
}

.form-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* Input styling */
.input {
  height: var(--input-height);
  padding: 0 var(--spacing-sm);
  border: 2px solid var(--color-border);
  border-radius: clamp(4px, 1vmin, 8px);
  font-size: var(--font-size-md);
  background: var(--color-input-bg);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

/* Button system */
.button {
  height: var(--button-height);
  padding: 0 var(--spacing-md);
  border: none;
  border-radius: clamp(4px, 1vmin, 8px);
  font-size: var(--font-size-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-width: var(--touch-target-min);
}

.button--primary {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.button--secondary {
  background: var(--color-secondary);
  color: var(--color-secondary-text);
  border: 1px solid var(--color-border);
}

.button--large {
  height: calc(var(--button-height) * 1.2);
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-lg);
}
```

### React Architecture Changes

#### 1. Centralized Modal and Scroll Management

Create a global modal system with proper scroll management:

```typescript
// Global modal context
interface ModalContextType {
  openModal: (id: string, component: ReactNode) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
}

// Modal provider with scroll management
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<Map<string, ReactNode>>(new Map());
  const scrollPositionRef = useRef(0);
  
  const openModal = useCallback((id: string, component: ReactNode) => {
    // Store current scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.width = '100%';
    
    setModals(prev => new Map(prev).set(id, component));
  }, []);
  
  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const newModals = new Map(prev);
      newModals.delete(id);
      
      // Restore scroll if no modals are open
      if (newModals.size === 0) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollPositionRef.current);
      }
      
      return newModals;
    });
  }, []);
  
  return (
    <ModalContext.Provider value={{ openModal, closeModal, isModalOpen }}>
      {children}
      {Array.from(modals.entries()).map(([id, component]) => (
        <div key={id} className="modal-overlay">
          {component}
        </div>
      ))}
    </ModalContext.Provider>
  );
}
```

#### 2. Centralized Playback State Management

Create a global playback system for consistent state across components:

```typescript
// Global playback context
interface PlaybackContextType {
  currentTrack: SpotifyTrack | null;
  playbackState: 'idle' | 'playing' | 'paused';
  playTrack: (track: SpotifyTrack, startTime?: number, duration?: number) => Promise<void>;
  pauseTrack: () => Promise<void>;
  stopTrack: () => Promise<void>;
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const musicService = useMusicService();
  
  const playTrack = useCallback(async (
    track: SpotifyTrack, 
    startTime = 0, 
    duration?: number
  ) => {
    try {
      // Stop any current playback
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      await musicService.playTrack(track.uri, startTime * 1000);
      setCurrentTrack(track);
      setPlaybackState('playing');
      
      // Auto-stop after duration if specified
      if (duration) {
        timeoutRef.current = setTimeout(async () => {
          await stopTrack();
        }, duration * 1000);
      }
    } catch (error) {
      console.error('Playback failed:', error);
      setPlaybackState('idle');
      setCurrentTrack(null);
    }
  }, [musicService]);
  
  const pauseTrack = useCallback(async () => {
    try {
      await musicService.pause();
      setPlaybackState('paused');
    } catch (error) {
      console.error('Pause failed:', error);
    }
  }, [musicService]);
  
  const stopTrack = useCallback(async () => {
    try {
      await musicService.pause();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setPlaybackState('idle');
      setCurrentTrack(null);
    } catch (error) {
      console.error('Stop failed:', error);
    }
  }, [musicService]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <PlaybackContext.Provider value={{
      currentTrack,
      playbackState,
      playTrack,
      pauseTrack,
      stopTrack
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}
```

#### 3. Enhanced Component System

Create configurable, responsive components that work across contexts:

```typescript
// Universal Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, size = 'medium', children }: ModalProps) {
  const { closeModal } = useModal();
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-container modal-container--${size}`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="button button--icon">×</button>
          </div>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// Enhanced TrackPreview with configuration
interface TrackPreviewProps {
  track: SpotifyTrack;
  variant?: 'full' | 'compact' | 'minimal';
  showPlayControls?: boolean;
  showAlbumArt?: boolean;
  onPlay?: () => void;
  onSelect?: () => void;
}

export function TrackPreview({ 
  track, 
  variant = 'full',
  showPlayControls = false,
  showAlbumArt = true,
  onPlay,
  onSelect
}: TrackPreviewProps) {
  const { playTrack, pauseTrack, currentTrack, playbackState } = usePlayback();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && playbackState === 'playing';
  
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      await pauseTrack();
    } else {
      await playTrack(track);
    }
    onPlay?.();
  }, [isPlaying, playTrack, pauseTrack, track, onPlay]);
  
  return (
    <div className={`track-preview track-preview--${variant}`}>
      {showAlbumArt && (
        <img 
          src={track.albumArt} 
          alt={`${track.album} cover`}
          className="track-preview__artwork"
        />
      )}
      
      <div className="track-preview__info">
        <h3 className="track-preview__title">{track.name}</h3>
        <p className="track-preview__artist">{track.artists.join(', ')}</p>
        {variant === 'full' && (
          <p className="track-preview__album">{track.album}</p>
        )}
      </div>
      
      <div className="track-preview__actions">
        {showPlayControls && (
          <button 
            onClick={handlePlay}
            className={`button button--icon ${isPlaying ? 'button--playing' : ''}`}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
        
        {onSelect && (
          <button onClick={onSelect} className="button button--primary">
            Select
          </button>
        )}
      </div>
    </div>
  );
}
```

## Data Models

### Component Configuration Types

Define TypeScript interfaces for component configuration:

```typescript
// Modal configuration
interface ModalConfig {
  size: 'small' | 'medium' | 'large' | 'full';
  dismissible: boolean;
  showHeader: boolean;
  className?: string;
}

// Layout configuration
interface LayoutConfig {
  direction: 'row' | 'column';
  wrap: boolean;
  gap: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align: 'start' | 'center' | 'end' | 'stretch';
  justify: 'start' | 'center' | 'end' | 'between' | 'around';
}

// Responsive component props
interface ResponsiveProps {
  variant?: 'mobile' | 'tablet' | 'desktop' | 'auto';
  breakpoint?: number;
  className?: string;
}

// Playback state
interface PlaybackState {
  currentTrack: SpotifyTrack | null;
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'error';
  position: number;
  duration: number;
  error?: string;
}
```

### CSS Architecture Strategy

Replace media queries with CSS functions and logical properties:

```css
/* Container queries for component-level responsiveness */
.component-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .component-content {
    grid-template-columns: 1fr 1fr;
  }
}

/* Logical properties for better internationalization */
.content {
  padding-inline: var(--spacing-md);
  padding-block: var(--spacing-sm);
  margin-inline-start: var(--spacing-lg);
}

/* Intrinsic sizing with CSS functions */
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit, 
    minmax(min(250px, 100%), 1fr)
  );
  gap: clamp(1rem, 3vw, 2rem);
}

/* Fluid typography */
.heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}

/* Responsive spacing */
.section {
  padding: clamp(2rem, 8vw, 6rem) clamp(1rem, 4vw, 3rem);
}
```

## Error Handling

### Viewport Unit Fallbacks

Provide fallbacks for newer viewport units:

```css
.segment-selector-modal {
  /* Fallback for older browsers */
  max-height: 90vh;
  /* Modern dynamic viewport height */
  max-height: 90dvh;
}
```

### Touch Event Handling

Improve touch interaction for mobile devices:

```typescript
// Enhanced touch handling for timeline segment
const handleTouchStart = useCallback((e: TouchEvent) => {
  e.preventDefault(); // Prevent scrolling
  // Touch handling logic
}, []);

// Add passive event listeners where appropriate
useEffect(() => {
  const element = timelineRef.current;
  if (element) {
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }
}, [handleTouchStart, handleTouchMove]);
```

## Testing Strategy

### Comprehensive Responsive Testing

Test responsive behavior across all components and viewports:

```typescript
// Test suite for responsive design
const testViewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 12 Pro Max', width: 414, height: 896 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Desktop', width: 1440, height: 900 },
];

// Test all major components across viewports
const testComponents = [
  'player-management',
  'song-selector',
  'segment-selector', 
  'game-mode',
  'batting-order'
];

for (const viewport of testViewports) {
  for (const component of testComponents) {
    test(`${component} should be responsive at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      
      // Navigate to component
      await navigateToComponent(page, component);
      
      // Test button accessibility
      await testButtonAccessibility(page);
      
      // Test modal behavior if applicable
      if (hasModal(component)) {
        await testModalResponsiveness(page);
      }
      
      // Test touch targets
      await testTouchTargets(page);
      
      // Visual regression test
      await expect(page).toHaveScreenshot(`${component}-${viewport.name}.png`);
    });
  }
}

// Helper functions
async function testButtonAccessibility(page: Page) {
  const buttons = page.locator('button:visible');
  const count = await buttons.count();
  
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const box = await button.boundingBox();
    
    if (box) {
      // Ensure buttons are within viewport
      expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
      expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      
      // Ensure minimum touch target size
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
  }
}

async function testModalResponsiveness(page: Page) {
  // Open modal
  await page.click('[data-testid*="modal-trigger"]');
  
  const modal = page.locator('.modal-container');
  await expect(modal).toBeVisible();
  
  const modalBox = await modal.boundingBox();
  const viewport = page.viewportSize()!;
  
  if (modalBox) {
    // Modal should fit within viewport
    expect(modalBox.height).toBeLessThanOrEqual(viewport.height * 0.95);
    expect(modalBox.width).toBeLessThanOrEqual(viewport.width * 0.95);
    
    // Action buttons should be visible
    const actions = page.locator('.modal-actions button');
    const actionBoxes = await actions.evaluateAll(elements => 
      elements.map(el => el.getBoundingClientRect())
    );
    
    actionBoxes.forEach(box => {
      expect(box.bottom).toBeLessThanOrEqual(viewport.height);
    });
  }
  
  // Close modal
  await page.click('.modal-overlay');
  await expect(modal).not.toBeVisible();
}
```

### Accessibility Testing

Ensure touch targets meet minimum size requirements:

```typescript
test('should have adequate touch targets on mobile', async ({ page }) => {
  const buttons = page.locator('button');
  const buttonBoxes = await buttons.evaluateAll(elements => 
    elements.map(el => el.getBoundingClientRect())
  );
  
  buttonBoxes.forEach(box => {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });
});
```

### State Management Testing

Test proper cleanup of global state:

```typescript
test('should restore scroll behavior after modal closes', async ({ page }) => {
  // Open modal
  await page.click('[data-testid="segment-selector-trigger"]');
  
  // Verify scroll is disabled
  const scrollDisabled = await page.evaluate(() => 
    document.body.style.overflow === 'hidden'
  );
  expect(scrollDisabled).toBe(true);
  
  // Close modal
  await page.click('[data-testid="cancel-button"]');
  
  // Verify scroll is restored
  const scrollRestored = await page.evaluate(() => 
    document.body.style.overflow !== 'hidden'
  );
  expect(scrollRestored).toBe(true);
});
```

This design provides a comprehensive solution to mobile UI issues across the entire application by leveraging modern CSS capabilities, centralized state management, and responsive design principles. The solution ensures all components work reliably across mobile devices without requiring complex media query breakpoints, while providing a consistent and accessible user experience.