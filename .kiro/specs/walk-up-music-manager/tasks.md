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

- [ ] 7. Implement player management service
  - Create PlayerService class with CRUD operations for players
  - Add song selection and segment timing functionality
  - Implement player data persistence using storage service
  - Write unit tests for player management operations
  - _Requirements: 2.1, 2.5, 2.6, 2.7_

- [ ] 8. Build Spotify API integration
  - Create Spotify Web API client with search functionality
  - Implement song search with proper error handling and rate limiting
  - Add track metadata parsing and preview URL handling
  - Create unit tests for API integration with mocked responses
  - _Requirements: 2.2, 2.3_

- [ ] 9. Integrate Spotify functionality into player management UI
  - Connect SongSelector component with Spotify API search
  - Add song preview functionality and segment selection
  - Implement drag-and-drop or intuitive selection for song segments
  - Update PlayerForm to work with real Spotify track data
  - Write integration tests for Spotify-enabled player management
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7_

- [ ] 10. Implement game control service
  - Create GameService class for batting order management
  - Add current batter tracking and position advancement
  - Integrate music playback with batter transitions
  - Write unit tests for game state management and music integration
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.3, 5.4_

- [ ] 11. Build batting order management UI
  - Create BattingOrderManager component for creating and editing orders
  - Implement OrderBuilder with drag-and-drop player arrangement
  - Add current position tracking and modification controls
  - Write component tests for batting order interface
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 12. Create Spotify Web Playback SDK integration
  - Initialize Spotify Web Playback SDK with proper error handling
  - Implement music playback with precise segment timing control
  - Add device selection and playback state management
  - Create unit tests for playback functionality with SDK mocking
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 13. Create game mode interface
  - Build CurrentBatterDisplay showing current, on-deck, and in-the-hole batters
  - Create GameControls component with "Next Batter" button
  - Add visual feedback for music playback state
  - Implement mode switching between edit and game modes
  - Write component tests for game mode interface
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

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

- [ ] 18. Create integration tests
  - Write end-to-end tests for complete user workflows
  - Test Spotify API integration with real API calls
  - Add cross-browser compatibility testing
  - Test GitHub Pages deployment configuration
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
