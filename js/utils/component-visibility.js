/**
 * Component Visibility Utility
 * 
 * Provides consistent methods for showing/hiding components using CSS classes
 * instead of inline styles for better performance and maintainability.
 */

/**
 * Show a component by adding the appropriate visibility class
 * @param {HTMLElement|string} element - Element or selector
 * @param {string} displayType - Type of display (block, inline-block, flex)
 */
function showComponent(element, displayType = 'block') {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    el.classList.remove('hidden');
    
    switch (displayType) {
        case 'inline-block':
            el.classList.add('visible-inline');
            el.classList.remove('visible', 'visible-flex');
            break;
        case 'flex':
            el.classList.add('visible-flex');
            el.classList.remove('visible', 'visible-inline');
            break;
        default:
            el.classList.add('visible');
            el.classList.remove('visible-inline', 'visible-flex');
    }
}

/**
 * Hide a component by adding the hidden class
 * @param {HTMLElement|string} element - Element or selector
 */
function hideComponent(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;

    el.classList.add('hidden');
    el.classList.remove('visible', 'visible-inline', 'visible-flex');
}

/**
 * Toggle component visibility
 * @param {HTMLElement|string} element - Element or selector
 * @param {boolean} show - Whether to show the component
 * @param {string} displayType - Type of display when showing
 */
function toggleComponent(element, show, displayType = 'block') {
    if (show) {
        showComponent(element, displayType);
    } else {
        hideComponent(element);
    }
}

/**
 * Check if a component is currently visible
 * @param {HTMLElement|string} element - Element or selector
 * @returns {boolean} Whether the component is visible
 */
function isComponentVisible(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return false;

    return !el.classList.contains('hidden');
}

/**
 * Show only one component from a group, hiding all others
 * @param {string} activeSelector - Selector for the component to show
 * @param {string} groupSelector - Selector for all components in the group
 * @param {string} displayType - Type of display for the active component
 */
function showOnlyComponent(activeSelector, groupSelector, displayType = 'block') {
    // Hide all components in the group
    const allComponents = document.querySelectorAll(groupSelector);
    allComponents.forEach(component => hideComponent(component));

    // Show only the active component
    showComponent(activeSelector, displayType);
}

/**
 * Batch show/hide operations for better performance
 * @param {Array} operations - Array of {element, action, displayType} objects
 */
function batchVisibilityUpdate(operations) {
    operations.forEach(({ element, action, displayType = 'block' }) => {
        switch (action) {
            case 'show':
                showComponent(element, displayType);
                break;
            case 'hide':
                hideComponent(element);
                break;
            case 'toggle':
                toggleComponent(element, !isComponentVisible(element), displayType);
                break;
        }
    });
}

// Export as ES module
export {
    showComponent,
    hideComponent,
    toggleComponent,
    isComponentVisible,
    showOnlyComponent,
    batchVisibilityUpdate
};

// Make functions available globally for HTML onclick handlers and legacy code
if (typeof window !== 'undefined') {
    window.showComponent = showComponent;
    window.hideComponent = hideComponent;
    window.toggleComponent = toggleComponent;
    window.isComponentVisible = isComponentVisible;
    window.showOnlyComponent = showOnlyComponent;
    window.batchVisibilityUpdate = batchVisibilityUpdate;
}