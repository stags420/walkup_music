# Implementation Plan

- [x] 1. Fix SegmentSelector modal buttons accessibility with Bootstrap
  - Install Bootstrap 5 and add basic Bootstrap CSS to the project
  - Refactor SegmentSelector modal to use Bootstrap modal structure with proper footer
  - Ensure Cancel and Submit buttons are always visible in modal footer using Bootstrap classes
  - Add Bootstrap responsive utilities to make modal content scrollable while keeping buttons fixed
  - e2e test that buttons are accessible on mobile devices and don't get pushed off-screen
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.1, 1.2_

- [x] 2. Fix SegmentSelector scroll behavior directly
  - Add simple scroll lock/unlock to SegmentSelector component when modal opens/closes
  - Store scroll position in component state and restore on close
  - Clean up scroll styles in component cleanup (useEffect return)
  - Test scroll restoration works when modal is cancelled or confirmed
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [-] 3. Fix SegmentSelector and Game Mode playback state directly
  - Add local playback state management within SegmentSelector/GameMode component
  - Ensure play/pause button reflects current playback state within the modal
  - Stop playback and reset button state when modal closes
  - Handle playback errors by resetting button to play state
  - get rid of Global playback controls entirely
  - Refactor to pull out a play button
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4. Make PlayerList responsive with Bootstrap grid
  - Refactor PlayerList component to use Bootstrap container and grid system
  - Replace fixed layouts with responsive Bootstrap columns (col-12 col-sm-6 col-md-4)
  - Add Bootstrap spacing utilities for consistent padding and margins
  - Ensure player cards stack properly on mobile and expand on larger screens
  - Test responsive behavior across different screen sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Make PlayerForm responsive with Bootstrap form classes
  - Refactor PlayerForm to use Bootstrap form classes and responsive grid
  - Add Bootstrap form validation styling and proper error message display
  - Ensure form inputs meet minimum touch target size (44px) on mobile
  - Make form layout stack on mobile and use columns on larger screens
  - Test form usability and validation display on mobile devices
  - _Requirements: 1.1, 1.2, 1.5, 2.6_

- [ ] 6. Update TrackPreview with configurable controls and Bootstrap layout
  - Add props to TrackPreview to control visibility of play buttons
  - Remove play buttons from search results by default, make them configurable
  - Use Bootstrap card and flex utilities for responsive track preview layout
  - Keep playback state local to each TrackPreview component instance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 7. Make SongSelector modal responsive with Bootstrap
  - Refactor SongSelector modal to use Bootstrap modal structure
  - Use Bootstrap grid for responsive search results layout
  - Ensure search input and results are properly sized for mobile
  - Add simple scroll lock/unlock directly in SongSelector component
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2_

- [ ] 8. Update GameMode components with Bootstrap responsive design
  - Refactor CurrentBatterDisplay to use Bootstrap flex utilities and responsive text
  - Update BattingOrderManager with Bootstrap responsive columns and touch-friendly controls
  - Ensure all game controls meet minimum touch target requirements using Bootstrap button classes
  - Add responsive typography using Bootstrap text utilities
  - _Requirements: 1.1, 1.2, 1.3, 2.6_

- [x] 9. Implement mask-based scroll lock for improved mobile reliability
  - Replace current body style manipulation scroll lock with mask-based approach
  - Create a full-screen overlay mask for each modal that prevents touch/scroll events from reaching background
  - Integrate mask directly into Modal component - each modal gets its own mask
  - When modal is removed, its mask is automatically removed and scrolling is restored
  - Test scroll prevention works reliably across iOS Safari, Android Chrome, and other mobile browsers
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_


- [x] 9.a. Use Bootstrap modal instead of hand-rolled modal.
- [ ] 10. Update complete workflow e2e test
  - Add mobile viewport testing to existing completeWorkflow.spec.ts
  - Test SegmentSelector button accessibility on mobile screen sizes
  - Verify scroll behavior works correctly after modal interactions
  - Test touch interactions meet minimum target size requirements
  - Ensure all Bootstrap responsive layouts work in the complete user flow
  - _Requirements: 1.4, 2.5, 3.4, 4.5_