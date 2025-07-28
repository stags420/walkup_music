// Global loader for component visibility utilities
// This file loads the ES module and makes functions available globally
import { 
    showComponent, 
    hideComponent, 
    toggleComponent, 
    isComponentVisible, 
    showOnlyComponent, 
    batchVisibilityUpdate 
} from './component-visibility.js';

// Make functions available globally
window.showComponent = showComponent;
window.hideComponent = hideComponent;
window.toggleComponent = toggleComponent;
window.isComponentVisible = isComponentVisible;
window.showOnlyComponent = showOnlyComponent;
window.batchVisibilityUpdate = batchVisibilityUpdate;