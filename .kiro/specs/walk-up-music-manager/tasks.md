# Implementation Plan

- [x] 1. Set up project structure and core interfaces
  - Create Vite + React + TypeScript project with GitHub Pages deployment configuration
  - Define core TypeScript interfaces for StorageService, AuthService, PlayerService, and GameService
  - Set up project directory structure with services, components, and types folders
  - Configure ESLint, Prettier, and Jest for code quality and testing
  - _Requirements: 9.1, 9.2_

- [x] 2. Implement storage abstraction layer
  - Create StorageService interface with save, load, delete, clear, export, and import methods
  - Implement LocalStorageService class that implements the StorageService interface
  - Add data validation and error handling for storage operations
  - Write unit tests for storage service functionality
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Create data models and validation
  - Define Player, BattingOrder, SpotifyTrack, and AppConfig TypeScript interfaces
  - Implement data validation functions for each model
  - Create factory functions for creating new instances with proper defaults
  - Write unit tests for data model validation and creation
  - _Requirements: 2.1, 3.1, 7.1_

- [x] 4. Implement Spotify authentication service
  - Create AuthService interface with login, logout, getAccessToken, isAuthenticated, and refreshToken methods
  - Implement PKCE code verifier and challenge generation functions
  - Build SpotifyAuthService class with OAuth flow handling and token management
  - Add cookie-based token storage with secure HTTP-only cookies
  - Write unit tests for authentication flow and token management
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 5. Build authentication UI components
  - Create LoginPage component with Spotify login button
  - Add authentication state management with React Context
  - Implement loading states and error handling for auth flow
  - Write component tests for authentication UI
  - _Requirements: 1.1, 1.4_

- [x] 6. Create basic player management UI
  - Build PlayerList component to display all saved players with mock data
  - Create PlayerForm component for adding/editing players (without Spotify integration initially)
  - Add basic player CRUD operations with local storage
  - Implement simple UI for testing player management functionality
  - Write component tests for player management interface
  - _Requirements: 2.1, 2.4, 2.6, 2.7_

- [x] 7. Build complete player management UI with mocked Spotify integration
  - Create SongSelector component with mocked search functionality and fake results
  - Add song preview UI (without actual playback) and segment selection interface
  - Implement drag-and-drop or intuitive selection for song segments
  - Update PlayerForm to work with mocked Spotify track data
  - Add comprehensive player CRUD operations with local storage persistence
  - Create PlayerService class with mocked song search and segment timing
  - Write component tests for complete player management interface
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 8. Build real Spotify API integration
  - Create Spotify Web API client with search functionality
  - Implement song search with proper error handling and rate limiting
  - Add track metadata parsing and preview URL handling
  - Create unit tests for API integration with mocked responses
  - _Requirements: 2.2, 2.3_

- [x] 9. Replace mocked functionality with real Spotify integration
  - Connect SongSelector component with real Spotify API search
  - Update PlayerForm to work with real Spotify track data
  - Write integration tests for Spotify-enabled player management
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7_

- [+] 10. Create Spotify Web Playback SDK integration
  - Initialize Spotify Web Playback SDK with proper error handling
  - Implement music playback with precise segment timing control
  - Create unit tests for playback functionality with SDK mocking
  - Add song preview functionality to segment selection UI using player
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 11. Create game mode interface
  - Create LineupService class for lineup management/storage. Store lineup and current position 
    as separate state. For now, just use the current list of players as the lineup, don't store 
    anything new. We will build a UI later to modify it.
  - Add Start and End Game buttons. Start is in player management view and transitions 
    to game view, End is in game view and goes back to player management. 
  - Build CurrentBatterDisplay showing current, on-deck, and in-the-hole batters. Also
    has playback controls, the song is paused until the user hits play.
  - Track state of current position in lineup.
  - Create GameControls component with "Next Batter" button
  - Write component tests for game mode interface
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 12. Build batting order management UI
  - Create BattingOrderManager component for editing lineup. This is going to replace the current 
    Player Management UI - "Player Management" -> "Lineup".
  - Implement OrderBuilder. Left column is lineup. Right column is players that are not in lineup.
    You can drag and drop players anywhere.
  - Add Player button adds into the right column. 
  - Write component tests for batting order interface
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.4_

- [ ] 13. Add mock authentication and fake data support for development
- [x] 13.1 Implement mock authentication infrastructure
  - Update AppConfig interface to include mockAuth flag for build-time configuration
  - Create MockAuthService that bypasses Spotify OAuth and provides fake user data if mockAuth flag is true.
  - Modify main.tsx bootstrap logic to accept args and add npm scripts to pass mockAuth flag
  - Update MusicServiceProvider to automatically use MockMusicService when in mock auth mode
  - Ensure mock mode works completely offline without any Spotify API calls
  - Create simple audio jingle (short beep/tone) that plays for all fake songs in mock mode
  - Write unit tests for mock auth service and mock mode initialization
  - _Requirements: Support development workflow with automated testing_

- [x] 13.2 Create Playwright e2e test suite for mock mode
  - Set up Playwright testing framework with TypeScript configuration
  - Write e2e tests for complete user workflows using mock auth mode
  - Test player management: create, edit, delete players with song selection
  - Test lineup creation: drag-and-drop ordering, adding/removing players
  - Test game mode transitions: start game, next batter, end game functionality
  - Add test scenarios that automatically catch UI issues found during manual testing
  - Create test data fixtures and page object models for maintainable tests
  - _Requirements: Automated validation of user workflows and UI behavior_

- [x] 13.3 Finish e2e testing
  - Complete the full workflow test, including song selection, segment selection. 
  - Review playwright steering guidance and improve tests where needed
  - Make tests pass
  - _Requirements: Automated validation of user workflows and UI behavior_

- [ ] 14. Build configuration management
  - Create ConfigService for managing application settings
  - Implement configurable segment duration with validation
  - Add Spotify client ID and redirect URI configuration
  - Write unit tests for configuration management
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 15. Implement settings and data management UI
  - Create SettingsPage with configuration options
  - Build DataManager component for export/import functionality
  - Add file upload handling and validation feedback
  - Write component tests for settings interface
  - _Requirements: 7.1, 7.3, 8.1, 8.2, 8.4, 8.5_

- [ ] 16. Create data export/import functionality
  - Add export functionality to storage service that creates downloadable JSON
  - Implement import functionality with file validation and conflict resolution
  - Add user interface for export/import operations
  - Write unit tests for export/import with various data scenarios
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 17. Add comprehensive error handling
  - Implement error boundaries for React components
  - Add user-friendly error messages for all failure scenarios
  - Create retry mechanisms for network operations
  - Write tests for error handling scenarios
  - _Requirements: 1.4, 1.5, 4.5, 8.5_

- [ ] 18. Integrate Playwright tests into GitHub Pages deployment workflow
  - Configure GitHub Actions to run Playwright tests on pull requests and deployments
  - Set up cross-browser testing (Chromium, Firefox, WebKit) in CI pipeline
  - Add test reporting and artifact collection for failed test screenshots/videos
  - Configure test environment to use mock auth mode for reliable CI testing
  - Add deployment gates that prevent broken builds from reaching GitHub Pages
  - Set up test result notifications and integration with PR status checks
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 19. Optimize for production deployment
  - Configure Vite build for GitHub Pages with proper routing
  - Add bundle size optimization and code splitting
  - Implement proper CORS handling for Spotify API
  - Add production error logging and monitoring
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

- [ ] 20. Add final polish and documentation
  - Create user documentation and setup instructions
  - Add keyboard shortcuts and accessibility features
  - Implement responsive design for mobile devices
  - Write deployment guide for GitHub Pages
  - _Requirements: 9.1, 9.4_
