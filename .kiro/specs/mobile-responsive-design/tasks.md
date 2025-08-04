# Implementation Plan

- [x] 1. Create global CSS design system with viewport units
  - Define CSS custom properties for spacing, typography, and sizing using viewport units (vw, vh, vmin, vmax, dvh, dvw)
  - Create responsive utility classes for layout (flexbox, grid) that work without media queries
  - Implement touch-friendly minimum sizes and accessible color contrast ratios
  - Add CSS logical properties for better internationalization support
  - Write unit tests for CSS custom property calculations and responsive behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Implement centralized modal management system
  - Create ModalProvider context with proper scroll lock management and cleanup
  - Build reusable Modal component with configurable sizes and responsive behavior
  - Add modal overlay system that prevents body scroll and restores it on close
  - Implement proper focus management and keyboard navigation for accessibility
  - Create modal hook (useModal) for easy integration across components
  - Write unit tests for modal state management and scroll restoration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Create centralized playback state management
  - Build PlaybackProvider context for global music playback state
  - Implement playback hooks (usePlayback) with consistent state across components
  - Add automatic cleanup of playback timers and proper state synchronization
  - Create playback controls that reflect current state regardless of component
  - Handle playback errors and state recovery consistently across the app
  - Write unit tests for playback state management and cleanup
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [-] 4. Refactor SegmentSelector with responsive design
  - Replace fixed pixel values with viewport-relative units and CSS custom properties
  - Implement flexible layout using CSS Grid and Flexbox for content areas
  - Add proper touch event handling for mobile timeline interaction
  - Integrate with centralized modal and playback management systems
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_

- [ ] 5. Update TrackPreview component with configurable controls
  - Add props to control visibility of play buttons and other UI elements
  - Implement different display variants (full, compact, minimal) for different contexts
  - Remove play buttons from search results by default, make them configurable
  - Integrate with centralized playback state for consistent button states
  - Add responsive layout that adapts to container size using CSS container queries
  - Write component tests for different configurations and responsive behavior
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 4.1, 4.2_

- [ ] 6. Refactor PlayerForm and PlayerList with responsive layouts
  - Replace media queries with CSS Grid auto-fit and flexible layouts
  - Implement responsive form controls using CSS custom properties
  - Add touch-friendly input sizing and proper spacing for mobile devices
  - Ensure form validation messages are visible on small screens
  - Integrate with centralized modal system for consistent behavior
  - Write component tests for form responsiveness and accessibility
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.6, 3.6_

- [ ] 7. Update GameMode components with responsive design
  - Refactor CurrentBatterDisplay to use flexible layouts and viewport units
  - Update BattingOrderManager with responsive drag-and-drop for mobile
  - Implement touch-friendly controls for game navigation and player selection
  - Add responsive typography that scales with viewport size
  - Ensure all game controls meet minimum touch target requirements
  - Write component tests for game mode responsiveness and touch interactions
  - _Requirements: 1.1, 1.2, 1.3, 2.6, 4.6_

- [ ] 8. Create universal Button and Input components
  - Build responsive Button component with consistent sizing and touch targets
  - Implement Input component with proper mobile keyboard handling
  - Add button variants (primary, secondary, icon) with consistent styling
  - Ensure all interactive elements meet WCAG accessibility guidelines
  - Create form layout utilities that work across different screen sizes
  - Write component tests for button and input responsiveness and accessibility
  - _Requirements: 1.1, 1.2, 1.5, 2.6, 5.6_

- [ ] 9. Update SongSelector modal with responsive design
  - Replace fixed dimensions with viewport-relative sizing and flexible layouts
  - Implement responsive search results grid that adapts to screen size
  - Add proper loading states and error handling for mobile network conditions
  - Ensure search input and results are accessible on small screens
  - Integrate with centralized modal and playback management systems
  - Write component tests for song selector responsiveness and search functionality
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2_

- [ ] 10. Implement comprehensive responsive testing suite
  - Create Playwright tests that verify responsive behavior across multiple viewport sizes
  - Add tests for button accessibility and minimum touch target requirements
  - Implement visual regression testing for all major components and screen sizes
  - Create test utilities for modal behavior, scroll restoration, and playback state
  - Add tests that verify CSS custom properties and viewport unit calculations
  - Set up automated testing for different device orientations and zoom levels
  - _Requirements: 1.4, 2.5, 3.4, 4.5_

- [ ] 11. Add CSS container queries for component-level responsiveness
  - Implement container queries for components that need to adapt to their container size
  - Add fallbacks for browsers that don't support container queries
  - Create responsive component layouts that work independently of viewport size
  - Test container query behavior across different browsers and devices
  - Document container query usage patterns for future development
  - Write tests for container query responsive behavior
  - _Requirements: 1.1, 1.2, 1.4, 1.6_

- [ ] 12. Optimize CSS performance and bundle size
  - Remove unused CSS and consolidate duplicate styles across components
  - Implement CSS custom property fallbacks for older browser support
  - Add CSS minification and optimization for production builds
  - Analyze and optimize CSS specificity and cascade performance
  - Create CSS documentation for the new design system and usage patterns
  - Write performance tests for CSS loading and rendering times
  - _Requirements: 1.3, 1.4, 1.6_