// Main application entry point
import { initNavigation, handleResponsiveLayout } from './utils/navigation.js';
import { checkAuthentication } from './components/auth.js';

/**
 * Initialize the application
 */
function initApp() {
    console.log('Spotify Walk-up Music App initialized');
    
    // Initialize navigation
    initNavigation();
    
    // Handle responsive layout
    handleResponsiveLayout();
    
    // Check if user is already authenticated
    checkAuthentication();
    
    // Initialize tooltips and popovers
    initBootstrapComponents();
}

/**
 * Initialize Bootstrap components
 */
function initBootstrapComponents() {
    // Initialize all tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    
    // Initialize all popovers
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);