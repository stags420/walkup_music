// Main application entry point
import { initNavigation, handleResponsiveLayout } from './utils/navigation.js';
import { checkAuthentication, logout } from './components/auth.js';

/**
 * Initialize the application
 */
function initApp() {
    console.log('Spotify Walk-up Music App initialized');
    
    // Initialize navigation
    initNavigation();
    
    // Handle responsive layout
    handleResponsiveLayout();
    
    // Initialize logout button
    initLogoutButton();
    
    // Check if user is already authenticated
    checkAuthentication();
    
    // Initialize Bootstrap components
    initBootstrapComponents();
    
    // Check for authentication callback
    checkForAuthCallback();
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
 * Check if the current page load is from an authentication callback
 */
function checkForAuthCallback() {
    // If we have a hash in the URL and we're not on the callback page,
    // it might be an authentication callback that was redirected incorrectly
    if (window.location.hash.includes('access_token') && !window.location.pathname.includes('callback.html')) {
        console.warn('Authentication callback detected on main page. Redirecting to callback handler.');
        // Redirect to the callback page with the current hash
        window.location.href = `${window.location.origin}/callback.html${window.location.hash}`;
    }
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