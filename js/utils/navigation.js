/**
 * Navigation utility for handling view switching
 */

// Store references to DOM elements
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');
const navbarCollapse = document.getElementById('navbarNav');
const navbarToggler = document.querySelector('.navbar-toggler');

/**
 * Initialize navigation functionality
 */
export function initNavigation() {
    // Add click event listeners to all navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            switchView(targetView);
            
            // Close the mobile navbar if it's open
            if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
                const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                bsCollapse.hide();
            }
        });
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.view) {
            switchView(e.state.view, false);
        }
    });
    
    // Initialize view based on URL hash if present
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(`${hash}-view`)) {
        switchView(hash, false);
    }
}

/**
 * Switch to the specified view
 * @param {string} viewId - The ID of the view to switch to
 * @param {boolean} pushState - Whether to push state to browser history
 */
export function switchView(viewId, pushState = true) {
    // Remove active class from all views and nav links
    views.forEach(view => view.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to target view and corresponding nav link
    const targetView = document.getElementById(`${viewId}-view`);
    const targetLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);
    
    if (targetView && targetLink) {
        targetView.classList.add('active');
        targetLink.classList.add('active');
        
        // Update browser history
        if (pushState) {
            window.history.pushState({ view: viewId }, '', `#${viewId}`);
        }
        
        // Scroll to top when changing views
        window.scrollTo(0, 0);
    }
}

/**
 * Check if user is authenticated and switch to appropriate view
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
export function navigateBasedOnAuth(isAuthenticated) {
    // Show/hide navigation items based on authentication status
    const authOnlyItems = document.querySelectorAll('.auth-only');
    const appOnlyItems = document.querySelectorAll('.app-only');
    
    if (isAuthenticated) {
        // Show app navigation items and hide auth items
        authOnlyItems.forEach(item => item.style.display = 'none');
        appOnlyItems.forEach(item => item.style.display = 'block');
        
        // Switch to players view
        switchView('players');
        
        // Dispatch navigation event for authenticated state
        dispatchNavigationEvent('navigatedToApp', { isAuthenticated: true });
    } else {
        // Show auth navigation items and hide app items
        authOnlyItems.forEach(item => item.style.display = 'block');
        appOnlyItems.forEach(item => item.style.display = 'none');
        
        // Switch to auth view
        switchView('auth');
        
        // Dispatch navigation event for unauthenticated state
        dispatchNavigationEvent('navigatedToAuth', { isAuthenticated: false });
    }
}

/**
 * Dispatch navigation-related events
 * @param {string} eventType - The type of navigation event
 * @param {Object} detail - Event details
 */
function dispatchNavigationEvent(eventType, detail) {
    const event = new CustomEvent(eventType, { detail });
    document.dispatchEvent(event);
    console.log(`Dispatched ${eventType} event:`, detail);
}

/**
 * Check if the device is mobile
 * @returns {boolean} Whether the device is mobile
 */
export function isMobileDevice() {
    return window.innerWidth < 768;
}

/**
 * Update UI elements based on screen size
 */
export function handleResponsiveLayout() {
    const isMobile = isMobileDevice();
    
    // Adjust UI elements based on screen size
    if (isMobile) {
        // Mobile-specific adjustments
        document.querySelectorAll('.desktop-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.mobile-only').forEach(el => el.style.display = 'block');
    } else {
        // Desktop-specific adjustments
        document.querySelectorAll('.desktop-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.mobile-only').forEach(el => el.style.display = 'none');
    }
}

// Add resize event listener to handle responsive layout changes
window.addEventListener('resize', handleResponsiveLayout);