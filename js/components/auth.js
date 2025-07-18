/**
 * Authentication component for Spotify integration
 */
import { navigateBasedOnAuth } from '../utils/navigation.js';
import spotifyConfig from '../config/spotify-config.js';
import { setCookie, getCookie, deleteCookie } from '../utils/cookie-utils.js';

// DOM Elements
const spotifyLoginButton = document.getElementById('spotify-login');

// Cookie names
const ACCESS_TOKEN_COOKIE = 'spotify_access_token';
const TOKEN_EXPIRATION_COOKIE = 'spotify_token_expiration';
const REFRESH_TOKEN_COOKIE = 'spotify_refresh_token';

/**
 * Initialize authentication component
 */
function init() {
    // Add event listener to login button
    if (spotifyLoginButton) {
        spotifyLoginButton.addEventListener('click', authenticateWithSpotify);
    }
}

/**
 * Check if user is already authenticated
 * @returns {boolean} Whether the user is authenticated
 */
export function checkAuthentication() {
    // Get authentication data from cookies
    let accessToken = getCookie(ACCESS_TOKEN_COOKIE);
    let tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
    
    // If not found in cookies, try localStorage
    if (!accessToken) {
        accessToken = localStorage.getItem(ACCESS_TOKEN_COOKIE);
    }
    
    if (!tokenExpiration) {
        tokenExpiration = localStorage.getItem(TOKEN_EXPIRATION_COOKIE);
    }

    // Check if token exists and is not expired
    const isAuthenticated = accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);

    // If token is about to expire (within 5 minutes), try to refresh it
    if (accessToken && tokenExpiration) {
        const expirationTime = parseInt(tokenExpiration);
        const isAboutToExpire = Date.now() > expirationTime - (5 * 60 * 1000);
        
        if (isAboutToExpire) {
            console.log('Token is about to expire, refreshing...');
            // Use setTimeout to avoid blocking the UI
            setTimeout(() => {
                refreshToken().then(success => {
                    if (success) {
                        console.log('Token refreshed successfully');
                    } else {
                        console.warn('Token refresh failed');
                    }
                });
            }, 0);
        }
    }

    // Initialize the auth component
    init();

    // Navigate based on authentication status
    navigateBasedOnAuth(isAuthenticated);

    return isAuthenticated;
}

/**
 * Authenticate with Spotify using Authorization Code flow
 * Redirects the user to Spotify's authorization page
 */
export function authenticateWithSpotify() {
    // Generate a random state value for security
    const state = generateRandomString(16);

    // Store the state in both cookie and localStorage for verification when the user returns
    setCookie('spotify_auth_state', state, 1);
    localStorage.setItem('spotify_auth_state', state);

    console.log('Setting auth state:', state);

    // Construct the authorization URL with required parameters
    const authUrl = new URL(spotifyConfig.authEndpoint);

    // Add query parameters
    authUrl.searchParams.append('client_id', spotifyConfig.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', spotifyConfig.redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', spotifyConfig.scopes.join(' '));
    authUrl.searchParams.append('show_dialog', 'true');

    // Redirect to Spotify authorization page
    window.location.href = authUrl.toString();
}

/**
 * Authenticate with Spotify using Implicit Grant flow
 * Redirects the user to Spotify's authorization page
 * @param {string} existingState - Optional existing state to reuse
 */
export function authenticateWithImplicitFlow(existingState = '') {
    // Generate a random state value for security or use the existing one
    const state = existingState || generateRandomString(16);

    // Store the state in both cookie and localStorage for verification when the user returns
    setCookie('spotify_auth_state', state, 1);
    localStorage.setItem('spotify_auth_state', state);

    console.log('Setting auth state for implicit flow:', state);

    // Construct the authorization URL with required parameters
    const authUrl = new URL(spotifyConfig.authEndpoint);

    // Add query parameters for implicit flow (response_type=token instead of code)
    authUrl.searchParams.append('client_id', spotifyConfig.clientId);
    authUrl.searchParams.append('response_type', 'token');
    authUrl.searchParams.append('redirect_uri', spotifyConfig.redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', spotifyConfig.scopes.join(' '));
    authUrl.searchParams.append('show_dialog', 'true');

    // Redirect to Spotify authorization page
    window.location.href = authUrl.toString();
}

/**
 * Handle the authentication callback from Spotify
 * This function is called from the callback.html page
 * @param {Object} params - The URL query parameters from the callback
 */
export function handleAuthCallback(params) {
    // For Authorization Code flow, the parameters are in the query string, not the hash
    // Extract parameters from the callback URL
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    console.log('Received state:', state);

    // Get the stored state from cookies or localStorage
    let storedState = getCookie('spotify_auth_state');
    
    // If not found in cookies, try localStorage
    if (!storedState) {
        storedState = localStorage.getItem('spotify_auth_state');
        console.log('Using state from localStorage:', storedState);
    } else {
        console.log('Using state from cookies:', storedState);
    }

    // Clear the state storage as it's no longer needed
    deleteCookie('spotify_auth_state');
    localStorage.removeItem('spotify_auth_state');

    // Check if there was an error or if the state doesn't match
    if (error) {
        console.error('Authentication error:', error);
        return { success: false, error: error };
    }

    if (!state) {
        console.error('No state received');
        return { success: false, error: 'no_state' };
    }
    
    if (!storedState) {
        console.error('No stored state found');
        return { success: false, error: 'no_stored_state' };
    }
    
    if (state !== storedState) {
        console.error('State mismatch error. Received:', state, 'Stored:', storedState);
        return { success: false, error: 'state_mismatch' };
    }

    if (!code) {
        console.error('No authorization code received');
        return { success: false, error: 'no_code' };
    }

    // In a real application, we would exchange the code for an access token here
    // using a server-side component. Since we're in a client-side only app,
    // we'll simulate a successful authentication for now.
    
    // For demo purposes, we'll set a mock token
    const mockToken = 'mock_token_' + generateRandomString(32);
    const mockRefreshToken = 'refresh_token_' + generateRandomString(32);
    const expirationTime = Date.now() + (3600 * 1000); // 1 hour
    
    // Store the tokens in cookies
    setCookie(ACCESS_TOKEN_COOKIE, mockToken, 1); // Store for 1 day max
    setCookie(TOKEN_EXPIRATION_COOKIE, expirationTime, 1);
    setCookie(REFRESH_TOKEN_COOKIE, mockRefreshToken, 30); // Store refresh token for 30 days
    
    // Also store in localStorage as a backup
    localStorage.setItem(ACCESS_TOKEN_COOKIE, mockToken);
    localStorage.setItem(TOKEN_EXPIRATION_COOKIE, expirationTime.toString());
    localStorage.setItem(REFRESH_TOKEN_COOKIE, mockRefreshToken);
    
    console.log('Authentication successful with code:', code);
    
    return { success: true };
}

/**
 * Refresh the authentication token
 * Note: Implicit grant doesn't support refresh tokens, so we'll need to re-authenticate
 * 
 * This function checks if the token is about to expire and attempts to refresh it
 * If the refresh fails, it will prompt the user to re-authenticate
 * 
 * @returns {Promise<boolean>} Whether the token was successfully refreshed
 */
export async function refreshToken() {
    // Get the current token expiration time
    const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
    
    // If there's no expiration time or refresh token, we can't refresh
    if (!tokenExpiration) {
        console.warn('No token expiration found, cannot refresh');
        return false;
    }
    
    // Check if the token is expired or about to expire (within 5 minutes)
    const expirationTime = parseInt(tokenExpiration);
    const isExpired = Date.now() > expirationTime;
    const isAboutToExpire = Date.now() > expirationTime - (5 * 60 * 1000);
    
    // If the token is not about to expire, no need to refresh
    if (!isAboutToExpire) {
        console.log('Token is still valid, no need to refresh');
        return true;
    }
    
    console.log(`Token is ${isExpired ? 'expired' : 'about to expire'}, attempting to refresh...`);
    
    try {
        // In a real application with a server component, we would use the refresh token
        // to get a new access token. Since we're in a client-side only app,
        // we'll use the implicit flow to get a new token.
        
        // For this demo, we'll simulate a token refresh
        if (refreshToken) {
            console.log('Using refresh token to get a new access token');
            // This would be a server call in a real application
            // For now, we'll simulate a successful refresh
            const mockToken = 'refreshed_token_' + generateRandomString(32);
            const newExpirationTime = Date.now() + (3600 * 1000); // 1 hour
            
            // Store the new token
            setCookie(ACCESS_TOKEN_COOKIE, mockToken, 1);
            setCookie(TOKEN_EXPIRATION_COOKIE, newExpirationTime, 1);
            
            // Also store in localStorage as a backup
            localStorage.setItem(ACCESS_TOKEN_COOKIE, mockToken);
            localStorage.setItem(TOKEN_EXPIRATION_COOKIE, newExpirationTime.toString());
            
            console.log('Token refreshed successfully');
            return true;
        } else {
            // No refresh token available, we need to re-authenticate
            // In a real application, we would use a silent refresh iframe
            // For now, we'll check if we're in an interactive context
            
            if (document.visibilityState === 'visible') {
                // We're in an interactive context, show a notification to the user
                console.log('No refresh token available, need to re-authenticate');
                
                // Create a notification element
                const notification = document.createElement('div');
                notification.className = 'auth-notification';
                notification.innerHTML = `
                    <div class="auth-notification-content">
                        <p>Your session has expired. Please re-authenticate.</p>
                        <button id="reauth-button" class="btn btn-spotify btn-sm">Re-authenticate</button>
                    </div>
                `;
                
                // Add the notification to the body
                document.body.appendChild(notification);
                
                // Add event listener to the re-authenticate button
                document.getElementById('reauth-button').addEventListener('click', () => {
                    // Remove the notification
                    document.body.removeChild(notification);
                    
                    // Re-authenticate
                    authenticateWithSpotify();
                });
                
                // Auto-remove the notification after 10 seconds
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 10000);
                
                return false;
            } else {
                // We're not in an interactive context, just clear the token
                // The user will be prompted to authenticate on the next interaction
                console.log('Not in interactive context, clearing token');
                logout();
                return false;
            }
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        
        // Handle refresh failure
        // If we're in an interactive context, show an error message
        if (document.visibilityState === 'visible') {
            // Create an error notification
            const notification = document.createElement('div');
            notification.className = 'auth-notification auth-error';
            notification.innerHTML = `
                <div class="auth-notification-content">
                    <p>Failed to refresh authentication. Please try again.</p>
                    <button id="reauth-button" class="btn btn-spotify btn-sm">Re-authenticate</button>
                </div>
            `;
            
            // Add the notification to the body
            document.body.appendChild(notification);
            
            // Add event listener to the re-authenticate button
            document.getElementById('reauth-button').addEventListener('click', () => {
                // Remove the notification
                document.body.removeChild(notification);
                
                // Re-authenticate
                authenticateWithSpotify();
            });
            
            // Auto-remove the notification after 10 seconds
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 10000);
        } else {
            // Not in interactive context, just clear the token
            logout();
        }
        
        return false;
    }
}

/**
 * Log out the user by clearing authentication cookies and localStorage
 */
export function logout() {
    // Clear cookies
    deleteCookie(ACCESS_TOKEN_COOKIE);
    deleteCookie(TOKEN_EXPIRATION_COOKIE);
    deleteCookie(REFRESH_TOKEN_COOKIE);
    
    // Clear localStorage
    localStorage.removeItem(ACCESS_TOKEN_COOKIE);
    localStorage.removeItem(TOKEN_EXPIRATION_COOKIE);
    localStorage.removeItem(REFRESH_TOKEN_COOKIE);

    // Navigate back to the authentication view
    navigateBasedOnAuth(false);
}

/**
 * Get the current access token
 * @returns {string|null} The access token or null if not authenticated
 */
export function getAccessToken() {
    // Check if the token is valid first
    if (!isTokenValid()) {
        return null;
    }
    return getCookie(ACCESS_TOKEN_COOKIE);
}

/**
 * Get the current refresh token
 * @returns {string|null} The refresh token or null if not available
 */
export function getRefreshToken() {
    return getCookie(REFRESH_TOKEN_COOKIE);
}

/**
 * Check if the access token is valid
 * @returns {boolean} Whether the access token is valid
 */
export function isTokenValid() {
    const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
    const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);
    
    if (!accessToken || !tokenExpiration) {
        return false;
    }
    
    const expirationTime = parseInt(tokenExpiration);
    const isExpired = Date.now() > expirationTime;
    
    // If the token is expired, try to refresh it
    if (isExpired) {
        console.log('Token is expired, attempting to refresh');
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
            refreshToken().then(success => {
                if (!success) {
                    console.warn('Token refresh failed, user needs to re-authenticate');
                }
            });
        }, 0);
        return false;
    }
    
    // If the token is about to expire (within 5 minutes), try to refresh it in the background
    const isAboutToExpire = Date.now() > expirationTime - (5 * 60 * 1000);
    if (isAboutToExpire) {
        console.log('Token is about to expire, refreshing in the background');
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => {
            refreshToken().then(success => {
                if (success) {
                    console.log('Token refreshed successfully in the background');
                } else {
                    console.warn('Background token refresh failed');
                }
            });
        }, 0);
    }
    
    return true;
}

/**
 * Generate a random string of specified length
 * Used for the state parameter in OAuth flow
 * @param {number} length - The length of the string to generate
 * @returns {string} A random string
 */
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}