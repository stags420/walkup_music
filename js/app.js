// Main application entry point
import { initNavigation, handleResponsiveLayout } from './utils/navigation.js';
import { isAuthenticated, logout, initAuth } from './components/auth.js';
import { createUrl } from './utils/url-utils.js';
// Component visibility utility will be loaded as a script tag

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Initializing Spotify Walk-up Music App...');

    // Handle special URL cases first - these might redirect
    const urlParams = new URLSearchParams(window.location.search);

    // Check if we need to retry authentication with implicit flow
    if (urlParams.has('retry_auth') && urlParams.get('retry_auth') === 'true') {
        console.log('Retrying authentication with implicit flow');
        const state = localStorage.getItem('spotify_auth_retry_state') || '';
        localStorage.removeItem('spotify_auth_retry_state');
        const { authenticateWithImplicitFlow } = await import('./components/auth.js');
        authenticateWithImplicitFlow(state);
        return;
    }

    // Check for authentication callback
    if (checkForAuthCallback()) {
        return; // Callback handling will redirect
    }

    // Clean up auth success URL parameter
    if (urlParams.has('auth_success')) {
        localStorage.removeItem('spotify_auth_success');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initialize basic UI components needed for both authenticated and unauthenticated states
    initNavigation();
    handleResponsiveLayout();
    initBootstrapComponents();

    // Check authentication status and route accordingly
    const authenticated = isAuthenticated();

    if (!authenticated) {
        showLoginPage();
        return;
    }

    // User is authenticated - initialize the full application
    await initAuthenticatedApp();
}

/**
 * Initialize the logout button
 */
function initLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

/**
 * Show the login page by hiding authenticated content and showing login UI
 */
function showLoginPage() {
    // Initialize auth component (sets up login button)
    initAuth();

    // Use the new utility to show only the login section
    showOnlyComponent('.login-section', '.login-section, .authenticated-content');

    console.log('Showing login page - user not authenticated');
}

/**
 * Initialize the authenticated application with all components
 */
async function initAuthenticatedApp() {
    console.log('Initializing authenticated application...');

    initLogoutButton();

    // Hide login section
    hideComponent('.login-section');

    try {
        // Initialize components using the centralized initialization manager
        const { initPlayerManagement } = await import('./components/player-management.js');
        await import('./components/initialization-manager.js'); // This sets up window.InitializationManager
        const spotifyAPI = await import('./components/spotify-api.js');

        // Initialize enhanced playback system
        const enhancedResult = await spotifyAPI.initializeEnhancedPlayback();
        if (enhancedResult.success && enhancedResult.sdkReady) {
            spotifyAPI.setSDKPreference(true);
            console.log('Enhanced playback system initialized with SDK support');
        } else {
            console.log('Enhanced playback system initialized in fallback mode');
        }

        // Initialize player management with dependency injection
        console.log('Initializing player management...');
        initPlayerManagement(spotifyAPI);
        console.log('Player management initialized');

        // Initialize all authenticated components through the initialization manager
        console.log('Initializing authenticated components through initialization manager...');
        const initResult = await window.InitializationManager.initializeAuthenticatedComponents(spotifyAPI);

        if (!initResult.success) {
            console.error('Failed to initialize some components:', initResult.errors);
            // Still continue to show UI, but log the errors
        }

        console.log('All components initialized successfully');

        // ONLY AFTER components are initialized, show the UI
        const authenticatedSections = document.querySelectorAll('.authenticated-content');
        authenticatedSections.forEach(section => {
            showComponent(section);
        });

        console.log('Spotify Walk-up Music App fully initialized');
    } catch (error) {
        console.error('Error initializing authenticated application:', error);
        // Could show an error message to user here
    }
}

/**
 * Check if the current page load is from an authentication callback
 * @returns {boolean} Whether this is a callback that needs handling
 */
function checkForAuthCallback() {
    // If we have a code parameter in the URL or an access_token in the hash and we're not on the callback page,
    // it might be an authentication callback that was redirected incorrectly
    if ((window.location.search.includes('code=') || window.location.hash.includes('access_token=')) &&
        !window.location.pathname.includes('callback.html')) {
        console.warn('Authentication callback detected on main page. Redirecting to callback handler.');

        // Redirect to the callback page with the current query string or hash
        const callbackUrl = createUrl('callback.html');
        if (window.location.search.includes('code=')) {
            window.location.href = `${callbackUrl}${window.location.search}`;
        } else {
            window.location.href = `${callbackUrl}${window.location.hash}`;
        }
        return true;
    }
    return false;
}

/**
 * Initialize Bootstrap components
 */
function initBootstrapComponents() {
    // Initialize all tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (window.bootstrap && window.bootstrap.Tooltip) {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    // Initialize all popovers
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    if (window.bootstrap && window.bootstrap.Popover) {
        [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);