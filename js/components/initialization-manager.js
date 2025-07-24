/**
 * Initialization Manager Component
 * 
 * Centralized manager to prevent multiple initializations of components,
 * particularly the song segmentation and Web Playback SDK components.
 * 
 * Requirements: 3.4, 3.3
 */

// Initialization state tracking
const initializationState = {
    songSegmentation: {
        initialized: false,
        initializing: false,
        error: null,
        callbacks: []
    },
    webPlaybackSDK: {
        initialized: false,
        initializing: false,
        error: null,
        callbacks: []
    }
};

// Component references for cleanup
const componentReferences = {
    songSegmentation: null,
    webPlaybackSDK: null
};

/**
 * Initialize song segmentation component with single initialization guarantee
 * @returns {Promise<Object>} Result object with success status
 */
async function initializeSongSegmentation() {
    const state = initializationState.songSegmentation;
    
    console.log('InitManager: Song segmentation initialization requested', {
        initialized: state.initialized,
        initializing: state.initializing,
        error: state.error
    });
    
    // If already initialized, return success immediately
    if (state.initialized) {
        console.log('InitManager: Song segmentation already initialized, skipping');
        return { success: true, alreadyInitialized: true };
    }
    
    // If currently initializing, wait for completion
    if (state.initializing) {
        console.log('InitManager: Song segmentation initialization in progress, waiting...');
        return new Promise((resolve) => {
            state.callbacks.push(resolve);
        });
    }
    
    // Start initialization
    state.initializing = true;
    state.error = null;
    console.log('InitManager: Starting song segmentation initialization...');
    
    try {
        // Use different import strategy based on environment
        let initSongSegmentation;
        
        if (typeof module !== 'undefined' && module.exports) {
            // Jest/Node.js environment - use require
            const songSegmentationModule = require('./song-segmentation.js');
            initSongSegmentation = songSegmentationModule.initSongSegmentation;
        } else {
            // Browser environment - use dynamic import
            const { initSongSegmentation: importedInit } = await import('./song-segmentation.js');
            initSongSegmentation = importedInit;
        }
        
        // Call the actual initialization
        await initSongSegmentation();
        
        // Mark as initialized
        state.initialized = true;
        state.initializing = false;
        
        console.log('InitManager: Song segmentation initialization completed successfully');
        
        // Notify all waiting callbacks (they get a different result)
        const waitingResult = { success: true, justInitialized: false };
        state.callbacks.forEach(callback => callback(waitingResult));
        state.callbacks = [];
        
        // Return result for the initiating call
        return { success: true, justInitialized: true };
        
    } catch (error) {
        console.error('InitManager: Song segmentation initialization failed:', error);
        
        state.initializing = false;
        state.error = error.message;
        
        // Notify all waiting callbacks of failure
        const result = { success: false, error: error.message };
        state.callbacks.forEach(callback => callback(result));
        state.callbacks = [];
        
        return result;
    }
}

/**
 * Initialize Web Playback SDK with single initialization guarantee
 * @returns {Promise<Object>} Result object with success status
 */
async function initializeWebPlaybackSDK() {
    const state = initializationState.webPlaybackSDK;
    
    console.log('InitManager: Web Playback SDK initialization requested', {
        initialized: state.initialized,
        initializing: state.initializing,
        error: state.error
    });
    
    // If already initialized, return success immediately
    if (state.initialized) {
        console.log('InitManager: Web Playback SDK already initialized, skipping');
        return { success: true, alreadyInitialized: true };
    }
    
    // If currently initializing, wait for completion
    if (state.initializing) {
        console.log('InitManager: Web Playback SDK initialization in progress, waiting...');
        return new Promise((resolve) => {
            state.callbacks.push(resolve);
        });
    }
    
    // Start initialization
    state.initializing = true;
    state.error = null;
    console.log('InitManager: Starting Web Playback SDK initialization...');
    
    try {
        // Use different import strategy based on environment
        let initializeWebPlaybackSDK;
        
        if (typeof module !== 'undefined' && module.exports) {
            // Jest/Node.js environment - use require
            const webPlaybackSDKModule = require('./web-playback-sdk.js');
            initializeWebPlaybackSDK = webPlaybackSDKModule.initializeWebPlaybackSDK;
        } else {
            // Browser environment - use dynamic import
            const { initializeWebPlaybackSDK: importedInit } = await import('./web-playback-sdk.js');
            initializeWebPlaybackSDK = importedInit;
        }
        
        // Call the actual initialization
        const result = await initializeWebPlaybackSDK();
        
        if (result.success) {
            // Mark as initialized
            state.initialized = true;
            state.initializing = false;
            
            console.log('InitManager: Web Playback SDK initialization completed successfully');
            
            // Notify all waiting callbacks (they get a different result)
            const waitingResult = { success: true, justInitialized: false, deviceId: result.deviceId };
            state.callbacks.forEach(callback => callback(waitingResult));
            state.callbacks = [];
            
            // Return result for the initiating call
            return { success: true, justInitialized: true, deviceId: result.deviceId };
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('InitManager: Web Playback SDK initialization failed:', error);
        
        state.initializing = false;
        state.error = error.message;
        
        // Notify all waiting callbacks of failure
        const result = { success: false, error: error.message };
        state.callbacks.forEach(callback => callback(result));
        state.callbacks = [];
        
        return result;
    }
}

/**
 * Check if song segmentation is initialized
 * @returns {boolean} Whether song segmentation is initialized
 */
function isSongSegmentationInitialized() {
    return initializationState.songSegmentation.initialized;
}

/**
 * Check if Web Playback SDK is initialized
 * @returns {boolean} Whether Web Playback SDK is initialized
 */
function isWebPlaybackSDKInitialized() {
    return initializationState.webPlaybackSDK.initialized;
}

/**
 * Get initialization status for all components
 * @returns {Object} Status object with initialization states
 */
function getInitializationStatus() {
    return {
        songSegmentation: {
            initialized: initializationState.songSegmentation.initialized,
            initializing: initializationState.songSegmentation.initializing,
            error: initializationState.songSegmentation.error
        },
        webPlaybackSDK: {
            initialized: initializationState.webPlaybackSDK.initialized,
            initializing: initializationState.webPlaybackSDK.initializing,
            error: initializationState.webPlaybackSDK.error
        }
    };
}

/**
 * Reset initialization state for a component (for re-initialization scenarios)
 * @param {string} component - Component name ('songSegmentation' or 'webPlaybackSDK')
 */
function resetInitializationState(component) {
    if (initializationState[component]) {
        console.log(`InitManager: Resetting initialization state for ${component}`);
        
        const state = initializationState[component];
        state.initialized = false;
        state.initializing = false;
        state.error = null;
        
        // Clear any pending callbacks
        state.callbacks.forEach(callback => {
            callback({ success: false, error: 'Initialization reset' });
        });
        state.callbacks = [];
    }
}

/**
 * Reset all initialization states (typically called on logout)
 */
function resetAllInitializationStates() {
    console.log('InitManager: Resetting all initialization states');
    
    Object.keys(initializationState).forEach(component => {
        resetInitializationState(component);
    });
}

/**
 * Cleanup all initialized components
 * @returns {Promise<void>}
 */
async function cleanupAllComponents() {
    console.log('InitManager: Cleaning up all components');
    
    // Cleanup Web Playback SDK if initialized
    if (initializationState.webPlaybackSDK.initialized) {
        try {
            let disconnectSDK;
            
            if (typeof module !== 'undefined' && module.exports) {
                // Jest/Node.js environment - use require
                const webPlaybackSDKModule = require('./web-playback-sdk.js');
                disconnectSDK = webPlaybackSDKModule.disconnectSDK;
            } else {
                // Browser environment - use dynamic import
                const { disconnectSDK: importedDisconnect } = await import('./web-playback-sdk.js');
                disconnectSDK = importedDisconnect;
            }
            
            await disconnectSDK();
            console.log('InitManager: Web Playback SDK cleaned up');
        } catch (error) {
            console.error('InitManager: Error cleaning up Web Playback SDK:', error);
        }
    }
    
    // Reset all states after cleanup
    resetAllInitializationStates();
}

/**
 * Initialize components in the correct order when user is authenticated
 * This is the main entry point for lazy initialization
 * @returns {Promise<Object>} Result object with initialization results
 */
async function initializeAuthenticatedComponents() {
    console.log('InitManager: Initializing authenticated components...');
    
    const results = {
        songSegmentation: null,
        webPlaybackSDK: null,
        success: true,
        errors: []
    };
    
    try {
        // Initialize song segmentation first (it will initialize SDK as needed)
        results.songSegmentation = await initializeSongSegmentation();
        
        if (!results.songSegmentation.success) {
            results.success = false;
            results.errors.push(`Song segmentation: ${results.songSegmentation.error}`);
        }
        
        console.log('InitManager: Authenticated components initialization completed', results);
        return results;
        
    } catch (error) {
        console.error('InitManager: Error during authenticated components initialization:', error);
        results.success = false;
        results.errors.push(error.message);
        return results;
    }
}

/**
 * Add event listeners for authentication state changes
 */
function setupAuthEventListeners() {
    // Listen for logout events to cleanup components
    document.addEventListener('authLogout', () => {
        console.log('InitManager: Auth logout detected, cleaning up components');
        cleanupAllComponents();
    });
    
    // Listen for authentication success to initialize components
    document.addEventListener('authSuccess', () => {
        console.log('InitManager: Auth success detected, will initialize components on demand');
        // Note: We don't auto-initialize here, we wait for lazy initialization
    });
}

// Set up event listeners when module loads
setupAuthEventListeners();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    cleanupAllComponents();
});

// Export functions for both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    // CommonJS exports for Jest testing
    module.exports = {
        initializeSongSegmentation,
        initializeWebPlaybackSDK,
        isSongSegmentationInitialized,
        isWebPlaybackSDKInitialized,
        getInitializationStatus,
        resetInitializationState,
        resetAllInitializationStates,
        cleanupAllComponents,
        initializeAuthenticatedComponents
    };
} else {
    // ES module exports for browser usage
    window.InitializationManager = {
        initializeSongSegmentation,
        initializeWebPlaybackSDK,
        isSongSegmentationInitialized,
        isWebPlaybackSDKInitialized,
        getInitializationStatus,
        resetInitializationState,
        resetAllInitializationStates,
        cleanupAllComponents,
        initializeAuthenticatedComponents
    };
}