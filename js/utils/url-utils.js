/**
 * URL utility functions for consistent URL handling across the application
 */

// Base path for the application
const BASE_PATH = '/walkup_music';

/**
 * Get the base URL for the application
 * @returns {string} The base URL including origin and base path
 */
export function getBaseUrl() {
    return `${window.location.origin}${BASE_PATH}`;
}

/**
 * Get the base path for the application
 * @returns {string} The base path
 */
export function getBasePath() {
    return BASE_PATH;
}

/**
 * Create a full URL for a given path
 * @param {string} path - The path to append to the base URL
 * @returns {string} The full URL
 */
export function createUrl(path) {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${getBaseUrl()}/${cleanPath}`;
}

/**
 * Create a relative URL for a given path
 * @param {string} path - The path to append to the base path
 * @returns {string} The relative URL
 */
export function createRelativeUrl(path) {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_PATH}/${cleanPath}`;
}

/**
 * Redirect to a URL within the application
 * @param {string} path - The path to redirect to
 */
export function redirectTo(path) {
    window.location.href = createUrl(path);
}