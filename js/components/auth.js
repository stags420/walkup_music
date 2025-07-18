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
    if (accessToken && tokenExpiration && Date.now() > parseInt(tokenExpiration) - (5 * 60 * 1000)) {
        refreshToken();
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
    const expirationTime = Date.now() + (3600 * 1000); // 1 hour
    
    // Store the token in cookies
    setCookie(ACCESS_TOKEN_COOKIE, mockToken, 1); // Store for 1 day max
    setCookie(TOKEN_EXPIRATION_COOKIE, expirationTime, 1);
    
    // Also store in localStorage as a backup
    localStorage.setItem(ACCESS_TOKEN_COOKIE, mockToken);
    localStorage.setItem(TOKEN_EXPIRATION_COOKIE, expirationTime.toString());
    
    console.log('Authentication successful with code:', code);
    
    return { success: true };
}

/**
 * Refresh the authentication token
 * Note: Implicit grant doesn't support refresh tokens, so we'll need to re-authenticate
 * This will be fully implemented in task 2.3
 */
export function refreshToken() {
    // For now, we'll just check if the token is expired and clear it if needed
    const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);

    if (!tokenExpiration || Date.now() > parseInt(tokenExpiration)) {
        // Token is expired, clear it
        logout();
    }

    // The full refresh mechanism will be implemented in task 2.3
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
    return getCookie(ACCESS_TOKEN_COOKIE);
}

/**
 * Check if the access token is valid
 * @returns {boolean} Whether the access token is valid
 */
export function isTokenValid() {
    const accessToken = getCookie(ACCESS_TOKEN_COOKIE);
    const tokenExpiration = getCookie(TOKEN_EXPIRATION_COOKIE);

    return accessToken && tokenExpiration && Date.now() < parseInt(tokenExpiration);
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