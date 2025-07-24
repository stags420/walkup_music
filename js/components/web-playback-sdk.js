/**
 * Spotify Web Playback SDK Component
 * 
 * This component integrates the Spotify Web Playback SDK to create a browser-based
 * playback device, eliminating the need for manual device selection in most cases.
 * 
 * Requirements: 3.3, 3.4, 1.2
 */

import { getAccessToken, isTokenValid } from './auth.js';
import spotifyConfig from '../config/spotify-config.js';

// SDK State
let player = null;
let deviceId = null;
let isSDKReady = false;
let isSDKInitializing = false;
let sdkError = null;
let isPremiumRequired = false;
let sdkReadyCallbacks = [];

// Global callback for Spotify SDK - this must be available immediately
// even if the component hasn't been initialized yet
window.onSpotifyWebPlaybackSDKReady = () => {
    console.log('Spotify Web Playback SDK is ready');
    isSDKReady = true;
    
    // Call any pending callbacks
    sdkReadyCallbacks.forEach(callback => {
        try {
            callback();
        } catch (error) {
            console.error('Error in SDK ready callback:', error);
        }
    });
    
    // Clear the callbacks array
    sdkReadyCallbacks = [];
};

// Event listeners
const eventListeners = {
    ready: [],
    not_ready: [],
    player_state_changed: [],
    initialization_error: [],
    authentication_error: [],
    account_error: [],
    playback_error: []
};

/**
 * Initialize the Spotify Web Playback SDK
 * @returns {Promise<Object>} Result object with success status and error details
 */
export async function initializeWebPlaybackSDK() {
    if (isSDKInitializing) {
        return { success: false, error: 'SDK initialization already in progress' };
    }

    if (isSDKReady && player) {
        return { success: true, deviceId: deviceId };
    }

    // Check if user is authenticated
    if (!isTokenValid()) {
        return { success: false, error: 'User must be authenticated to use Web Playback SDK' };
    }

    isSDKInitializing = true;
    sdkError = null;

    try {
        // Load the SDK script if not already loaded
        await loadSDKScript();

        // Wait for Spotify object to be available
        await waitForSpotifyObject();

        // Initialize the player
        const result = await initializePlayer();
        
        isSDKInitializing = false;
        return result;

    } catch (error) {
        isSDKInitializing = false;
        sdkError = error.message;
        console.error('Failed to initialize Web Playback SDK:', error);
        
        return {
            success: false,
            error: error.message,
            requiresPremium: error.message.includes('Premium'),
            browserCompatible: !error.message.includes('browser')
        };
    }
}

/**
 * Load the Spotify Web Playback SDK script
 * @returns {Promise<void>}
 */
function loadSDKScript() {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.Spotify) {
            resolve();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
        if (existingScript) {
            // Script is loading, wait for it
            existingScript.addEventListener('load', resolve);
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Spotify SDK script')));
            return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        
        script.addEventListener('load', resolve);
        script.addEventListener('error', () => reject(new Error('Failed to load Spotify SDK script')));
        
        document.head.appendChild(script);
    });
}

/**
 * Wait for the Spotify object to be available
 * @returns {Promise<void>}
 */
function waitForSpotifyObject() {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Spotify SDK failed to load within timeout period'));
        }, 10000); // 10 second timeout

        // If SDK is already ready, resolve immediately
        if (isSDKReady && window.Spotify) {
            clearTimeout(timeout);
            resolve();
            return;
        }

        // Add our callback to the list
        const callback = () => {
            clearTimeout(timeout);
            resolve();
        };
        
        sdkReadyCallbacks.push(callback);

        // Fallback check in case the callback doesn't fire
        const checkSpotify = () => {
            if (window.Spotify && isSDKReady) {
                clearTimeout(timeout);
                // Remove our callback from the list since we're resolving
                const index = sdkReadyCallbacks.indexOf(callback);
                if (index > -1) {
                    sdkReadyCallbacks.splice(index, 1);
                }
                resolve();
            } else {
                setTimeout(checkSpotify, 100);
            }
        };

        // Start fallback checking after a short delay
        setTimeout(checkSpotify, 1000);
    });
}

/**
 * Initialize the Spotify Web Player
 * @returns {Promise<Object>} Result object
 */
function initializePlayer() {
    return new Promise((resolve, reject) => {
        const token = getAccessToken();
        if (!token) {
            reject(new Error('No access token available'));
            return;
        }

        // Create the player instance
        player = new window.Spotify.Player({
            name: 'Walk-up Music Player',
            getOAuthToken: cb => { cb(token); },
            volume: 0.8 // Start at 80% volume
        });

        // Set up event listeners
        setupPlayerEventListeners(resolve, reject);

        // Connect to the player
        player.connect().then(success => {
            if (!success) {
                reject(new Error('Failed to connect to Spotify Web Playback SDK'));
            }
        }).catch(error => {
            reject(new Error(`Failed to connect to player: ${error.message}`));
        });
    });
}

/**
 * Set up event listeners for the Spotify Web Player
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
function setupPlayerEventListeners(resolve, reject) {
    // Ready event - player is ready to play music
    player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Web Playback SDK is ready with device ID:', device_id);
        deviceId = device_id;
        isSDKReady = true;
        
        // Notify listeners
        eventListeners.ready.forEach(callback => callback({ device_id }));
        
        resolve({ success: true, deviceId: device_id });
    });

    // Not Ready event - player lost connection
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Spotify Web Playback SDK is not ready, device ID:', device_id);
        isSDKReady = false;
        
        // Notify listeners
        eventListeners.not_ready.forEach(callback => callback({ device_id }));
    });

    // Player state changed
    player.addListener('player_state_changed', (state) => {
        if (!state) return;
        
        console.log('Player state changed:', state);
        
        // Notify listeners
        eventListeners.player_state_changed.forEach(callback => callback(state));
    });

    // Initialization Error
    player.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Web Playback SDK initialization error:', message);
        sdkError = message;
        
        // Check for specific error types
        if (message.includes('Premium')) {
            isPremiumRequired = true;
            reject(new Error('Spotify Premium account is required to use the Web Playback SDK'));
        } else if (message.includes('browser')) {
            reject(new Error('Your browser is not supported by the Spotify Web Playback SDK'));
        } else {
            reject(new Error(`Initialization error: ${message}`));
        }
        
        // Notify listeners
        eventListeners.initialization_error.forEach(callback => callback({ message }));
    });

    // Authentication Error
    player.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Web Playback SDK authentication error:', message);
        sdkError = message;
        
        // Notify listeners
        eventListeners.authentication_error.forEach(callback => callback({ message }));
        
        reject(new Error(`Authentication error: ${message}`));
    });

    // Account Error (e.g., Premium required)
    player.addListener('account_error', ({ message }) => {
        console.error('Spotify Web Playback SDK account error:', message);
        sdkError = message;
        isPremiumRequired = true;
        
        // Notify listeners
        eventListeners.account_error.forEach(callback => callback({ message }));
        
        reject(new Error(`Account error: ${message}. Spotify Premium is required.`));
    });

    // Playback Error
    player.addListener('playback_error', ({ message }) => {
        console.error('Spotify Web Playback SDK playback error:', message);
        
        // Notify listeners
        eventListeners.playback_error.forEach(callback => callback({ message }));
    });
}

/**
 * Play a track using the Web Playback SDK
 * @param {string} trackId - Spotify track ID
 * @param {number} startTime - Start time in seconds (default: 0)
 * @returns {Promise<Object>} Result object
 */
export async function playTrackWithSDK(trackId, startTime = 0) {
    if (!isSDKReady || !player || !deviceId) {
        return {
            success: false,
            error: 'Web Playback SDK is not ready. Please initialize it first.'
        };
    }

    if (!trackId || typeof trackId !== 'string') {
        return {
            success: false,
            error: 'Track ID is required and must be a string'
        };
    }

    if (typeof startTime !== 'number' || startTime < 0) {
        return {
            success: false,
            error: 'Start time must be a non-negative number'
        };
    }

    try {
        const trackUri = `spotify:track:${trackId}`;
        const positionMs = Math.floor(startTime * 1000);

        // Use the Spotify Web API to start playback on our SDK device
        const token = getAccessToken();
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: deviceId,
                uris: [trackUri],
                position_ms: positionMs
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return { success: true };

    } catch (error) {
        console.error('Failed to play track with SDK:', error);
        return {
            success: false,
            error: `Failed to play track: ${error.message}`
        };
    }
}

/**
 * Pause playback using the Web Playback SDK
 * @returns {Promise<Object>} Result object
 */
export async function pauseWithSDK() {
    if (!isSDKReady || !player) {
        return {
            success: false,
            error: 'Web Playback SDK is not ready'
        };
    }

    try {
        await player.pause();
        return { success: true };
    } catch (error) {
        console.error('Failed to pause with SDK:', error);
        return {
            success: false,
            error: `Failed to pause: ${error.message}`
        };
    }
}

/**
 * Resume playback using the Web Playback SDK
 * @returns {Promise<Object>} Result object
 */
export async function resumeWithSDK() {
    if (!isSDKReady || !player) {
        return {
            success: false,
            error: 'Web Playback SDK is not ready'
        };
    }

    try {
        await player.resume();
        return { success: true };
    } catch (error) {
        console.error('Failed to resume with SDK:', error);
        return {
            success: false,
            error: `Failed to resume: ${error.message}`
        };
    }
}

/**
 * Seek to a specific position using the Web Playback SDK
 * @param {number} positionMs - Position in milliseconds
 * @returns {Promise<Object>} Result object
 */
export async function seekWithSDK(positionMs) {
    if (!isSDKReady || !player) {
        return {
            success: false,
            error: 'Web Playback SDK is not ready'
        };
    }

    if (typeof positionMs !== 'number' || positionMs < 0) {
        return {
            success: false,
            error: 'Position must be a non-negative number in milliseconds'
        };
    }

    try {
        await player.seek(positionMs);
        return { success: true };
    } catch (error) {
        console.error('Failed to seek with SDK:', error);
        return {
            success: false,
            error: `Failed to seek: ${error.message}`
        };
    }
}

/**
 * Get current playback state from the Web Playback SDK
 * @returns {Promise<Object|null>} Current state or null if not available
 */
export async function getCurrentStateFromSDK() {
    if (!isSDKReady || !player) {
        return null;
    }

    try {
        const state = await player.getCurrentState();
        return state;
    } catch (error) {
        console.error('Failed to get current state from SDK:', error);
        return null;
    }
}

/**
 * Set volume using the Web Playback SDK
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<Object>} Result object
 */
export async function setVolumeWithSDK(volume) {
    if (!isSDKReady || !player) {
        return {
            success: false,
            error: 'Web Playback SDK is not ready'
        };
    }

    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
        return {
            success: false,
            error: 'Volume must be a number between 0.0 and 1.0'
        };
    }

    try {
        await player.setVolume(volume);
        return { success: true };
    } catch (error) {
        console.error('Failed to set volume with SDK:', error);
        return {
            success: false,
            error: `Failed to set volume: ${error.message}`
        };
    }
}

/**
 * Disconnect and cleanup the Web Playback SDK
 * @returns {Promise<void>}
 */
export async function disconnectSDK() {
    if (player) {
        try {
            await player.disconnect();
            console.log('Spotify Web Playback SDK disconnected');
        } catch (error) {
            console.error('Error disconnecting SDK:', error);
        }
        
        player = null;
        deviceId = null;
        isSDKReady = false;
        sdkError = null;
    }
}

/**
 * Add event listener for SDK events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export function addSDKEventListener(event, callback) {
    if (eventListeners[event]) {
        eventListeners[event].push(callback);
    }
}

/**
 * Remove event listener for SDK events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function to remove
 */
export function removeSDKEventListener(event, callback) {
    if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(callback);
        if (index > -1) {
            eventListeners[event].splice(index, 1);
        }
    }
}

/**
 * Get SDK status information
 * @returns {Object} Status information
 */
export function getSDKStatus() {
    return {
        isReady: isSDKReady,
        isInitializing: isSDKInitializing,
        deviceId: deviceId,
        error: sdkError,
        requiresPremium: isPremiumRequired,
        hasPlayer: !!player
    };
}

/**
 * Check if the Web Playback SDK is supported in the current browser
 * @returns {boolean} Whether SDK is supported
 */
export function isSDKSupported() {
    // Check for required browser features
    const hasWebAudio = !!(window.AudioContext || window.webkitAudioContext);
    const hasPromises = typeof Promise !== 'undefined';
    const hasFetch = typeof fetch !== 'undefined';
    const hasLocalStorage = typeof localStorage !== 'undefined';
    
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || 
                           location.protocol === 'https:' || 
                           location.hostname === 'localhost' ||
                           location.hostname === '127.0.0.1';
    
    return hasWebAudio && hasPromises && hasFetch && hasLocalStorage && isSecureContext;
}

/**
 * Get user-friendly error messages for common SDK issues
 * @param {string} error - Error message
 * @returns {Object} User-friendly error information
 */
export function getSDKErrorInfo(error) {
    const errorInfo = {
        message: error,
        userMessage: error,
        canRetry: true,
        requiresPremium: false,
        browserIssue: false
    };

    if (error.includes('Premium')) {
        errorInfo.userMessage = 'Spotify Premium is required to use the browser player. You can still use external devices for playback.';
        errorInfo.requiresPremium = true;
        errorInfo.canRetry = false;
    } else if (error.includes('browser')) {
        errorInfo.userMessage = 'Your browser doesn\'t support the Spotify Web Player. Please try using Chrome, Firefox, Safari, or Edge.';
        errorInfo.browserIssue = true;
        errorInfo.canRetry = false;
    } else if (error.includes('authentication')) {
        errorInfo.userMessage = 'Authentication failed. Please try logging out and logging back in.';
        errorInfo.canRetry = true;
    } else if (error.includes('network') || error.includes('connection')) {
        errorInfo.userMessage = 'Network connection issue. Please check your internet connection and try again.';
        errorInfo.canRetry = true;
    } else if (error.includes('timeout')) {
        errorInfo.userMessage = 'Connection timed out. Please try again.';
        errorInfo.canRetry = true;
    }

    return errorInfo;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    disconnectSDK();
});