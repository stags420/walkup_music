/**
 * Spotify API Wrapper Component
 * 
 * This component provides a wrapper around the Spotify Web API for searching songs,
 * getting track details, and handling API errors. It uses the authentication tokens
 * from the auth component to make authenticated requests.
 */

import { getAccessToken, isTokenValid } from './auth.js';
import spotifyConfig from '../config/spotify-config.js';

/**
 * Base class for Spotify API errors
 */
export class SpotifyAPIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'SpotifyAPIError';
        this.status = status;
        this.response = response;
    }
}

/**
 * Error thrown when authentication is required or invalid
 */
export class SpotifyAuthError extends SpotifyAPIError {
    constructor(message = 'Authentication required or invalid') {
        super(message, 401, null);
        this.name = 'SpotifyAuthError';
    }
}

/**
 * Error thrown when API rate limit is exceeded
 */
export class SpotifyRateLimitError extends SpotifyAPIError {
    constructor(retryAfter = null) {
        super('Rate limit exceeded', 429, null);
        this.name = 'SpotifyRateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Make an authenticated request to the Spotify API
 * @param {string} endpoint - The API endpoint (relative to base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The API response
 * @throws {SpotifyAPIError} When the API request fails
 */
async function makeSpotifyRequest(endpoint, options = {}) {
    // Check if we have a valid token
    if (!isTokenValid()) {
        throw new SpotifyAuthError('No valid authentication token available');
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new SpotifyAuthError('No access token available');
    }

    // Construct the full URL
    const url = `${spotifyConfig.apiBaseUrl}${endpoint}`;

    // Set up the request headers
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle different response status codes
        if (response.status === 401) {
            throw new SpotifyAuthError('Authentication token is invalid or expired');
        }

        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            throw new SpotifyRateLimitError(retryAfter ? parseInt(retryAfter) : null);
        }

        if (response.status === 403) {
            throw new SpotifyAPIError('Forbidden - insufficient permissions', 403, response);
        }

        if (response.status === 404) {
            throw new SpotifyAPIError('Resource not found', 404, response);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new SpotifyAPIError(
                errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                response
            );
        }

        // Handle responses that don't have content (like playback control endpoints)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {};
        }

        // Parse and return the JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        // If no JSON content, return empty object
        return {};
    } catch (error) {
        // Re-throw our custom errors
        if (error instanceof SpotifyAPIError) {
            throw error;
        }

        // Handle network errors and other fetch failures
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new SpotifyAPIError('Network error - please check your connection', 0, null);
        }

        // Handle JSON parsing errors
        if (error instanceof SyntaxError) {
            throw new SpotifyAPIError('Invalid response format from Spotify API', 0, null);
        }

        // Wrap any other errors
        throw new SpotifyAPIError(`Unexpected error: ${error.message}`, 0, null);
    }
}

/**
 * Search for songs on Spotify
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum number of results (1-50, default: 20)
 * @param {number} options.offset - The index of the first result to return (default: 0)
 * @param {string} options.market - An ISO 3166-1 alpha-2 country code (default: 'US')
 * @returns {Promise<Object>} Search results containing tracks
 * @throws {SpotifyAPIError} When the search request fails
 */
export async function searchSongs(query, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Search query is required and must be a non-empty string');
    }

    const {
        limit = 20,
        offset = 0,
        market = 'US'
    } = options;

    // Validate parameters
    if (limit < 1 || limit > 50) {
        throw new Error('Limit must be between 1 and 50');
    }

    if (offset < 0) {
        throw new Error('Offset must be non-negative');
    }

    // Construct the search endpoint with query parameters
    const searchParams = new URLSearchParams({
        q: query.trim(),
        type: 'track',
        limit: limit.toString(),
        offset: offset.toString(),
        market: market
    });

    const endpoint = `/search?${searchParams.toString()}`;

    try {
        const response = await makeSpotifyRequest(endpoint);

        // Transform the response to a more convenient format
        const tracks = response.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            })),
            album: {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images
            },
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            external_urls: track.external_urls,
            uri: track.uri
        }));

        return {
            tracks: tracks,
            total: response.tracks.total,
            limit: response.tracks.limit,
            offset: response.tracks.offset,
            next: response.tracks.next,
            previous: response.tracks.previous
        };
    } catch (error) {
        // Add context to the error
        if (error instanceof SpotifyAPIError) {
            error.message = `Search failed: ${error.message}`;
        }
        throw error;
    }
}

/**
 * Get detailed information about a specific track
 * @param {string} trackId - The Spotify track ID
 * @param {Object} options - Request options
 * @param {string} options.market - An ISO 3166-1 alpha-2 country code (default: 'US')
 * @returns {Promise<Object>} Detailed track information
 * @throws {SpotifyAPIError} When the request fails
 */
export async function getTrack(trackId, options = {}) {
    if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
        throw new Error('Track ID is required and must be a non-empty string');
    }

    const { market = 'US' } = options;

    // Construct the endpoint
    const searchParams = new URLSearchParams({ market });
    const endpoint = `/tracks/${trackId.trim()}?${searchParams.toString()}`;

    try {
        const track = await makeSpotifyRequest(endpoint);

        // Transform the response to a consistent format
        return {
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            })),
            album: {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images,
                release_date: track.album.release_date
            },
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            external_urls: track.external_urls,
            uri: track.uri,
            popularity: track.popularity,
            explicit: track.explicit,
            available_markets: track.available_markets
        };
    } catch (error) {
        // Add context to the error
        if (error instanceof SpotifyAPIError) {
            error.message = `Failed to get track details: ${error.message}`;
        }
        throw error;
    }
}

/**
 * Get multiple tracks by their IDs
 * @param {string[]} trackIds - Array of Spotify track IDs (max 50)
 * @param {Object} options - Request options
 * @param {string} options.market - An ISO 3166-1 alpha-2 country code (default: 'US')
 * @returns {Promise<Object[]>} Array of track information
 * @throws {SpotifyAPIError} When the request fails
 */
export async function getTracks(trackIds, options = {}) {
    if (!Array.isArray(trackIds) || trackIds.length === 0) {
        throw new Error('Track IDs must be a non-empty array');
    }

    if (trackIds.length > 50) {
        throw new Error('Maximum 50 track IDs allowed per request');
    }

    // Validate all track IDs
    for (const trackId of trackIds) {
        if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
            throw new Error('All track IDs must be non-empty strings');
        }
    }

    const { market = 'US' } = options;

    // Construct the endpoint
    const searchParams = new URLSearchParams({
        ids: trackIds.map(id => id.trim()).join(','),
        market
    });
    const endpoint = `/tracks?${searchParams.toString()}`;

    try {
        const response = await makeSpotifyRequest(endpoint);

        // Transform the response
        return response.tracks.map(track => {
            if (!track) return null; // Handle null tracks (invalid IDs)

            return {
                id: track.id,
                name: track.name,
                artists: track.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                })),
                album: {
                    id: track.album.id,
                    name: track.album.name,
                    images: track.album.images,
                    release_date: track.album.release_date
                },
                duration_ms: track.duration_ms,
                preview_url: track.preview_url,
                external_urls: track.external_urls,
                uri: track.uri,
                popularity: track.popularity,
                explicit: track.explicit,
                available_markets: track.available_markets
            };
        });
    } catch (error) {
        // Add context to the error
        if (error instanceof SpotifyAPIError) {
            error.message = `Failed to get tracks: ${error.message}`;
        }
        throw error;
    }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - The function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise<any>} The result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry certain types of errors
            if (error instanceof SpotifyAuthError ||
                (error instanceof SpotifyAPIError && error.status === 404)) {
                throw error;
            }

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                throw error;
            }

            // Calculate delay with exponential backoff
            let delay = baseDelay * Math.pow(2, attempt);

            // For rate limit errors, use the Retry-After header if available
            if (error instanceof SpotifyRateLimitError && error.retryAfter) {
                delay = error.retryAfter * 1000; // Convert to milliseconds
            }

            // Add some jitter to prevent thundering herd
            delay += Math.random() * 1000;

            console.warn(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Search for songs with automatic retry on failure
 * @param {string} query - The search query
 * @param {Object} options - Search options (same as searchSongs)
 * @returns {Promise<Object>} Search results
 */
export async function searchSongsWithRetry(query, options = {}) {
    return retryWithBackoff(() => searchSongs(query, options));
}

/**
 * Get track details with automatic retry on failure
 * @param {string} trackId - The Spotify track ID
 * @param {Object} options - Request options (same as getTrack)
 * @returns {Promise<Object>} Track details
 */
export async function getTrackWithRetry(trackId, options = {}) {
    return retryWithBackoff(() => getTrack(trackId, options));
}

/**
 * Play a song with automatic retry on failure
 * @param {string} trackId - The Spotify track ID to play
 * @param {number} startTime - Start time in seconds (optional)
 * @returns {Promise<void>}
 */
export async function playSongWithRetry(trackId, startTime = 0) {
    return retryWithBackoff(() => playSong(trackId, startTime));
}

/**
 * Pause song with automatic retry on failure
 * @returns {Promise<void>}
 */
export async function pauseSongWithRetry() {
    return retryWithBackoff(() => pauseSong());
}

/**
 * Seek to position with automatic retry on failure
 * @param {number} positionMs - Position in milliseconds
 * @returns {Promise<void>}
 */
export async function seekToPositionWithRetry(positionMs) {
    return retryWithBackoff(() => seekToPosition(positionMs));
}

/**
 * Get current playback state with automatic retry on failure
 * @returns {Promise<Object|null>} Current playback state or null if nothing is playing
 */
export async function getCurrentPlaybackStateWithRetry() {
    return retryWithBackoff(() => getCurrentPlaybackState());
}

/**
 * Check if the Spotify API is available and accessible
 * @returns {Promise<boolean>} Whether the API is available
 */
export async function checkAPIAvailability() {
    try {
        // Try to make a simple request to check API availability
        await makeSpotifyRequest('/me', { method: 'GET' });
        return true;
    } catch (error) {
        console.warn('Spotify API availability check failed:', error.message);
        return false;
    }
}

/**
 * Get the current user's profile (useful for testing authentication)
 * @returns {Promise<Object>} User profile information
 */
export async function getCurrentUser() {
    try {
        return await makeSpotifyRequest('/me');
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            error.message = `Failed to get user profile: ${error.message}`;
        }
        throw error;
    }
}

/**
 * Play a song on the user's Spotify device
 * @param {string} trackId - The Spotify track ID to play
 * @param {number} startTime - Start time in seconds (optional)
 * @param {string} deviceId - The device ID to play on (optional, uses active device if not specified)
 * @returns {Promise<void>}
 * @throws {SpotifyAPIError} When the playback request fails
 */
export async function playSong(trackId, startTime = 0, deviceId = null) {
    if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
        throw new Error('Track ID is required and must be a non-empty string');
    }

    if (typeof startTime !== 'number' || startTime < 0) {
        throw new Error('Start time must be a non-negative number');
    }

    if (deviceId && (typeof deviceId !== 'string' || deviceId.trim().length === 0)) {
        throw new Error('Device ID must be a non-empty string if provided');
    }

    const trackUri = `spotify:track:${trackId.trim()}`;
    const positionMs = Math.floor(startTime * 1000); // Convert seconds to milliseconds

    const requestBody = {
        uris: [trackUri],
        position_ms: positionMs
    };

    // Add device_id to request body if specified
    if (deviceId) {
        requestBody.device_id = deviceId.trim();
    }

    try {
        await makeSpotifyRequest('/me/player/play', {
            method: 'PUT',
            body: JSON.stringify(requestBody)
        });
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            // Handle specific playback errors
            if (error.status === 404) {
                if (deviceId) {
                    error.message = 'Device not available for playback. Please open Spotify on the selected device, play any song briefly to activate it, then try again.';
                } else {
                    error.message = 'No active Spotify device found. Please open Spotify on a device and start playing music.';
                }
            } else if (error.status === 403) {
                error.message = 'Playback control requires Spotify Premium. Please upgrade your account.';
            } else if (error.status === 502 || error.status === 503) {
                error.message = 'Device may not be ready for playback. Please open Spotify on the selected device, play any song briefly to activate it, then try again.';
            } else {
                error.message = `Failed to play song: ${error.message}`;
            }
        }
        throw error;
    }
}

/**
 * Pause the currently playing song on the user's Spotify device
 * @param {string} deviceId - The device ID to pause on (optional, uses active device if not specified)
 * @returns {Promise<void>}
 * @throws {SpotifyAPIError} When the pause request fails
 */
export async function pauseSong(deviceId = null) {
    if (deviceId && (typeof deviceId !== 'string' || deviceId.trim().length === 0)) {
        throw new Error('Device ID must be a non-empty string if provided');
    }

    const requestBody = deviceId ? { device_id: deviceId.trim() } : {};

    try {
        await makeSpotifyRequest('/me/player/pause', {
            method: 'PUT',
            body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
        });
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            // Handle specific playback errors
            if (error.status === 404) {
                if (deviceId) {
                    error.message = 'Device not available or nothing is currently playing on that device.';
                } else {
                    error.message = 'No active Spotify device found or nothing is currently playing.';
                }
            } else if (error.status === 403) {
                error.message = 'Playback control requires Spotify Premium. Please upgrade your account.';
            } else {
                error.message = `Failed to pause song: ${error.message}`;
            }
        }
        throw error;
    }
}

/**
 * Seek to a specific position in the currently playing track
 * @param {number} positionMs - Position in milliseconds
 * @returns {Promise<void>}
 * @throws {SpotifyAPIError} When the seek request fails
 */
export async function seekToPosition(positionMs) {
    if (typeof positionMs !== 'number' || positionMs < 0) {
        throw new Error('Position must be a non-negative number in milliseconds');
    }

    const searchParams = new URLSearchParams({
        position_ms: Math.floor(positionMs).toString()
    });

    try {
        await makeSpotifyRequest(`/me/player/seek?${searchParams.toString()}`, {
            method: 'PUT'
        });
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            // Handle specific playback errors
            if (error.status === 404) {
                error.message = 'No active Spotify device found or nothing is currently playing.';
            } else if (error.status === 403) {
                error.message = 'Playback control requires Spotify Premium. Please upgrade your account.';
            } else {
                error.message = `Failed to seek to position: ${error.message}`;
            }
        }
        throw error;
    }
}

/**
 * Get information about the current playback state
 * @returns {Promise<Object|null>} Current playback state or null if nothing is playing
 * @throws {SpotifyAPIError} When the request fails
 */
export async function getCurrentPlaybackState() {
    try {
        const response = await makeSpotifyRequest('/me/player');

        // If no content is returned, nothing is currently playing
        if (!response || Object.keys(response).length === 0) {
            return null;
        }

        // Transform the response to a more convenient format
        return {
            is_playing: response.is_playing,
            progress_ms: response.progress_ms,
            timestamp: response.timestamp,
            device: {
                id: response.device?.id,
                name: response.device?.name,
                type: response.device?.type,
                volume_percent: response.device?.volume_percent,
                is_active: response.device?.is_active
            },
            repeat_state: response.repeat_state,
            shuffle_state: response.shuffle_state,
            track: response.item ? {
                id: response.item.id,
                name: response.item.name,
                artists: response.item.artists?.map(artist => ({
                    id: artist.id,
                    name: artist.name
                })) || [],
                album: {
                    id: response.item.album?.id,
                    name: response.item.album?.name,
                    images: response.item.album?.images || []
                },
                duration_ms: response.item.duration_ms,
                uri: response.item.uri
            } : null
        };
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            // Handle specific errors
            if (error.status === 404) {
                // No active device or no playback - return null instead of throwing
                return null;
            } else if (error.status === 403) {
                error.message = 'Getting playback state requires Spotify Premium. Please upgrade your account.';
            } else {
                error.message = `Failed to get playback state: ${error.message}`;
            }
        }
        throw error;
    }
}

/**
 * Get available Spotify devices
 * @returns {Promise<Object[]>} Array of available devices
 * @throws {SpotifyAPIError} When the request fails
 */
export async function getAvailableDevices() {
    try {
        const response = await makeSpotifyRequest('/me/player/devices');

        return response.devices.map(device => ({
            id: device.id,
            name: device.name,
            type: device.type,
            is_active: device.is_active,
            is_private_session: device.is_private_session,
            is_restricted: device.is_restricted,
            volume_percent: device.volume_percent
        }));
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            if (error.status === 403) {
                error.message = 'Getting devices requires Spotify Premium. Please upgrade your account.';
            } else {
                error.message = `Failed to get devices: ${error.message}`;
            }
        }
        throw error;
    }
}

/**
 * Transfer playback to a specific device
 * @param {string} deviceId - The device ID to transfer playback to
 * @param {boolean} play - Whether to start playing immediately (default: false)
 * @returns {Promise<void>}
 * @throws {SpotifyAPIError} When the transfer fails
 */
export async function transferPlayback(deviceId, play = false) {
    if (!deviceId || typeof deviceId !== 'string') {
        throw new Error('Device ID is required and must be a string');
    }

    const requestBody = {
        device_ids: [deviceId],
        play: play
    };

    try {
        await makeSpotifyRequest('/me/player', {
            method: 'PUT',
            body: JSON.stringify(requestBody)
        });
    } catch (error) {
        if (error instanceof SpotifyAPIError) {
            if (error.status === 404) {
                error.message = 'Device not found or not available for playback transfer.';
            } else if (error.status === 403) {
                error.message = 'Playback transfer requires Spotify Premium. Please upgrade your account.';
            } else {
                error.message = `Failed to transfer playback: ${error.message}`;
            }
        }
        throw error;
    }
}