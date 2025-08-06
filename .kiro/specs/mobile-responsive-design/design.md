# Design Document

## Overview

This design addresses mobile UI issues throughout the walk-up music manager application by implementing Bootstrap's responsive grid system and utility classes alongside centralized state management. The solution leverages Bootstrap's proven responsive patterns to eliminate custom CSS complexity while ensuring proper global state management for scroll behavior and playback state.

## Architecture

### Design Principles

1. **Bootstrap-First Responsive Design**: Use Bootstrap's grid system and utility classes for all layout and responsive behavior
2. **Mobile-First Approach**: Leverage Bootstrap's mobile-first breakpoint system (xs, sm, md, lg, xl, xxl)
3. **Component State Isolation**: Ensure proper cleanup of global state (scroll behavior, playback) when components unmount
4. **Utility-Class Based Styling**: Minimize custom CSS by using Bootstrap's comprehensive utility class system

### Application Structure

The entire application will be redesigned with Bootstrap's responsive grid system applied consistently across all components:

```
Application
├── Bootstrap Integration (grid system, utilities)
├── Centralized State Management (scroll, playback)
├── Player Management
│   ├── Player List (Bootstrap grid layout)
│   ├── Player Form (Bootstrap form classes)
│   └── Song Selector Modal (Bootstrap modal structure)
├── Game Mode
│   ├── Current Batter Display (Bootstrap flex utilities)
│   ├── Batting Order (Bootstrap responsive columns)
│   └── Game Controls (Bootstrap button classes)
├── Modals & Overlays
│   ├── SegmentSelector (Bootstrap modal with custom content)
│   ├── Song Search (Bootstrap grid for results)
│   └── Confirmation Dialogs (Bootstrap modal variants)
└── Shared Components
    ├── TrackPreview (Bootstrap card/flex layout)
    ├── Button (Bootstrap button classes)
    └── Modal (Bootstrap modal component)
```

## Components and Interfaces

### Bootstrap Integration

#### 1. Bootstrap Setup and Configuration

Install and configure Bootstrap with custom theme variables:

```scss
// Custom Bootstrap variables
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);

$container-max-widths: (
  sm: 540px,
  md: 720px,
  lg: 960px,
  xl: 1140px,
  xxl: 1320px
);

// Custom spacing scale
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacer * .25,
  2: $spacer * .5,
  3: $spacer,
  4: $spacer * 1.5,
  5: $spacer * 3,
);

// Import Bootstrap
@import "~bootstrap/scss/bootstrap";

// Custom overrides for touch targets
.btn {
  min-height: 44px;
  min-width: 44px;
}

.form-control {
  min-height: 44px;
}
```

### Component-Specific Architecture Changes

#### 2. Bootstrap Component Examples

Use Bootstrap's built-in components and utilities for responsive layouts:

```jsx
// Modal using Bootstrap classes
function ResponsiveModal({ children, size = 'lg' }) {
  return (
    <div className="modal fade" tabIndex="-1">
      <div className={`modal-dialog modal-${size} modal-dialog-scrollable`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Modal Title</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="button" className="btn btn-primary">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Responsive grid layout using Bootstrap
function PlayerList({ players }) {
  return (
    <div className="container-fluid">
      <div className="row g-3">
        {players.map(player => (
          <div key={player.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{player.name}</h5>
                <div className="mt-auto">
                  <button className="btn btn-primary btn-sm">Edit</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Form using Bootstrap form classes
function PlayerForm() {
  return (
    <form className="needs-validation" noValidate>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="playerName" className="form-label">Player Name</label>
          <input 
            type="text" 
            className="form-control" 
            id="playerName" 
            required 
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="playerNumber" className="form-label">Jersey Number</label>
          <input 
            type="number" 
            className="form-control" 
            id="playerNumber" 
            required 
          />
        </div>
        <div className="col-12">
          <div className="d-flex gap-2 justify-content-end">
            <button type="button" className="btn btn-outline-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Player
            </button>
          </div>
        </div>
      </div>
    </form>
  );
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

### Bootstrap Utility Usage

Leverage Bootstrap's utility classes for responsive design:

```jsx
// Responsive spacing and sizing
<div className="p-3 p-md-4 p-lg-5">
  <div className="mb-2 mb-md-3">
    <h1 className="fs-4 fs-md-3 fs-lg-2">Responsive Heading</h1>
  </div>
</div>

// Responsive grid layouts
<div className="row g-2 g-md-3 g-lg-4">
  <div className="col-12 col-sm-6 col-lg-4">
    <div className="card">Card content</div>
  </div>
</div>

// Responsive flexbox utilities
<div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 gap-md-3">
  <div className="flex-grow-1">Content</div>
  <div className="flex-shrink-0">Actions</div>
</div>

// Responsive display utilities
<div className="d-none d-md-block">Hidden on mobile</div>
<div className="d-block d-md-none">Only on mobile</div>
```

## Error Handling

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