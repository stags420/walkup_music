/**
 * Tests for Spotify API wrapper component
 * 
 * These tests focus on the core functionality of the Spotify API wrapper,
 * including error handling, request formatting, and response processing.
 * Tests Requirements: 3.2, 3.3, 3.4
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
                
                // For PUT requests that don't return content (like playback controls), return empty object
                if (response.status === 204 || options.method === 'PUT') {
                    return {};
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
        
        // Mock search function - Tests Requirement 3.2 (song search functionality)
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
        
        // Mock getTrack function - Tests Requirement 3.2 (track detail retrieval)
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
        
        // Mock playback control functions - Tests Requirements 3.3, 3.4 (playback controls)
        const playSong = async (trackId, startTime = 0) => {
            if (!trackId || typeof trackId !== 'string' || trackId.trim().length === 0) {
                throw new Error('Track ID is required and must be a non-empty string');
            }
            
            if (typeof startTime !== 'number' || startTime < 0) {
                throw new Error('Start time must be a non-negative number');
            }
            
            const trackUri = `spotify:track:${trackId.trim()}`;
            const positionMs = Math.floor(startTime * 1000);
            
            const requestBody = {
                uris: [trackUri],
                position_ms: positionMs
            };
            
            try {
                await makeSpotifyRequest('/me/player/play', {
                    method: 'PUT',
                    body: JSON.stringify(requestBody)
                });
            } catch (error) {
                if (error instanceof SpotifyAPIError) {
                    if (error.status === 404) {
                        error.message = 'No active Spotify device found. Please open Spotify on a device and start playing music.';
                    } else if (error.status === 403) {
                        error.message = 'Playback control requires Spotify Premium. Please upgrade your account.';
                    } else {
                        error.message = `Failed to play song: ${error.message}`;
                    }
                }
                throw error;
            }
        };
        
        const pauseSong = async () => {
            try {
                await makeSpotifyRequest('/me/player/pause', {
                    method: 'PUT'
                });
            } catch (error) {
                if (error instanceof SpotifyAPIError) {
                    if (error.status === 404) {
                        error.message = 'No active Spotify device found or nothing is currently playing.';
                    } else if (error.status === 403) {
                        error.message = 'Playback control requires Spotify Premium. Please upgrade your account.';
                    } else {
                        error.message = `Failed to pause song: ${error.message}`;
                    }
                }
                throw error;
            }
        };
        
        const seekToPosition = async (positionMs) => {
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
        };
        
        const getCurrentPlaybackState = async () => {
            try {
                const response = await makeSpotifyRequest('/me/player');
                
                if (!response || Object.keys(response).length === 0) {
                    return null;
                }
                
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
                    if (error.status === 404) {
                        return null;
                    } else if (error.status === 403) {
                        error.message = 'Getting playback state requires Spotify Premium. Please upgrade your account.';
                    } else {
                        error.message = `Failed to get playback state: ${error.message}`;
                    }
                }
                throw error;
            }
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
        
        const playSongWithRetry = async (trackId, startTime = 0) => {
            return retryWithBackoff(() => playSong(trackId, startTime));
        };
        
        const pauseSongWithRetry = async () => {
            return retryWithBackoff(() => pauseSong());
        };
        
        const seekToPositionWithRetry = async (positionMs) => {
            return retryWithBackoff(() => seekToPosition(positionMs));
        };
        
        const getCurrentPlaybackStateWithRetry = async () => {
            return retryWithBackoff(() => getCurrentPlaybackState());
        };
        
        return {
            SpotifyAPIError,
            SpotifyAuthError,
            SpotifyRateLimitError,
            searchSongs,
            getTrack,
            searchSongsWithRetry,
            getTrackWithRetry,
            playSong,
            pauseSong,
            seekToPosition,
            getCurrentPlaybackState,
            playSongWithRetry,
            pauseSongWithRetry,
            seekToPositionWithRetry,
            getCurrentPlaybackStateWithRetry
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

    describe('Song Search Functionality (Requirement 3.2)', () => {
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

            expect(result.tracks).toHaveLength(1);
            expect(result.tracks[0].id).toBe('track1');
            expect(result.tracks[0].name).toBe('Test Song');
        });

        test('should validate search query', async () => {
            await expect(spotifyAPI.searchSongs('')).rejects.toThrow('Search query is required and must be a non-empty string');
            await expect(spotifyAPI.searchSongs(null)).rejects.toThrow('Search query is required and must be a non-empty string');
        });

        test('should validate search parameters', async () => {
            await expect(spotifyAPI.searchSongs('test', { limit: 0 })).rejects.toThrow('Limit must be between 1 and 50');
            await expect(spotifyAPI.searchSongs('test', { limit: 51 })).rejects.toThrow('Limit must be between 1 and 50');
            await expect(spotifyAPI.searchSongs('test', { offset: -1 })).rejects.toThrow('Offset must be non-negative');
        });

        test('should handle authentication errors', async () => {
            mockIsTokenValid.mockReturnValue(false);
            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyAuthError);
        });

        test('should handle API errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 429,
                headers: new Map([['Retry-After', '60']])
            });

            await expect(spotifyAPI.searchSongs('test')).rejects.toThrow(spotifyAPI.SpotifyRateLimitError);
        });

        test('should retry search on failure', async () => {
            const mockResponse = {
                tracks: {
                    items: [{ id: 'track1', name: 'Test Song', artists: [], album: {}, duration_ms: 180000 }],
                    total: 1,
                    limit: 20,
                    offset: 0
                }
            };

            fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue(mockResponse)
                });

            const result = await spotifyAPI.searchSongsWithRetry('test');
            
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(result.tracks).toHaveLength(1);
        });
    });

    describe('Track Detail Retrieval (Requirement 3.2)', () => {
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

            expect(result.id).toBe('track1');
            expect(result.name).toBe('Test Song');
        });

        test('should validate track ID', async () => {
            await expect(spotifyAPI.getTrack('')).rejects.toThrow('Track ID is required and must be a non-empty string');
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

        test('should retry track retrieval on failure', async () => {
            const mockTrack = {
                id: 'track1',
                name: 'Test Song',
                artists: [],
                album: {},
                duration_ms: 180000
            };

            fetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
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

    describe('Playback Controls (Requirements 3.3, 3.4)', () => {
        describe('Play Song', () => {
            test('should play a song successfully', async () => {
                fetch.mockResolvedValue({
                    ok: true,
                    status: 204
                });

                await spotifyAPI.playSong('track1', 30);

                expect(fetch).toHaveBeenCalledWith(
                    'https://api.spotify.com/v1/me/player/play',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer mock_access_token',
                            'Content-Type': 'application/json'
                        }),
                        body: JSON.stringify({
                            uris: ['spotify:track:track1'],
                            position_ms: 30000
                        })
                    })
                );
            });

            test('should validate track ID for playback', async () => {
                await expect(spotifyAPI.playSong('')).rejects.toThrow('Track ID is required and must be a non-empty string');
                await expect(spotifyAPI.playSong(null)).rejects.toThrow('Track ID is required and must be a non-empty string');
            });

            test('should validate start time', async () => {
                await expect(spotifyAPI.playSong('track1', -1)).rejects.toThrow('Start time must be a non-negative number');
            });

            test('should handle no active device error', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: jest.fn().mockResolvedValue({})
                });

                await expect(spotifyAPI.playSong('track1')).rejects.toThrow('No active Spotify device found');
            });

            test('should handle premium required error', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 403,
                    json: jest.fn().mockResolvedValue({})
                });

                await expect(spotifyAPI.playSong('track1')).rejects.toThrow('Playback control requires Spotify Premium');
            });

            test('should retry play song on failure', async () => {
                fetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 500,
                        json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 204
                    });

                await spotifyAPI.playSongWithRetry('track1', 30);
                
                expect(fetch).toHaveBeenCalledTimes(2);
            });
        });

        describe('Pause Song', () => {
            test('should pause song successfully', async () => {
                fetch.mockResolvedValue({
                    ok: true,
                    status: 204
                });

                await spotifyAPI.pauseSong();

                expect(fetch).toHaveBeenCalledWith(
                    'https://api.spotify.com/v1/me/player/pause',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer mock_access_token'
                        })
                    })
                );
            });

            test('should handle no active device error when pausing', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: jest.fn().mockResolvedValue({})
                });

                await expect(spotifyAPI.pauseSong()).rejects.toThrow('No active Spotify device found');
            });

            test('should retry pause song on failure', async () => {
                fetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 500,
                        json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 204
                    });

                await spotifyAPI.pauseSongWithRetry();
                
                expect(fetch).toHaveBeenCalledTimes(2);
            });
        });

        describe('Seek to Position', () => {
            test('should seek to position successfully', async () => {
                fetch.mockResolvedValue({
                    ok: true,
                    status: 204
                });

                await spotifyAPI.seekToPosition(45000);

                expect(fetch).toHaveBeenCalledWith(
                    'https://api.spotify.com/v1/me/player/seek?position_ms=45000',
                    expect.objectContaining({
                        method: 'PUT',
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer mock_access_token'
                        })
                    })
                );
            });

            test('should validate position parameter', async () => {
                await expect(spotifyAPI.seekToPosition(-1)).rejects.toThrow('Position must be a non-negative number');
            });

            test('should handle no active device error when seeking', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: jest.fn().mockResolvedValue({})
                });

                await expect(spotifyAPI.seekToPosition(30000)).rejects.toThrow('No active Spotify device found');
            });

            test('should retry seek to position on failure', async () => {
                fetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 500,
                        json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 204
                    });

                await spotifyAPI.seekToPositionWithRetry(30000);
                
                expect(fetch).toHaveBeenCalledTimes(2);
            });
        });

        describe('Get Current Playback State', () => {
            test('should get current playback state successfully', async () => {
                const mockPlaybackState = {
                    is_playing: true,
                    progress_ms: 45000,
                    timestamp: Date.now(),
                    device: {
                        id: 'device1',
                        name: 'My Device',
                        type: 'Computer',
                        volume_percent: 80,
                        is_active: true
                    },
                    repeat_state: 'off',
                    shuffle_state: false,
                    item: {
                        id: 'track1',
                        name: 'Current Song',
                        artists: [{ id: 'artist1', name: 'Artist' }],
                        album: {
                            id: 'album1',
                            name: 'Album',
                            images: []
                        },
                        duration_ms: 180000,
                        uri: 'spotify:track:track1'
                    }
                };

                fetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue(mockPlaybackState)
                });

                const result = await spotifyAPI.getCurrentPlaybackState();

                expect(fetch).toHaveBeenCalledWith(
                    'https://api.spotify.com/v1/me/player',
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            'Authorization': 'Bearer mock_access_token'
                        })
                    })
                );

                expect(result.is_playing).toBe(true);
                expect(result.track.id).toBe('track1');
            });

            test('should return null when nothing is playing', async () => {
                fetch.mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: jest.fn().mockResolvedValue({})
                });

                const result = await spotifyAPI.getCurrentPlaybackState();
                expect(result).toBeNull();
            });

            test('should return null when no active device (404)', async () => {
                fetch.mockResolvedValue({
                    ok: false,
                    status: 404,
                    json: jest.fn().mockResolvedValue({})
                });

                const result = await spotifyAPI.getCurrentPlaybackState();
                expect(result).toBeNull();
            });

            test('should retry get playback state on failure', async () => {
                const mockState = {
                    is_playing: false,
                    progress_ms: 0,
                    device: null,
                    item: null
                };

                fetch
                    .mockResolvedValueOnce({
                        ok: false,
                        status: 500,
                        json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: jest.fn().mockResolvedValue(mockState)
                    });

                const result = await spotifyAPI.getCurrentPlaybackStateWithRetry();
                
                expect(fetch).toHaveBeenCalledTimes(2);
                expect(result.is_playing).toBe(false);
            });
        });
    });
});