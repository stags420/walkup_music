# Implementation Plan

- [x] 1. Project Setup and Structure
  - [x] 1.1 Create GitHub repository and set up GitHub Pages
    - Initialize repository with basic HTML, CSS, and JavaScript files
    - Configure GitHub Pages for deployment
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.2 Set up project structure and dependencies
    - Create directory structure for components
    - Add necessary CSS frameworks (e.g., Bootstrap or Tailwind)
    - Set up module bundler if needed (e.g., Webpack, Parcel)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.3 Create responsive layout skeleton
    - Implement basic HTML structure
    - Create responsive CSS for mobile, tablet, and desktop
    - Implement navigation between main views
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Spotify Authentication Implementation
  - [x] 2.1 Register Spotify Developer Application
    - Create application in Spotify Developer Dashboard
    - Configure redirect URIs
    - Obtain client ID
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Implement authentication flow
    - Create authentication component
    - Implement Spotify OAuth flow
    - Handle authentication callbacks
    - Store authentication tokens in cookies
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.3 Create token refresh mechanism
    - Implement token expiration check
    - Create automatic token refresh
    - Handle refresh failures
    - _Requirements: 1.4_

  - [x] 2.4 Write tests for authentication flow
    - Test authentication initialization
    - Test token storage and retrieval from cookies
    - Test token refresh mechanism
    - _Requirements: 1.3, 1.4_

  - [x] 2.5 Fix NPM deprecation warnings
    - Ensure that we are not seeing any 'npm warn deprecated'

- [x] 3. Storage Component Implementation
  - [x] 3.1 Create local storage utilities
    - Implement functions to save data to local storage
    - Implement functions to retrieve data from local storage
    - Implement functions to clear data from local storage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.2 Implement data models and validation
    - Create data models for players, songs, and batting order
    - Implement validation for data models
    - Handle local storage size limitations
    - _Requirements: 6.1, 6.5_

  - [x] 3.3 Write tests for storage component
    - Test data saving and retrieval
    - Test data validation
    - Test handling of local storage limitations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4. Player Management Implementation
  - [x] 4.1 Create player management interface
    - Implement UI for adding players
    - Implement UI for editing players
    - Implement UI for deleting players
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 4.2 Implement player management functionality
    - Create functions to add players
    - Create functions to edit players
    - Create functions to delete players
    - Integrate with storage component
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.3 Write tests for player management
    - Test player addition
    - Test player editing
    - Test player deletion
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 5. Spotify Integration Implementation
  - [x] 5.1 Create Spotify API wrapper
    - Implement functions to search for songs
    - Implement functions to get track details
    - Implement error handling for API calls
    - _Requirements: 3.1, 3.2_

  - [x] 5.2 Implement song playback controls
    - Create functions to play songs
    - Create functions to pause songs
    - Create functions to seek to specific positions
    - Enhanced with device-specific playback targeting
    - _Requirements: 3.3, 3.4_

  - [x] 5.3 Write tests for Spotify integration
    - Test song search functionality
    - Test track detail retrieval
    - Test playback controls
    - Test device-specific playback functionality
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 6. Song Segmentation Implementation
  - [x] 6.1 Create song segmentation interface
    - Implement UI for selecting song segments
    - Create visualization for audio timeline
    - Implement controls for setting start and end times
    - _Requirements: 3.4_

  - [x] 6.2 Implement song segmentation functionality
    - Create functions to set segment start time
    - Create functions to set segment end time
    - Create functions to preview segments
    - Integrate with storage component
    - _Requirements: 3.4, 3.5, 3.6_

  - [x] 6.2.1 Implement device selection for playback control
    - Enhance Spotify API functions to support device-specific playback
    - Create device selection UI with radio buttons for available devices
    - Implement device status checking and refresh functionality
    - Add device icons and consistent sorting (active devices first, then alphabetical)
    - Update preview and playback functions to use selected device
    - Implement precise segment monitoring with device-specific pause control
    - Add user guidance for device setup and troubleshooting
    - _Requirements: 3.3, 3.4_

  - [x] 6.2.2 Improve song segmentation mobile UX
    - Redesign search results layout for better mobile scrolling
    - Implement collapsible/expandable search results section
    - Add sticky or floating controls for better accessibility
    - Optimize touch targets and spacing for mobile devices
    - Implement smooth scrolling and better visual flow between sections
    - Add mobile-specific gestures and interactions where appropriate
    - Ensure segmentation controls are easily accessible after song selection
    - _Requirements: 3.4, 7.1, 7.2_

  - [x] 6.2.3 Implement Spotify Web Playback SDK for simplified device interaction
    - Integrate Spotify Web Playback SDK to create a browser-based playback device
    - Implement SDK initialization with proper authentication and Premium account detection
    - Create a local Spotify Connect device that appears in /me/player/devices automatically
    - Eliminate the need for manual device selection by using the browser as the default device
    - Implement seamless playback control through the Web Playback SDK player instance
    - Add fallback to existing device selection for users who prefer external devices
    - Handle SDK-specific error states (Premium required, browser compatibility, etc.)
    - Implement proper cleanup and disconnection when leaving the application
    - Add user-friendly messaging for SDK requirements and limitations
    - _Requirements: 3.3, 3.4, 1.2_

  - [x] 6.2.4 Refactor song segmentation initialization to prevent multiple initializations
    - Problem: Song segmentation component is initialized multiple times from different places
    - Current issues: app.js imports but never uses initSongSegmentation, player-management.js calls it dynamically
    - The enhanced playback system (Web Playback SDK) is initialized multiple times unnecessarily
    - Device selection UI and event listeners may be set up repeatedly
    - Create a centralized initialization manager to ensure single initialization
    - Implement initialization state tracking to prevent duplicate setup calls
    - Refactor player-management.js to check if song segmentation is already initialized before calling init
    - Remove unused import from app.js or properly integrate it into the main initialization flow
    - Ensure enhanced playback system (SDK) is only initialized once per session
    - Add proper cleanup methods for when components need to be re-initialized
    - Implement lazy loading pattern where song segmentation initializes only when first needed
    - Add initialization status logging to help debug initialization flow issues
    - _Requirements: 3.4, 3.3_

  - [ ] 6.3 Write tests for song segmentation
    - Test segment selection
    - Test segment preview
    - Test segment saving
    - Test device selection functionality
    - Test device-specific playback control
    - Test device status checking and refresh
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ] 7. Batting Order Implementation
  - [ ] 7.1 Create batting order interface
    - Implement UI for displaying batting order
    - Implement drag-and-drop functionality
    - Create visual indicators for current and on-deck batters
    - _Requirements: 4.1, 4.2_

  - [ ] 7.2 Implement batting order functionality
    - Create functions to get batting order
    - Create functions to update batting order
    - Create functions to move players in order
    - Integrate with storage component
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 7.3 Write tests for batting order
    - Test order retrieval
    - Test order updates
    - Test player movement in order
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Game Mode Implementation
  - [ ] 8.1 Create game mode interface
    - Implement UI for game mode
    - Create display for current and on-deck batters
    - Implement controls for next batter and playback
    - _Requirements: 5.1, 5.2_

  - [ ] 8.2 Implement game mode functionality
    - Create functions to start game mode
    - Create functions to play next batter's music
    - Create functions to handle end of batting order
    - Implement playback controls
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 8.3 Write tests for game mode
    - Test next batter functionality
    - Test end of order handling
    - Test playback controls
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Integration and End-to-End Testing
  - [ ] 9.1 Implement end-to-end tests
    - Test complete user workflows
    - Test data persistence across page reloads
    - Test responsive design on different screen sizes
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.2 Perform cross-browser testing
    - Test in Chrome, Firefox, Safari, and Edge
    - Fix any browser-specific issues
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 9.3 Optimize performance
    - Minimize API calls
    - Optimize local storage usage
    - Improve loading times
    - _Requirements: 6.5_

- [ ] 10. Documentation and Final Deployment
  - [ ] 10.1 Create user documentation
    - Write setup instructions
    - Create usage guide
    - Document known limitations
    - _Requirements: All_

  - [ ] 10.2 Finalize GitHub Pages deployment
    - Ensure all features work in production environment
    - Configure custom domain if needed
    - _Requirements: All_

- [ ] 11. Test Coverage and Quality Issues
  - [ ] 11.1 Fix incomplete test in player-management.test.js
    - File: tests/js/components/player-management.test.js, line 492
    - The diff shows an incomplete test case that was cut off mid-execution
    - The test appears to be testing song selection retrieval but the assertion was incomplete
    - Fix: Complete the test case or remove the incomplete code
    - _Requirements: 2.6_

  - [ ] 11.2 Restore missing UI test coverage
    - File: tests/js/components/player-management.test.js, lines 490-618 (removed in diff)
    - Critical UI functionality tests were removed including player list display, empty state handling, and error state testing
    - These tests covered requirement 2.6 for player list display functionality
    - The removed tests included important edge cases like handling service errors and displaying players with/without song selections
    - Fix: Either restore the removed UI tests or create equivalent tests that cover the same functionality
    - _Requirements: 2.6_

  - [x] 11.3 Fix player list not displaying after re-authentication
    - Issue: When user re-authenticates after already having added players, the player list appears empty until page refresh
    - Root cause: Player management component may not be properly reloading/refreshing player data after authentication state changes
    - The authentication flow should trigger a refresh of the player list UI to display existing players
    - Players are stored in localStorage/cookies and should persist across authentication sessions
    - Fix: Ensure player management component reloads and displays existing players when authentication completes
    - Add proper event handling for authentication state changes to refresh UI components
    - Test that existing players remain visible after re-authentication without requiring page refresh
    - _Requirements: 1.3, 2.1, 2.2, 2.6_

  - [ ] 11.3 Add integration tests for UI components
    - File: tests/js/components/player-management.test.js
    - The current tests only cover service layer functionality but don't test the actual UI component integration
    - Missing tests for DOM manipulation, event handling, and user interaction flows
    - The removed tests were attempting to test UI functionality but were incomplete
    - Fix: Create proper integration tests that test the actual player management UI component
    - _Requirements: 2.6_

  - [ ] 11.4 Fix Spotify refresh token handling for proper session management
    - Issue: Application shows isAuthenticated as true but Spotify API requests fail with 401 Unauthorized after being away for a while
    - Root cause: Current refresh token implementation is mocked and doesn't use actual Spotify refresh tokens from Authorization Code flow
    - The refreshToken() function simulates token refresh instead of making actual API calls to Spotify's token endpoint
    - When tokens expire, the app thinks it's authenticated but Spotify rejects API requests
    - Fix: Implement proper refresh token flow using the refresh_token from Authorization Code with PKCE flow
    - Make actual POST requests to https://accounts.spotify.com/api/token with grant_type=refresh_token
    - Handle refresh token expiration by prompting for re-authentication
    - Ensure isAuthenticated() validates tokens against actual Spotify API responses, not just local expiration times
    - Add proper error handling for expired refresh tokens and network failures
    - Test token refresh flow with actual expired tokens to ensure it works correctly
    - _Requirements: 1.3, 1.4_

  - [ ] 11.5 Verify test consistency with actual implementation
    - File: tests/js/components/player-management.test.js
    - The test file creates a mock implementation of playerManagementService but doesn't verify it matches the actual service
    - Risk of tests passing while actual implementation has bugs
    - Fix: Either import and test the actual service or ensure mock implementation stays in sync
    - _Requirements: 2.3, 2.4, 2.5, 2.6_