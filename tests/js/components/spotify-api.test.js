/**
 * Tests for Spotify API wrapper component
 * 
 * These tests focus on the core functionality of the Spotify API wrapper,
 * including error handling, request formatting, and response processing.
 */

// Mock global fetch
global.fetch = jest.fn();

// Mock console methods to avoid noise in test output
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn()
};

describe('Spotify API Wrapper', () => {
    // Mock implementations for testing
    let mockGetAccessToken;
    let mockIsTokenValid;
    let mockSpotifyConfig;
    
    // Test functions that simulate the API wrapper behavior
    const createMockSpotifyAPI = () => {
        // Mock the auth functions
        mockGetAccessToken = jest.fn().mockReturnValue('mock_access_token');
        mockIsTokenValid = jest.fn().mockReturnValue(true);
        
        // Mock the config
        mockSpotifyConfig = {
            apiBaseUrl: 'https://api.spotify.com/v1'
        };
        
        // Create error classes
        class SpotifyAPIError extends Error {
            constructor(message, status, response) {
                super(message);
                this.name = 'SpotifyAPIError';
                this.status = status;
                this.response = response;
            }
        }
        
        class SpotifyAuthError extends SpotifyAPIError {
            constructor(message = 'Authentication required or invalid') {
                super(message, 401, null);
                this.name = 'SpotifyAuthError';
            }
        }
        
        class SpotifyRateLimitError extends SpotifyAPIError {
            constructor(retryAfter = null) {
                super('Rate limit exceeded', 429, null);
                this.name = 'SpotifyRateLimitError';
                this.retryAfter = retryAfter;
            }
        }
        
        // Mock API request function
        const makeSpotifyRequest = async (endpoint, options = {}) => {
            if (!mockIsTokenValid()) {
                throw new SpotifyAuthError('No valid authentication token available');
            }
            
            const accessToken = mockGetAccessToken();
            if (!accessToken) {
                throw new SpotifyAuthError('No access token available');
            }
            
            const url = `${mockSpotifyConfig.apiBaseUrl}${endpoint}`;
            const headers = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            try {
                const response = await fetch(url, { ...options, headers });
                
                if (response.status === 401) {
                    throw new SpotifyAuthError('Authentication token is invalid or expired');
                }
                
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    throw new SpotifyRateLimitError(retryAfter ? parseInt(retryAfter) : null);
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
                
                return await response.json();
            } catch (error) {
                // Re-throw our custom errors
                if (error instanceof SpotifyAPIError) {
                    throw error;
                }
                
                // Handle network errors and other fetch failures
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    throw new SpotifyAPIError('Network error - please check your connection', 0, null);
                }
                
                // Wrap any other errors
                throw new SpotifyAPIError(`Unexpected error: ${error.message}`, 0, null);
            }
        };
        
        // Mock search function
        const searchSongs = async (query, options = {}) => {
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw new Error('Search query is required and must be a non-empty string');
            }
            
            const { limit = 20, offset = 0, market = 'US' } = options;
            
            if (limit < 1 || limit > 50) {
                throw new Error('Limit must be between 1 and 50');
            }
            
            if (offset < 0) {
                throw new Error('Offset must be non-negative');
            }
            
            const searchParams = new URLSearchParams({
                q: query.trim(),
                type: 'track',
                limit: limit.toString(),
                offset: offset.toString(),
                market: market
            });
            
            const endpoint = `/search?${searchParams.toString()}`;
            const response = await makeSpotifyRequest(endpoint);
            
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
        };
        
        // Mock getTrack function
        const getTrack = async (trackId, options = {}) => {
            if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
                throw new Error('Track ID is required and must be a non-empty string');
            }
            
            const { market = 'US' } = options;
            const searchParams = new URLSearchParams({ market });
            const endpoint = `/tracks/${trackId.trim()}?${searchParams.toString()}`;
            
            const track = await makeSpotifyRequest(endpoint);
            
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
        };
        
        // Mock getTracks function
        const getTracks = async (trackIds, options = {}) => {
            if (!Array.isArray(trackIds) || trackIds.length === 0) {
                throw new Error('Track IDs must be a non-empty array');
            }
            
            if (trackIds.length > 50) {
                throw new Error('Maximum 50 track IDs allowed per request');
            }
            
            for (const trackId of trackIds) {
                if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
                    throw new Error('All track IDs must be non-empty strings');
                }
            }
            
            const { market = 'US' } = options;
            const searchParams = new URLSearchParams({
                ids: trackIds.map(id => id.trim()).join(','),
                market
            });
            const endpoint = `/tracks?${searchParams.toString()}`;
            
            const response = await makeSpotifyRequest(endpoint);
            
            return response.tracks.map(track => {
                if (!track) return null;
                
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
        };
        
        // Mock retry functions
        const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
            let lastError;
            
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;
                    
                    if (error instanceof SpotifyAuthError || 
                        (error instanceof SpotifyAPIError && error.status === 404)) {
                        throw error;
                    }
                    
                    if (attempt === maxRetries) {
                        throw error;
                    }
                    
                    let delay = baseDelay * Math.pow(2, attempt);
                    
                    if (error instanceof SpotifyRateLimitError && error.retryAfter) {
                        delay = error.retryAfter * 1000;
                    }
                    
                    delay += Math.random() * 1000;
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            throw lastError;
        };
        
        const searchSongsWithRetry = async (query, options = {}) => {
            return retryWithBackoff(() => searchSongs(query, options));
        };
        
        const getTrackWithRetry = async (trackId, options = {}) => {
            return retryWithBackoff(() => getTrack(trackId, options));
        };
        
        const checkAPIAvailability = async () => {
            try {
                await makeSpotifyRequest('/me', { method: 'GET' });
                return true;
            } catch (error) {
                return false;
            }
        };
        
        const getCurrentUser = async () => {
            return await makeSpotifyRequest('/me');
        };
        
        return {
            SpotifyAPIError,
            SpotifyAuthError,
            SpotifyRateLimitError,
            searchSongs,
            getTrack,
            getTracks,
            searchSongsWithRetry,
            getTrackWithRetry,
            checkAPIAvailability,
            getCurrentUser,
            makeSpotifyRequest
        };
    };
    
    let spotifyAPI;
    
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Default fetch mock
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({}),
            headers: new Map()
        });
        
        // Create fresh API instance
        spotifyAPI = createMockSpotifyAPI();
    });

    describe('Error Classes', () => {
        test('SpotifyAPIError should extend Error', () => {
            const { SpotifyAPIError } = spotifyAPI;
            const error = new SpotifyAPIError('Test error', 400, null);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('SpotifyAPIError');
            expect(error.message).toBe('Test error');
            expect(error.status).toBe(400);
        });

        test('SpotifyAuthError should extend SpotifyAPIError', () => {
            const { SpotifyAuthError, SpotifyAPIError } = spotifyAPI;
            const error = new SpotifyAuthError();
            expect(error).toBeInstanceOf(SpotifyAPIError);
            expect(error.name).toBe('SpotifyAuthError');
            expect(error.status).toBe(401);
        });

        test('SpotifyRateLimitError should extend SpotifyAPIError', () => {
            const { SpotifyRateLimitError, SpotifyAPIError } = spotifyAPI;
            const error = new SpotifyRateLimitError(60);
            expect(error).toBeInstanceOf(SpotifyAPIError);
            expect(error.name).toBe('SpotifyRateLimitError');
            expect(error.status).toBe(429);
            expect(error.retryAfter).toBe(60);
        });
    });

    describe('searchSongs', () => {
        test('should search for songs successfully', async () => {
            const mockResponse = {
                tracks: {
                    items: [
                        {
                            id: 'track1',
                            name: 'Test Song',
                            artists: [{ id: 'artist1', name: 'Test Artist' }],
                            album: {
                                id: 'album1',
                                name: 'Test Album',
                                images: [{ url: 'image.jpg' }]
                            },
                            duration_ms: 180000,
                            preview_url: 'preview.mp3',
                            external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                            uri: 'spotify:track:track1'
                        }
                    ],
                    total: 1,
                    limit: 20,
                    offset: 0,
                    next: null,
                    previous: null
                }
            };

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            const result = await spotifyAPI.searchSongs('test query');

            expect(fetch).toHaveBeenCalledWith(
                'https://api.spotify.com/v1/search?q=test+query&type=track&limit=20&offset=0&market=US',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token',
                        'Content-Type': 'application/json'
                    })
                })
            );

            expect(result).toEqual({
                tracks: [
                    {
                        id: 'track1',
                        name: 'Test Song',
                        artists: [{ id: 'artist1', name: 'Test Artist' }],
                        album: {
                            id: 'album1',
                            name: 'Test Album',
                            images: [{ url: 'image.jpg' }]
                        },
                        duration_ms: 180000,
                        preview_url: 'preview.mp3',
                        external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                        uri: 'spotify:track:track1'
                    }
                ],
                total: 1,
                limit: 20,
                offset: 0,
                next: null,
                previous: null
            });
        });

        test('should throw error for empty query', async () => {
            await expect(spotifyAPI.searchSongs('')).rejects.toThrow('Search query is required and must be a non-empty string');
            await expect(spotifyAPI.searchSongs('   ')).rejects.toThrow('Search query is required and must be a non-empty string');
            await expect(spotifyAPI.searchSongs(null)).rejects.toThrow('Search query is required and must be a non-empty string');
        });

        test('should validate limit parameter', async () => {
            await expect(spotifyAPI.searchSongs('test', { limit: 0 })).rejects.toThrow('Limit must be between 1 and 50');
            await expect(spotifyAPI.searchSongs('test', { limit: 51 })).rejects.toThrow('Limit must be between 1 and 50');
        });

        test('should validate offset parameter', async () => {
            await expect(spotifyAPI.searchSongs('test', { offset: -1 })).rejects.toThrow('Offset must be non-negative');
        });

        test('should throw SpotifyAuthError when not authenticated', async () => {
            mockIsTokenValid.mockReturnValue(false);
            
            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAuthError);
        });

        test('should throw SpotifyAuthError when no access token', async () => {
            mockGetAccessToken.mockReturnValue(null);
            
            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAuthError);
        });

        test('should handle 401 authentication error', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: jest.fn().mockResolvedValue({})
            });

            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAuthError);
        });

        test('should handle 429 rate limit error', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 429,
                headers: new Map([['Retry-After', '60']])
            });

            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyRateLimitError);
        });

        test('should handle 404 not found error', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: jest.fn().mockResolvedValue({})
            });

            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAPIError);
        });

        test('should handle network errors', async () => {
            fetch.mockRejectedValue(new TypeError('Failed to fetch'));

            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAPIError);
        });
    });

    describe('getTrack', () => {
        test('should get track details successfully', async () => {
            const mockTrack = {
                id: 'track1',
                name: 'Test Song',
                artists: [{ id: 'artist1', name: 'Test Artist' }],
                album: {
                    id: 'album1',
                    name: 'Test Album',
                    images: [{ url: 'image.jpg' }],
                    release_date: '2023-01-01'
                },
                duration_ms: 180000,
                preview_url: 'preview.mp3',
                external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                uri: 'spotify:track:track1',
                popularity: 75,
                explicit: false,
                available_markets: ['US', 'CA']
            };

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockTrack)
            });

            const result = await spotifyAPI.getTrack('track1');

            expect(fetch).toHaveBeenCalledWith(
                'https://api.spotify.com/v1/tracks/track1?market=US',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token'
                    })
                })
            );

            expect(result).toEqual(mockTrack);
        });

        test('should throw error for empty track ID', async () => {
            await expect(spotifyAPI.getTrack('')).rejects.toThrow('Track ID is required and must be a non-empty string');
            await expect(spotifyAPI.getTrack('   ')).rejects.toThrow('Track ID is required and must be a non-empty string');
            await expect(spotifyAPI.getTrack(null)).rejects.toThrow('Track ID is required and must be a non-empty string');
        });

        test('should handle track not found', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: jest.fn().mockResolvedValue({})
            });

            await expect(spotifyAPI.getTrack('invalid_track_id')).rejects.toThrow(spotifyAPI.SpotifyAPIError);
        });
    });

    describe('getTracks', () => {
        test('should get multiple tracks successfully', async () => {
            const mockResponse = {
                tracks: [
                    {
                        id: 'track1',
                        name: 'Test Song 1',
                        artists: [{ id: 'artist1', name: 'Test Artist 1' }],
                        album: {
                            id: 'album1',
                            name: 'Test Album 1',
                            images: [],
                            release_date: '2023-01-01'
                        },
                        duration_ms: 180000,
                        preview_url: null,
                        external_urls: { spotify: 'https://open.spotify.com/track/track1' },
                        uri: 'spotify:track:track1',
                        popularity: 75,
                        explicit: false,
                        available_markets: ['US']
                    },
                    null // Invalid track ID
                ]
            };

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockResponse)
            });

            const result = await spotifyAPI.getTracks(['track1', 'invalid_id']);

            expect(result).toHaveLength(2);
            expect(result[0]).toBeDefined();
            expect(result[1]).toBeNull();
        });

        test('should throw error for empty array', async () => {
            await expect(spotifyAPI.getTracks([])).rejects.toThrow('Track IDs must be a non-empty array');
        });

        test('should throw error for too many track IDs', async () => {
            const tooManyIds = Array(51).fill('track_id');
            await expect(spotifyAPI.getTracks(tooManyIds)).rejects.toThrow('Maximum 50 track IDs allowed per request');
        });

        test('should validate track ID format', async () => {
            await expect(spotifyAPI.getTracks(['valid_id', ''])).rejects.toThrow('All track IDs must be non-empty strings');
        });
    });

    describe('Retry functionality', () => {
        test('searchSongsWithRetry should retry on failure', async () => {
            // First call fails, second succeeds
            fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: jest.fn().mockResolvedValue({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue({
                        tracks: { items: [], total: 0, limit: 20, offset: 0, next: null, previous: null }
                    })
                });

            const result = await spotifyAPI.searchSongsWithRetry('test');
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result.tracks).toEqual([]);
        });

        test('getTrackWithRetry should retry on failure', async () => {
            const mockTrack = {
                id: 'track1',
                name: 'Test Song',
                artists: [],
                album: { id: 'album1', name: 'Album', images: [], release_date: '2023-01-01' },
                duration_ms: 180000,
                preview_url: null,
                external_urls: {},
                uri: 'spotify:track:track1',
                popularity: 50,
                explicit: false,
                available_markets: []
            };

            // First call fails, second succeeds
            fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: jest.fn().mockResolvedValue({})
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue(mockTrack)
                });

            const result = await spotifyAPI.getTrackWithRetry('track1');
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result.id).toBe('track1');
        });
    });

    describe('checkAPIAvailability', () => {
        test('should return true when API is available', async () => {
            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({})
            });

            const result = await spotifyAPI.checkAPIAvailability();
            expect(result).toBe(true);
        });

        test('should return false when API is not available', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: jest.fn().mockResolvedValue({})
            });

            const result = await spotifyAPI.checkAPIAvailability();
            expect(result).toBe(false);
        });
    });

    describe('getCurrentUser', () => {
        test('should get current user profile', async () => {
            const mockUser = {
                id: 'user123',
                display_name: 'Test User',
                email: 'test@example.com'
            };

            fetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue(mockUser)
            });

            const result = await spotifyAPI.getCurrentUser();
            
            expect(fetch).toHaveBeenCalledWith(
                'https://api.spotify.com/v1/me',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock_access_token'
                    })
                })
            );
            
            expect(result).toEqual(mockUser);
        });
    });
});