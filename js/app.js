// Main application entry point
import { initNavigation, handleResponsiveLayout } from './utils/navigation.js';
import { isAuthenticated, logout, initAuth } from './components/auth.js';
import { createUrl } from './utils/url-utils.js';

/**
 * Initialize the application
 */
async function initApp() {
    console.log('Spotify Walk-up Music App initialized');

    // Initialize navigation and layout first
    initNavigation();
    handleResponsiveLayout();
    initBootstrapComponents();
    initLogoutButton();

    // Handle special URL cases first
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

    // Initialize auth component (sets up login button)
    initAuth();

    // Check authentication status - this is synchronous and blocks everything else
    const authenticated = isAuthenticated();

    if (!authenticated) {
        // Show login page - don't initialize anything else
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
    // Hide authenticated sections
    const authenticatedSections = document.querySelectorAll('.authenticated-content');
    authenticatedSections.forEach(section => {
        section.style.display = 'none';
    });

    // Show login section
    const loginSection = document.querySelector('.login-section');
    if (loginSection) {
        loginSection.style.display = 'block';
    }

    console.log('Showing login page - user not authenticated');
}

/**
 * Initialize the authenticated application with all components
 */
async function initAuthenticatedApp() {
    console.log('Initializing authenticated application...');

    // Hide login section
    const loginSection = document.querySelector('.login-section');
    if (loginSection) {
        loginSection.style.display = 'none';
    }

    // Show authenticated sections
    const authenticatedSections = document.querySelectorAll('.authenticated-content');
    authenticatedSections.forEach(section => {
        section.style.display = 'block';
    });

    try {
        // Initialize components with dependency injection
        const { initPlayerManagement } = await import('./components/player-management.js');
        const { initSongSegmentation } = await import('./components/song-segmentation.js');
        const { initializeWebPlaybackSDK } = await import('./components/web-playback-sdk.js');
        const spotifyAPI = await import('./components/spotify-api.js');

        // Initialize Web Playback SDK first
        await initializeWebPlaybackSDK();

        // Initialize enhanced playback system
        const enhancedResult = await spotifyAPI.initializeEnhancedPlayback();
        if (enhancedResult.success && enhancedResult.sdkReady) {
            spotifyAPI.setSDKPreference(true);
            console.log('Enhanced playback system initialized with SDK support');
        } else {
            console.log('Enhanced playback system initialized in fallback mode');
        }

        // Initialize components with dependencies
        await initPlayerManagement(spotifyAPI);
        await initSongSegmentation(spotifyAPI);

        console.log('Authenticated application initialized successfully');
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