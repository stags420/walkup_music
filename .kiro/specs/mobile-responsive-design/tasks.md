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

- [x] 3. Fix SegmentSelector and Game Mode playback state directly
  - (done) Add local playback state management within SegmentSelector/GameMode component
  - (done) Ensure play/pause button reflects current playback state within the modal
  - (done) Stop playback and reset button state when modal closes
  - (done) Handle playback errors by resetting button to play state
  - (done) get rid of Global playback controls entirely
  - Playing from the player game card works correctly (almost). It does not stop playback when the game is ended. We need to refactor to introduce a PlayButton component that we can use in multiple places. It should handle the button state and interaction with the music service. Parent components shouldn't interact with music service. PlayButton should accept a hook as a prop to tell it to stop - this would trigger when we leave game mode and when we exit the containing modal in segment selection. Or is there some kind of common cleanup strategy for this? We have a component (PlayButton) that when it is hidden/removed we want to trigger something (stop the music).
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 4. Go restructure app with bootstrap grid system starting from the root in App.tsx
  - Define outline of app in App.tsx (not sure what it is yet, something like header/nav/body/footer)
  - Place each component in the correct spot with the correct style
  - Make components use the bootstrap grid system too
  - Systematically replace unneeded CSS as you go through components
  - dont worry about tests until youve gotten through all components
  - Replace fixed layouts with responsive Bootstrap columns (col-12 col-sm-6 col-md-4)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Make PlayerForm responsive with Bootstrap form classes
  - Refactor PlayerForm to use Bootstrap form classes and responsive grid
  - Add Bootstrap form validation styling and proper error message display
  - Ensure form inputs meet minimum touch target size (44px) on mobile
  - Make form layout stack on mobile and use columns on larger screens
  - Test form usability and validation display on mobile devices
  - _Requirements: 1.1, 1.2, 1.5, 2.6_

- [x] 6. Update TrackPreview with configurable controls and Bootstrap layout
  - Add props to TrackPreview to control visibility of play buttons
  - Remove play buttons from search results by default, make them configurable
  - Use Bootstrap card and flex utilities for responsive track preview layout
  - Keep playback state local to each TrackPreview component instance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Make SongSelector modal responsive with Bootstrap
  - Refactor SongSelector modal to use Bootstrap modal structure
  - Use Bootstrap grid for responsive search results layout
  - Ensure search input and results are properly sized for mobile
  - Add simple scroll lock/unlock directly in SongSelector component
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 5.1, 5.2_

- [x] 8. Update GameMode components with Bootstrap responsive design
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
- [x] 10. Update complete workflow e2e test
  - ensure complete workflow executed:
    - Add players
    - Edit songs
    - Play songs for specified segment
    - start game
    - advance batters
    - refresh ensure state persisted
    - end game
  - _Requirements: 1.4, 2.5, 3.4, 4.5_