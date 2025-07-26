/**
 * Song Segmentation Component
 * Implements requirement 3.4 - Song Selection and Segmentation
 */

import { DataManager, SongSelectionModel } from '../models/data-models.js';

// DOM Elements
let selectedPlayerInfo;
let songSearchForm;
let songSearchInput;
let searchResults;
let segmentationInterface;
let backToPlayersButton;

// Dependencies
let spotifyAPI;

// State
let currentPlayer = null;
let currentTrack = null;
let currentSegment = {
    startTime: 0,
    endTime: 30,
    duration: 30
};
let isSearching = false;
let isDragging = false;
let dragType = null; // 'start' or 'end'
let previewMonitorInterval = null; // For monitoring playback position during preview
let selectedDeviceId = null; // Currently selected device for playback

/**
 * Initialize the song segmentation component with dependency injection
 * @param {Object} spotifyAPIModule - The Spotify API module
 */
export function initSongSegmentation(spotifyAPIModule) {
    // Store dependencies
    spotifyAPI = spotifyAPIModule;

    // Get DOM elements
    selectedPlayerInfo = document.getElementById('selected-player-info');
    songSearchForm = document.getElementById('song-search-form');
    songSearchInput = document.getElementById('song-search');
    searchResults = document.getElementById('search-results');
    segmentationInterface = document.getElementById('segmentation-interface');
    backToPlayersButton = document.getElementById('back-to-players');

    // Set up event listeners
    setupEventListeners();

    // Initialize mobile UX enhancements
    initializeMobileUX();

    // Enhanced playback system will be initialized by the app

    // Initialize empty state
    showEmptySegmentationState();
}

/**
 * Initialize the enhanced playback system with Web Playback SDK
 * Uses initialization manager to prevent multiple initializations
 */
// Enhanced playback system initialization removed - handled by app.js dependency injection
// The Web Playback SDK is now initialized once in app.js and passed as a dependency

/**
 * Initialize mobile UX enhancements
 */
function initializeMobileUX() {
    // Add mobile-friendly classes to body
    if (window.innerWidth <= 767) {
        document.body.classList.add('touch-friendly', 'mobile-layout');
    }

    // Add smooth scrolling behavior
    document.documentElement.classList.add('smooth-scroll');

    // Add scroll sections for better navigation
    const sections = ['song-search-form', 'search-results', 'segmentation-interface'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('scroll-section');
        }
    });

    // Handle window resize for responsive behavior
    window.addEventListener('resize', handleWindowResize);

    // Initialize touch gesture support
    initializeTouchGestures();
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
    const isMobile = window.innerWidth <= 767;

    if (isMobile) {
        document.body.classList.add('touch-friendly', 'mobile-layout');
    } else {
        document.body.classList.remove('touch-friendly', 'mobile-layout');
    }

    // Update search results layout if they exist
    const searchResultsContent = document.getElementById('search-results-content');
    if (searchResultsContent) {
        updateSearchResultsLayout();
    }
}

/**
 * Initialize touch gesture support
 */
function initializeTouchGestures() {
    // Add passive event listeners for better performance
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

/**
 * Handle touch start events
 */
function handleTouchStart(event) {
    // Store initial touch position for gesture detection
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        window.touchStartX = touch.clientX;
        window.touchStartY = touch.clientY;
        window.touchStartTime = Date.now();
    }
}

/**
 * Handle touch move events
 */
function handleTouchMove(event) {
    // Handle swipe gestures on search result items
    if (event.touches.length === 1 && window.touchStartX !== undefined) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - window.touchStartX;
        const deltaY = touch.clientY - window.touchStartY;

        // Check if this is a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            const target = event.target.closest('.swipeable');
            if (target) {
                target.classList.add('swiping');

                // Show appropriate swipe indicator
                if (deltaX > 0) {
                    target.classList.add('swipe-right');
                    target.classList.remove('swipe-left');
                } else {
                    target.classList.add('swipe-left');
                    target.classList.remove('swipe-right');
                }
            }
        }
    }
}

/**
 * Handle touch end events
 */
function handleTouchEnd(event) {
    if (window.touchStartX !== undefined) {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - window.touchStartTime;

        // Handle swipe completion
        const target = event.target.closest('.swipeable');
        if (target && target.classList.contains('swiping')) {
            const deltaX = event.changedTouches[0].clientX - window.touchStartX;

            // Trigger action based on swipe direction
            if (Math.abs(deltaX) > 100 && touchDuration < 500) {
                const trackId = target.dataset.trackId;
                if (trackId) {
                    if (deltaX > 0) {
                        // Right swipe - use preview
                        handleSwipePreview(trackId);
                    } else {
                        // Left swipe - custom segment
                        handleSwipeCustom(trackId);
                    }
                }
            }

            // Clean up swipe classes
            target.classList.remove('swiping', 'swipe-left', 'swipe-right');
        }

        // Reset touch tracking
        window.touchStartX = undefined;
        window.touchStartY = undefined;
        window.touchStartTime = undefined;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search form submission
    if (songSearchForm) {
        songSearchForm.addEventListener('submit', handleSearchSubmit);
    }

    // Back to players button
    if (backToPlayersButton) {
        backToPlayersButton.addEventListener('click', handleBackToPlayers);
    }

    // Real-time search as user types (debounced)
    if (songSearchInput) {
        let searchTimeout;
        songSearchInput.addEventListener('input', (event) => {
            clearTimeout(searchTimeout);
            const query = event.target.value.trim();

            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 500); // 500ms debounce
            } else if (query.length === 0) {
                clearSearchResults();
            }
        });
    }
}

/**
 * Set the current player for song selection
 * @param {PlayerModel} player - The player to select songs for
 */
export function setCurrentPlayer(player) {
    currentPlayer = player;
    updatePlayerInfo();

    // Load existing song selection if available
    loadExistingSongSelection();
}

/**
 * Set segment start time
 * @param {number} startTime - Start time in seconds
 * @returns {Object} - Result {success: boolean, error: string}
 */
export function setSegmentStartTime(startTime) {
    if (!currentTrack) {
        return {
            success: false,
            error: 'No track loaded for segmentation'
        };
    }

    if (typeof startTime !== 'number' || startTime < 0) {
        return {
            success: false,
            error: 'Start time must be a non-negative number'
        };
    }

    const maxTime = Math.floor(currentTrack.duration_ms / 1000);
    if (startTime >= maxTime) {
        return {
            success: false,
            error: `Start time cannot exceed track duration (${maxTime} seconds)`
        };
    }

    if (startTime >= currentSegment.endTime) {
        return {
            success: false,
            error: 'Start time must be less than end time'
        };
    }

    updateStartTime(startTime);

    return {
        success: true,
        error: null
    };
}

/**
 * Set segment end time
 * @param {number} endTime - End time in seconds
 * @returns {Object} - Result {success: boolean, error: string}
 */
export function setSegmentEndTime(endTime) {
    if (!currentTrack) {
        return {
            success: false,
            error: 'No track loaded for segmentation'
        };
    }

    if (typeof endTime !== 'number' || endTime <= 0) {
        return {
            success: false,
            error: 'End time must be a positive number'
        };
    }

    const maxTime = Math.floor(currentTrack.duration_ms / 1000);
    if (endTime > maxTime) {
        return {
            success: false,
            error: `End time cannot exceed track duration (${maxTime} seconds)`
        };
    }

    if (endTime <= currentSegment.startTime) {
        return {
            success: false,
            error: 'End time must be greater than start time'
        };
    }

    updateEndTime(endTime);

    return {
        success: true,
        error: null
    };
}

/**
 * Preview the current segment
 * @returns {Promise<Object>} - Result {success: boolean, error: string}
 */
export async function previewSegment() {
    if (!currentTrack) {
        return {
            success: false,
            error: 'No track loaded for segmentation'
        };
    }

    // Validate segment duration
    const minDuration = 5; // Minimum 5 seconds
    const maxDuration = 60; // Maximum 60 seconds

    if (currentSegment.duration < minDuration) {
        return {
            success: false,
            error: `Segment must be at least ${minDuration} seconds long`
        };
    }

    if (currentSegment.duration > maxDuration) {
        return {
            success: false,
            error: `Segment cannot exceed ${maxDuration} seconds`
        };
    }

    try {
        // Stop any existing monitoring first
        stopSegmentMonitoring();

        // Use enhanced playback (SDK first, fallback to external devices)
        const result = await spotifyAPI.playTrackEnhanced(currentTrack.id, currentSegment.startTime, selectedDeviceId);

        if (!result.success) {
            return {
                success: false,
                error: result.error
            };
        }

        // Show pause button, hide play buttons
        togglePlaybackButtons(true);

        // Show playback method notification
        if (result.method === 'sdk') {
            showNotification('Playing on browser player', 'success');
        } else {
            showNotification(result.message || 'Playing on selected device', 'info');
        }

        // Start monitoring playback position to stop at segment end
        startSegmentMonitoring();

        return {
            success: true,
            error: null
        };

    } catch (error) {
        console.error('Failed to preview segment:', error);

        // Provide more specific error messages
        if (error.message.includes('Premium')) {
            return {
                success: false,
                error: 'Spotify Premium is required to control playback. Please upgrade your account or use the 30-second preview instead.'
            };
        } else if (error.message.includes('Device not available') || error.message.includes('Device may not be ready')) {
            return {
                success: false,
                error: 'Device not ready for playback. Please open Spotify on the selected device, play any song briefly to activate it, then try again.'
            };
        } else if (error.message.includes('No active Spotify device')) {
            return {
                success: false,
                error: 'No active Spotify device found. Please open Spotify on your phone, computer, or other device, start playing any song, then try again.'
            };
        } else {
            return {
                success: false,
                error: `Failed to play preview: ${error.message}`
            };
        }
    }
}

/**
 * Start monitoring playback position during segment preview
 */
async function startSegmentMonitoring() {
    // Clear any existing monitoring
    if (previewMonitorInterval) {
        clearInterval(previewMonitorInterval);
    }

    const segmentEndMs = currentSegment.endTime * 1000;
    const segmentStartMs = currentSegment.startTime * 1000;

    previewMonitorInterval = setInterval(async () => {
        try {
            const playbackState = await spotifyAPI.getCurrentPlaybackStateEnhanced(selectedDeviceId);

            if (!playbackState || !playbackState.is_playing) {
                // Playback stopped, clear monitoring
                stopSegmentMonitoring();
                return;
            }

            // Check if we've reached the end of the segment
            if (playbackState.progress_ms >= segmentEndMs) {
                // Stop playback and monitoring
                if (!spotifyAPI) return;
                const pauseResult = await spotifyAPI.pauseEnhanced(selectedDeviceId);
                stopSegmentMonitoring();
                togglePlaybackButtons(false);

                if (pauseResult.success) {
                    showNotification('Segment preview completed', 'info');
                } else {
                    console.warn('Failed to pause after segment:', pauseResult.error);
                    showNotification('Segment preview completed (manual stop may be needed)', 'warning');
                }
            }
        } catch (error) {
            console.error('Error monitoring playback:', error);
            // Continue monitoring despite errors
        }
    }, 500); // Check every 500ms for responsive stopping

    // Fallback timeout in case monitoring fails
    setTimeout(() => {
        if (previewMonitorInterval) {
            stopSegmentMonitoring();
            pauseSong(selectedDeviceId).catch(console.error);
            togglePlaybackButtons(false);
        }
    }, (currentSegment.duration + 2) * 1000); // Add 2 seconds buffer
}

/**
 * Stop monitoring playback position
 */
function stopSegmentMonitoring() {
    if (previewMonitorInterval) {
        clearInterval(previewMonitorInterval);
        previewMonitorInterval = null;
    }
}

/**
 * Use the default Spotify preview as the segment
 * @returns {Object} - Result {success: boolean, error: string}
 */
export function useSpotifyPreview() {
    if (!currentTrack) {
        return {
            success: false,
            error: 'No track loaded for segmentation'
        };
    }

    if (!currentTrack.preview_url) {
        return {
            success: false,
            error: 'No preview available for this track'
        };
    }

    // Spotify previews are typically 30 seconds starting around the middle of the song
    const totalDurationSeconds = Math.floor(currentTrack.duration_ms / 1000);
    const previewStart = Math.floor(totalDurationSeconds * 0.4); // Start at 40% of the song
    const previewEnd = Math.min(previewStart + 30, totalDurationSeconds); // 30 seconds or until end

    currentSegment = {
        startTime: previewStart,
        endTime: previewEnd,
        duration: previewEnd - previewStart
    };

    updateSegmentDisplay();
    updateTimelineVisualization();

    // Add visual indicator that this is a preview segment
    const segmentInfo = document.querySelector('.segment-info');
    if (segmentInfo) {
        segmentInfo.classList.add('preview-segment');
        const previewBadge = segmentInfo.querySelector('.preview-badge');
        if (!previewBadge) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary preview-badge ms-2';
            badge.innerHTML = '<i class="bi bi-magic me-1"></i>Preview Segment';
            segmentInfo.querySelector('h6').appendChild(badge);
        }
    }

    showNotification('Using Spotify preview segment (30 seconds)', 'success');

    return {
        success: true,
        error: null
    };
}

/**
 * Get current segment information
 * @returns {Object|null} - Current segment data or null if no track loaded
 */
export function getCurrentSegment() {
    if (!currentTrack) {
        return null;
    }

    return {
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        duration: currentSegment.duration,
        trackId: currentTrack.id,
        trackName: currentTrack.name,
        artistName: currentTrack.artists.map(artist => artist.name).join(', ')
    };
}

/**
 * Save the current segment to storage
 * @returns {Object} - Result {success: boolean, error: string}
 */
export function saveCurrentSegment() {
    if (!currentPlayer || !currentTrack) {
        return {
            success: false,
            error: 'No player or track selected for saving'
        };
    }

    // Validate segment
    const validation = validateSegmentForSaving();
    if (!validation.isValid) {
        return {
            success: false,
            error: validation.errors.join(' ')
        };
    }

    // Create song selection model
    const artistNames = currentTrack.artists.map(artist => artist.name).join(', ');
    const albumArt = currentTrack.album.images.length > 0 ? currentTrack.album.images[0].url : '';

    const songSelection = new SongSelectionModel({
        playerId: currentPlayer.id,
        trackId: currentTrack.id,
        trackName: currentTrack.name,
        artistName: artistNames,
        albumArt: albumArt,
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        duration: currentSegment.duration
    });

    // Save to storage
    const result = DataManager.saveSongSelection(songSelection);

    if (result.success) {
        // Update UI to show success
        showNotification('Walk-up music saved successfully!', 'success');
    }

    return result;
}

/**
 * Update the player info display
 */
function updatePlayerInfo() {
    if (!selectedPlayerInfo || !currentPlayer) return;

    selectedPlayerInfo.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="player-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style="width: 50px; height: 50px; font-size: 1.2rem;">
                ${currentPlayer.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h5 class="mb-1">${escapeHtml(currentPlayer.name)}</h5>
                <small class="text-muted">Select walk-up music for this player</small>
            </div>
        </div>
    `;
}

/**
 * Load existing song selection for the current player
 */
function loadExistingSongSelection() {
    if (!currentPlayer) return;

    const existingSelection = DataManager.getSongSelectionForPlayer(currentPlayer.id);
    if (existingSelection) {
        // Load the track and set up segmentation
        loadTrackForSegmentation(existingSelection.trackId, existingSelection);
    }
}

/**
 * Handle search form submission
 * @param {Event} event - Form submission event
 */
function handleSearchSubmit(event) {
    event.preventDefault();

    if (!songSearchInput) return;

    // Check if component is properly initialized
    if (!spotifyAPI) {
        console.warn('Song segmentation component not fully initialized yet');
        showSearchError('Please wait for the application to fully load before searching.');
        return;
    }

    const query = songSearchInput.value.trim();
    if (query) {
        performSearch(query);
    }
}

/**
 * Perform song search
 * @param {string} query - Search query
 */
async function performSearch(query) {
    if (isSearching) return;

    isSearching = true;
    showSearchLoading();

    try {
        const results = await spotifyAPI.searchSongs(query, { limit: 10 });
        displaySearchResults(results.tracks);
    } catch (error) {
        console.error('Search failed:', error);
        showSearchError(error.message);
    } finally {
        isSearching = false;
    }
}

/**
 * Show search loading state
 */
function showSearchLoading() {
    if (!searchResults) return;

    searchResults.innerHTML = `
        <div class="search-loading">
            <div class="loading-spinner me-2"></div>
            Searching for songs...
        </div>
    `;
}

/**
 * Display search results
 * @param {Array} tracks - Array of track objects
 */
function displaySearchResults(tracks) {
    if (!searchResults) return;

    if (tracks.length === 0) {
        searchResults.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-search mb-2"></i>
                <p>No songs found. Try a different search term.</p>
            </div>
        `;
        return;
    }

    const isMobile = window.innerWidth <= 767;

    const resultsHtml = tracks.map(track => {
        const albumArt = track.album.images.length > 0 ? track.album.images[0].url : '';
        const artistNames = track.artists.map(artist => artist.name).join(', ');
        const durationMinutes = Math.floor(track.duration_ms / 60000);
        const durationSeconds = Math.floor((track.duration_ms % 60000) / 1000);

        return `
            <div class="search-result-item swipeable" data-track-id="${track.id}">
                <div class="swipe-indicator left">
                    <i class="bi bi-scissors"></i>
                    <small>Custom</small>
                </div>
                <div class="swipe-indicator right">
                    <i class="bi bi-play-circle"></i>
                    <small>Preview</small>
                </div>
                <div class="d-flex align-items-center">
                    ${albumArt ? `<img src="${albumArt}" alt="Album art" class="album-art me-3">` :
                '<div class="album-art me-3 bg-secondary d-flex align-items-center justify-content-center"><i class="bi bi-music-note text-white"></i></div>'}
                    <div class="search-result-info flex-grow-1">
                        <h6 class="mb-1">${escapeHtml(track.name)}</h6>
                        <small class="text-muted">${escapeHtml(artistNames)} • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}</small>
                    </div>
                    <div class="text-end">
                        ${isMobile ? `
                            <div class="btn-group-mobile">
                                <button class="btn btn-sm btn-outline-primary select-track" data-track-id="${track.id}">
                                    <i class="bi bi-scissors me-1"></i>Custom Segment
                                </button>
                                ${track.preview_url ?
                    `<button class="btn btn-sm btn-primary use-preview" data-track-id="${track.id}">
                                        <i class="bi bi-play-circle me-1"></i>Use Preview
                                    </button>` :
                    `<button class="btn btn-sm btn-secondary" disabled title="No preview available">
                                        <i class="bi bi-x-circle me-1"></i>No Preview
                                    </button>`
                }
                            </div>
                        ` : `
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary select-track" data-track-id="${track.id}">
                                    Custom Segment
                                </button>
                                ${track.preview_url ?
                `<button class="btn btn-sm btn-primary use-preview" data-track-id="${track.id}">
                                        Use Preview
                                    </button>` :
                `<button class="btn btn-sm btn-secondary" disabled title="No preview available">
                                        No Preview
                                    </button>`
            }
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Wrap results in collapsible container for mobile
    const searchResultsContainer = isMobile ? `
        <div class="search-results-container">
            <div class="search-results-header" onclick="toggleSearchResults()">
                <span><i class="bi bi-music-note me-2"></i>Search Results (${tracks.length})</span>
                <i class="bi bi-chevron-down collapse-icon"></i>
            </div>
            <div class="search-results-content" id="search-results-content">
                <div class="search-results">${resultsHtml}</div>
            </div>
        </div>
    ` : `<div class="search-results">${resultsHtml}</div>`;

    searchResults.innerHTML = searchResultsContainer;

    // Add click handlers for track selection
    searchResults.querySelectorAll('.select-track').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const trackId = event.target.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                selectTrack(track);
                if (isMobile) {
                    scrollToSegmentation();
                }
            }
        });
    });

    // Add click handlers for preview selection
    searchResults.querySelectorAll('.use-preview').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const trackId = event.target.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                selectTrackWithPreview(track);
                if (isMobile) {
                    scrollToSegmentation();
                }
            }
        });
    });

    // Add click handlers for result items (desktop only)
    if (!isMobile) {
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (event) => {
                if (event.target.classList.contains('select-track') || event.target.classList.contains('use-preview')) return;

                const trackId = item.dataset.trackId;
                const track = tracks.find(t => t.id === trackId);
                if (track) {
                    selectTrack(track);
                }
            });
        });
    }

    // Store tracks for swipe gesture handling
    window.currentSearchTracks = tracks;
}

/**
 * Show search error
 * @param {string} message - Error message
 */
function showSearchError(message) {
    if (!searchResults) return;

    searchResults.innerHTML = `
        <div class="error-message">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Search failed: ${escapeHtml(message)}
        </div>
    `;
}

/**
 * Clear search results
 */
function clearSearchResults() {
    if (!searchResults) return;
    searchResults.innerHTML = '';
}

/**
 * Select a track for segmentation
 * @param {Object} track - Selected track object
 */
async function selectTrack(track) {
    try {
        if (!spotifyAPI) {
            throw new Error('Spotify API not initialized');
        }
        // Get detailed track information
        const detailedTrack = await spotifyAPI.getTrack(track.id);
        loadTrackForSegmentation(track.id, null, detailedTrack);
    } catch (error) {
        console.error('Failed to load track details:', error);
        showNotification('Failed to load track details. Please try again.', 'danger');
    }
}

/**
 * Select a track and automatically use its Spotify preview segment
 * @param {Object} track - Selected track object
 */
async function selectTrackWithPreview(track) {
    try {
        if (!spotifyAPI) {
            throw new Error('Spotify API not initialized');
        }
        // Get detailed track information
        const detailedTrack = await spotifyAPI.getTrack(track.id);
        loadTrackForSegmentation(track.id, null, detailedTrack, true);
    } catch (error) {
        console.error('Failed to load track details:', error);
        showNotification('Failed to load track details. Please try again.', 'danger');
    }
}

/**
 * Load a track for segmentation
 * @param {string} trackId - Spotify track ID
 * @param {SongSelectionModel|null} existingSelection - Existing song selection if any
 * @param {Object|null} trackData - Track data if already loaded
 * @param {boolean} usePreview - Whether to automatically use the Spotify preview segment
 */
async function loadTrackForSegmentation(trackId, existingSelection = null, trackData = null, usePreview = false) {
    try {
        // Get track data if not provided
        if (!trackData) {
            if (!spotifyAPI) {
                throw new Error('Spotify API not initialized');
            }
            trackData = await spotifyAPI.getTrack(trackId);
        }

        currentTrack = trackData;

        // Set up initial segment values
        if (existingSelection) {
            currentSegment = {
                startTime: existingSelection.startTime,
                endTime: existingSelection.endTime,
                duration: existingSelection.duration
            };
        } else if (usePreview && trackData.preview_url) {
            // Use Spotify preview segment (typically 30 seconds starting around middle of song)
            const totalDurationSeconds = Math.floor(trackData.duration_ms / 1000);
            const previewStart = Math.floor(totalDurationSeconds * 0.4); // Start at 40% of the song
            const previewEnd = Math.min(previewStart + 30, totalDurationSeconds); // 30 seconds or until end

            currentSegment = {
                startTime: previewStart,
                endTime: previewEnd,
                duration: previewEnd - previewStart
            };

            showNotification('Using Spotify preview segment (30 seconds)', 'success');
        } else {
            // Default to first 30 seconds
            const maxDuration = Math.floor(trackData.duration_ms / 1000);
            currentSegment = {
                startTime: 0,
                endTime: Math.min(30, maxDuration),
                duration: Math.min(30, maxDuration)
            };
        }

        // Show segmentation interface
        showSegmentationInterface();

        // Mark selected track in search results
        markSelectedTrack(trackId);

    } catch (error) {
        console.error('Failed to load track for segmentation:', error);
        showNotification('Failed to load track. Please try again.', 'danger');
    }
}

/**
 * Mark the selected track in search results
 * @param {string} trackId - Selected track ID
 */
function markSelectedTrack(trackId) {
    if (!searchResults) return;

    // Remove previous selections
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Mark current selection
    const selectedItem = searchResults.querySelector(`[data-track-id="${trackId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}

/**
 * Show the segmentation interface
 */
function showSegmentationInterface() {
    if (!segmentationInterface || !currentTrack) return;

    const artistNames = currentTrack.artists.map(artist => artist.name).join(', ');
    const totalDurationSeconds = Math.floor(currentTrack.duration_ms / 1000);
    const albumArt = currentTrack.album.images.length > 0 ? currentTrack.album.images[0].url : '';
    const isMobile = window.innerWidth <= 767;

    // Create mobile-optimized layout
    const mobileLayout = isMobile ? `
        <div class="mobile-layout">
            <!-- Sticky Controls for Mobile -->
            <div class="sticky-controls d-md-none">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="segment-info-compact">
                        <small class="text-muted">Segment: </small>
                        <span class="fw-bold" id="mobile-segment-display">${formatTime(currentSegment.startTime)} - ${formatTime(currentSegment.endTime)}</span>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" id="mobile-preview">
                        <i class="bi bi-play-fill"></i>
                    </button>
                </div>
            </div>

            <!-- Current Track Info - Mobile Section -->
            <div class="mobile-section">
                <div class="mobile-section-header">
                    <i class="bi bi-music-note me-2"></i>Selected Track
                </div>
                <div class="mobile-section-content">
                    <div class="d-flex align-items-center">
                        ${albumArt ? `<img src="${albumArt}" alt="Album art" class="album-art me-3" style="width: 80px; height: 80px;">` :
            '<div class="album-art me-3 bg-secondary d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;"><i class="bi bi-music-note text-white"></i></div>'}
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${escapeHtml(currentTrack.name)}</h5>
                            <p class="text-muted mb-1">${escapeHtml(artistNames)}</p>
                            <small class="track-duration">Duration: ${formatTime(totalDurationSeconds)}</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Audio Timeline - Mobile Section -->
            <div class="mobile-section">
                <div class="mobile-section-header">
                    <i class="bi bi-sliders me-2"></i>Timeline
                </div>
                <div class="mobile-section-content">
                    <div class="timeline-container" id="timeline-container">
                        <div class="timeline-track"></div>
                        <div class="timeline-segment" id="timeline-segment"></div>
                        <div class="timeline-handle start" id="start-handle" tabindex="0" role="slider" 
                             aria-label="Start time" aria-valuemin="0" aria-valuemax="${totalDurationSeconds}" 
                             aria-valuenow="${currentSegment.startTime}"></div>
                        <div class="timeline-handle end" id="end-handle" tabindex="0" role="slider" 
                             aria-label="End time" aria-valuemin="0" aria-valuemax="${totalDurationSeconds}" 
                             aria-valuenow="${currentSegment.endTime}"></div>
                    </div>
                    <div class="timeline-time-labels">
                        <span>0:00</span>
                        <span>${formatTime(totalDurationSeconds)}</span>
                    </div>
                </div>
            </div>

            <!-- Segment Controls - Mobile Section -->
            <div class="mobile-section">
                <div class="mobile-section-header">
                    <i class="bi bi-gear me-2"></i>Segment Controls
                </div>
                <div class="mobile-section-content">
                    <div class="row g-3">
                        <div class="col-6">
                            <label for="start-time-input" class="form-label">Start Time</label>
                            <div class="input-group">
                                <input type="number" class="form-control time-input" id="start-time-input" 
                                       min="0" max="${totalDurationSeconds}" step="1" value="${currentSegment.startTime}">
                                <span class="input-group-text">sec</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <label for="end-time-input" class="form-label">End Time</label>
                            <div class="input-group">
                                <input type="number" class="form-control time-input" id="end-time-input" 
                                       min="0" max="${totalDurationSeconds}" step="1" value="${currentSegment.endTime}">
                                <span class="input-group-text">sec</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-outline-primary w-100" id="use-spotify-preview" ${!currentTrack.preview_url ? 'disabled' : ''}>
                            <i class="bi bi-magic me-2"></i>Use Spotify Preview (30s)
                        </button>
                    </div>
                </div>
            </div>

            <!-- Device Status - Mobile Section -->
            <div class="mobile-section">
                <div class="mobile-section-header">
                    <i class="bi bi-speaker me-2"></i>Playback Device
                </div>
                <div class="mobile-section-content">
                    <div class="device-status" id="device-status">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                            <small class="text-muted">Checking Spotify devices...</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Playback Controls - Mobile Section -->
            <div class="mobile-section">
                <div class="mobile-section-header">
                    <i class="bi bi-play-circle me-2"></i>Preview Controls
                </div>
                <div class="mobile-section-content">
                    <div class="d-grid gap-2">
                        <button class="btn play-button" id="preview-segment">
                            <i class="bi bi-play-fill me-2"></i>Preview Segment
                        </button>
                        <button class="btn btn-outline-secondary" id="play-full-song">
                            <i class="bi bi-play-circle me-2"></i>Play Full Song
                        </button>
                        <button class="btn btn-outline-secondary" id="pause-playback" style="display: none;">
                            <i class="bi bi-pause-fill me-2"></i>Pause
                        </button>
                    </div>
                </div>
            </div>

            <!-- Floating Save Button for Mobile -->
            <button class="floating-save-button btn btn-spotify d-md-none" id="floating-save">
                <i class="bi bi-check-circle me-2"></i>Save Walk-up Music
            </button>
        </div>
    ` : '';

    // Desktop layout (existing)
    const desktopLayout = `
        <!-- Current Track Info -->
        <div class="current-track-info d-none d-md-block">
            <div class="d-flex align-items-center mb-3">
                ${albumArt ? `<img src="${albumArt}" alt="Album art" class="album-art me-3" style="width: 60px; height: 60px;">` :
            '<div class="album-art me-3 bg-secondary d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;"><i class="bi bi-music-note text-white"></i></div>'}
                <div>
                    <h5 class="mb-1">${escapeHtml(currentTrack.name)}</h5>
                    <p class="text-muted mb-1">${escapeHtml(artistNames)}</p>
                    <small class="track-duration">Total Duration: ${formatTime(totalDurationSeconds)}</small>
                </div>
            </div>
        </div>
        
        <!-- Audio Timeline -->
        <div class="audio-timeline d-none d-md-block">
            <h6 class="mb-3">Audio Timeline</h6>
            <div class="timeline-container" id="timeline-container">
                <div class="timeline-track"></div>
                <div class="timeline-segment" id="timeline-segment"></div>
                <div class="timeline-handle start" id="start-handle" tabindex="0" role="slider" 
                     aria-label="Start time" aria-valuemin="0" aria-valuemax="${totalDurationSeconds}" 
                     aria-valuenow="${currentSegment.startTime}"></div>
                <div class="timeline-handle end" id="end-handle" tabindex="0" role="slider" 
                     aria-label="End time" aria-valuemin="0" aria-valuemax="${totalDurationSeconds}" 
                     aria-valuenow="${currentSegment.endTime}"></div>
            </div>
            <div class="timeline-time-labels">
                <span>0:00</span>
                <span>${formatTime(totalDurationSeconds)}</span>
            </div>
        </div>
        
        <!-- Segment Controls -->
        <div class="segment-controls d-none d-md-block">
            <h6 class="mb-3">Segment Controls</h6>
            <div class="row">
                <div class="col-md-6">
                    <div class="time-input-group">
                        <label for="start-time-input" class="form-label">Start Time:</label>
                        <input type="number" class="form-control time-input" id="start-time-input" 
                               min="0" max="${totalDurationSeconds}" step="1" value="${currentSegment.startTime}">
                        <span class="form-text">seconds</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="time-input-group">
                        <label for="end-time-input" class="form-label">End Time:</label>
                        <input type="number" class="form-control time-input" id="end-time-input" 
                               min="0" max="${totalDurationSeconds}" step="1" value="${currentSegment.endTime}">
                        <span class="form-text">seconds</span>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <button class="btn btn-outline-primary btn-sm" id="use-spotify-preview" ${!currentTrack.preview_url ? 'disabled' : ''}>
                        <i class="bi bi-magic me-2"></i>Use Spotify Preview Segment
                    </button>
                    <small class="form-text text-muted ms-2">
                        ${currentTrack.preview_url ?
            'Automatically selects a 30-second preview segment' :
            'No preview available for this track'
        }
                    </small>
                </div>
            </div>
        </div>
        
        <!-- Segment Info -->
        <div class="segment-info d-none d-md-block">
            <h6><i class="bi bi-scissors me-2"></i>Selected Segment</h6>
            <div class="row">
                <div class="col-md-4">
                    <strong>Start:</strong> <span id="segment-start-display">${formatTime(currentSegment.startTime)}</span>
                </div>
                <div class="col-md-4">
                    <strong>End:</strong> <span id="segment-end-display">${formatTime(currentSegment.endTime)}</span>
                </div>
                <div class="col-md-4">
                    <strong>Duration:</strong> <span class="segment-duration" id="segment-duration-display">${formatTime(currentSegment.duration)}</span>
                </div>
            </div>
        </div>
        
        <!-- Device Status -->
        <div class="device-status mb-3 d-none d-md-block" id="device-status">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
                <small class="text-muted">Checking Spotify devices...</small>
            </div>
        </div>
        
        <!-- Playback Controls -->
        <div class="playback-controls d-none d-md-block">
            <button class="btn play-button" id="preview-segment">
                <i class="bi bi-play-fill me-2"></i>Preview Segment
            </button>
            <button class="btn btn-outline-secondary" id="play-full-song">
                <i class="bi bi-play-circle me-2"></i>Play Full Song
            </button>
            <button class="btn btn-outline-secondary" id="pause-playback" style="display: none;">
                <i class="bi bi-pause-fill me-2"></i>Pause
            </button>
        </div>
        
        <!-- Save Controls -->
        <div class="text-center mt-4 d-none d-md-block">
            <button class="btn btn-spotify btn-lg" id="save-segment">
                <i class="bi bi-check-circle me-2"></i>Save Walk-up Music
            </button>
        </div>
    `;

    segmentationInterface.innerHTML = isMobile ? mobileLayout : desktopLayout;

    // Set up segmentation event listeners
    setupSegmentationEventListeners();

    // Update timeline visualization
    updateTimelineVisualization();

    // Check device status
    checkDeviceStatus();
}

/**
 * Set up event listeners for segmentation interface
 */
function setupSegmentationEventListeners() {
    // Timeline handles
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');

    if (startHandle) {
        startHandle.addEventListener('mousedown', (e) => startDrag(e, 'start'));
        startHandle.addEventListener('keydown', (e) => handleKeyboardNavigation(e, 'start'));
    }

    if (endHandle) {
        endHandle.addEventListener('mousedown', (e) => startDrag(e, 'end'));
        endHandle.addEventListener('keydown', (e) => handleKeyboardNavigation(e, 'end'));
    }

    // Time inputs
    const startTimeInput = document.getElementById('start-time-input');
    const endTimeInput = document.getElementById('end-time-input');

    if (startTimeInput) {
        startTimeInput.addEventListener('input', handleStartTimeChange);
        startTimeInput.addEventListener('blur', validateTimeInputs);
    }

    if (endTimeInput) {
        endTimeInput.addEventListener('input', handleEndTimeChange);
        endTimeInput.addEventListener('blur', validateTimeInputs);
    }

    // Playback controls
    const previewButton = document.getElementById('preview-segment');
    const playFullButton = document.getElementById('play-full-song');
    const pauseButton = document.getElementById('pause-playback');

    if (previewButton) {
        previewButton.addEventListener('click', handlePreviewSegment);
    }

    if (playFullButton) {
        playFullButton.addEventListener('click', handlePlayFullSong);
    }

    if (pauseButton) {
        pauseButton.addEventListener('click', handlePausePlayback);
    }

    // Save button (desktop)
    const saveButton = document.getElementById('save-segment');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveSegment);
    }

    // Floating save button (mobile)
    const floatingSaveButton = document.getElementById('floating-save');
    if (floatingSaveButton) {
        floatingSaveButton.addEventListener('click', handleSaveSegment);
    }

    // Mobile preview button (sticky controls)
    const mobilePreviewButton = document.getElementById('mobile-preview');
    if (mobilePreviewButton) {
        mobilePreviewButton.addEventListener('click', handlePreviewSegment);
    }

    // Use Spotify preview button
    const usePreviewButton = document.getElementById('use-spotify-preview');
    if (usePreviewButton) {
        usePreviewButton.addEventListener('click', handleUseSpotifyPreview);
    }

    // Add touch event listeners for timeline handles on mobile
    if (startHandle && window.innerWidth <= 767) {
        startHandle.addEventListener('touchstart', (e) => startTouchDrag(e, 'start'), { passive: false });
    }

    if (endHandle && window.innerWidth <= 767) {
        endHandle.addEventListener('touchstart', (e) => startTouchDrag(e, 'end'), { passive: false });
    }

    // Global mouse events for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Device refresh button (using event delegation since it's dynamically created)
    document.addEventListener('click', (event) => {
        if (event.target.closest('.refresh-devices')) {
            checkDeviceStatus();
        }
    });
}

/**
 * Start dragging a timeline handle
 * @param {MouseEvent} event - Mouse event
 * @param {string} type - Handle type ('start' or 'end')
 */
function startDrag(event, type) {
    event.preventDefault();
    isDragging = true;
    dragType = type;

    const handle = event.target;
    handle.classList.add('dragging');

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
}

/**
 * Handle mouse move during drag
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseMove(event) {
    if (!isDragging || !currentTrack) return;

    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    const rect = timelineContainer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const totalDuration = Math.floor(currentTrack.duration_ms / 1000);
    const newTime = Math.floor(percentage * totalDuration);

    if (dragType === 'start') {
        updateStartTime(Math.min(newTime, currentSegment.endTime - 1));
    } else if (dragType === 'end') {
        updateEndTime(Math.max(newTime, currentSegment.startTime + 1));
    }
}

/**
 * Handle mouse up (end drag)
 */
function handleMouseUp() {
    if (!isDragging) return;

    isDragging = false;
    dragType = null;

    // Remove dragging class from all handles
    document.querySelectorAll('.timeline-handle').forEach(handle => {
        handle.classList.remove('dragging');
    });

    // Restore text selection
    document.body.style.userSelect = '';
}

/**
 * Start touch dragging a timeline handle
 * @param {TouchEvent} event - Touch event
 * @param {string} type - Handle type ('start' or 'end')
 */
function startTouchDrag(event, type) {
    event.preventDefault();
    isDragging = true;
    dragType = type;

    const handle = event.target;
    handle.classList.add('dragging');

    // Add touch move and end listeners
    document.addEventListener('touchmove', handleTimelineTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchUp, { passive: false });
}

/**
 * Handle touch move during timeline drag
 * @param {TouchEvent} event - Touch event
 */
function handleTimelineTouchMove(event) {
    if (!isDragging || !currentTrack) return;

    event.preventDefault();
    const touch = event.touches[0];
    const timelineContainer = document.getElementById('timeline-container');

    if (!timelineContainer) return;

    const rect = timelineContainer.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const totalDurationSeconds = Math.floor(currentTrack.duration_ms / 1000);
    const newTime = Math.floor(percentage * totalDurationSeconds);

    if (dragType === 'start') {
        updateStartTime(Math.min(newTime, currentSegment.endTime - 1));
    } else if (dragType === 'end') {
        updateEndTime(Math.max(newTime, currentSegment.startTime + 1));
    }
}

/**
 * Handle touch up (end touch drag)
 */
function handleTouchUp() {
    if (!isDragging) return;

    isDragging = false;
    dragType = null;

    // Remove dragging class from all handles
    document.querySelectorAll('.timeline-handle').forEach(handle => {
        handle.classList.remove('dragging');
    });

    // Remove touch event listeners
    document.removeEventListener('touchmove', handleTimelineTouchMove);
    document.removeEventListener('touchend', handleTouchUp);
}

/**
 * Handle keyboard navigation for timeline handles
 * @param {KeyboardEvent} event - Keyboard event
 * @param {string} type - Handle type ('start' or 'end')
 */
function handleKeyboardNavigation(event, type) {
    const step = event.shiftKey ? 5 : 1; // 5 seconds with Shift, 1 second otherwise

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            if (type === 'start') {
                updateStartTime(Math.max(0, currentSegment.startTime - step));
            } else {
                updateEndTime(Math.max(currentSegment.startTime + 1, currentSegment.endTime - step));
            }
            break;

        case 'ArrowRight':
            event.preventDefault();
            const maxTime = Math.floor(currentTrack.duration_ms / 1000);
            if (type === 'start') {
                updateStartTime(Math.min(currentSegment.endTime - 1, currentSegment.startTime + step));
            } else {
                updateEndTime(Math.min(maxTime, currentSegment.endTime + step));
            }
            break;
    }
}

/**
 * Handle start time input change
 */
function handleStartTimeChange(event) {
    const newStartTime = parseInt(event.target.value);
    if (!isNaN(newStartTime)) {
        updateStartTime(newStartTime);
    }
}

/**
 * Handle end time input change
 */
function handleEndTimeChange(event) {
    const newEndTime = parseInt(event.target.value);
    if (!isNaN(newEndTime)) {
        updateEndTime(newEndTime);
    }
}

/**
 * Update start time
 * @param {number} newStartTime - New start time in seconds
 */
function updateStartTime(newStartTime) {
    const maxTime = Math.floor(currentTrack.duration_ms / 1000);
    const clampedStartTime = Math.max(0, Math.min(newStartTime, currentSegment.endTime - 1));

    currentSegment.startTime = clampedStartTime;
    currentSegment.duration = currentSegment.endTime - currentSegment.startTime;

    // Remove preview badge since user is manually adjusting
    removePreviewBadge();

    updateSegmentDisplay();
    updateTimelineVisualization();
}

/**
 * Update end time
 * @param {number} newEndTime - New end time in seconds
 */
function updateEndTime(newEndTime) {
    const maxTime = Math.floor(currentTrack.duration_ms / 1000);
    const clampedEndTime = Math.max(currentSegment.startTime + 1, Math.min(newEndTime, maxTime));

    currentSegment.endTime = clampedEndTime;
    currentSegment.duration = currentSegment.endTime - currentSegment.startTime;

    // Remove preview badge since user is manually adjusting
    removePreviewBadge();

    updateSegmentDisplay();
    updateTimelineVisualization();
}

/**
 * Remove preview badge when user manually adjusts segment
 */
function removePreviewBadge() {
    const segmentInfo = document.querySelector('.segment-info');
    if (segmentInfo) {
        segmentInfo.classList.remove('preview-segment');
        const previewBadge = segmentInfo.querySelector('.preview-badge');
        if (previewBadge) {
            previewBadge.remove();
        }
    }
}

/**
 * Update segment display values
 */
function updateSegmentDisplay() {
    // Update input values
    const startInput = document.getElementById('start-time-input');
    const endInput = document.getElementById('end-time-input');

    if (startInput) startInput.value = currentSegment.startTime;
    if (endInput) endInput.value = currentSegment.endTime;

    // Update display values (desktop)
    const startDisplay = document.getElementById('segment-start-display');
    const endDisplay = document.getElementById('segment-end-display');
    const durationDisplay = document.getElementById('segment-duration-display');

    if (startDisplay) startDisplay.textContent = formatTime(currentSegment.startTime);
    if (endDisplay) endDisplay.textContent = formatTime(currentSegment.endTime);
    if (durationDisplay) durationDisplay.textContent = formatTime(currentSegment.duration);

    // Update mobile segment display (sticky controls)
    const mobileSegmentDisplay = document.getElementById('mobile-segment-display');
    if (mobileSegmentDisplay) {
        mobileSegmentDisplay.textContent = `${formatTime(currentSegment.startTime)} - ${formatTime(currentSegment.endTime)}`;
    }

    // Update ARIA values
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');

    if (startHandle) startHandle.setAttribute('aria-valuenow', currentSegment.startTime);
    if (endHandle) endHandle.setAttribute('aria-valuenow', currentSegment.endTime);

    // Add visual feedback for segment updates
    const segmentInfo = document.querySelector('.segment-info, .mobile-segment-display');
    if (segmentInfo) {
        segmentInfo.classList.add('segment-update');
        setTimeout(() => {
            segmentInfo.classList.remove('segment-update');
        }, 300);
    }
}

/**
 * Update timeline visualization
 */
function updateTimelineVisualization() {
    if (!currentTrack) return;

    const totalDuration = Math.floor(currentTrack.duration_ms / 1000);
    const startPercentage = (currentSegment.startTime / totalDuration) * 100;
    const endPercentage = (currentSegment.endTime / totalDuration) * 100;
    const widthPercentage = endPercentage - startPercentage;

    // Update segment visualization
    const segment = document.getElementById('timeline-segment');
    if (segment) {
        segment.style.left = `${startPercentage}%`;
        segment.style.width = `${widthPercentage}%`;
    }

    // Update handle positions
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');

    if (startHandle) {
        startHandle.style.left = `${startPercentage}%`;
    }

    if (endHandle) {
        endHandle.style.left = `${endPercentage}%`;
    }

    // Add animation class for smooth updates
    const segmentationInterface = document.getElementById('segmentation-interface');
    if (segmentationInterface) {
        segmentationInterface.classList.add('segment-update');
        setTimeout(() => {
            segmentationInterface.classList.remove('segment-update');
        }, 300);
    }
}

/**
 * Check and display device status
 */
export async function checkDeviceStatus() {
    const deviceStatus = document.getElementById('device-status');
    if (!deviceStatus) return;

    try {
        const { getAvailableDevices } = await import('./spotify-api.js');
        const devices = await getAvailableDevices();

        if (devices.length === 0) {
            deviceStatus.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>No Spotify devices found</strong>
                        </div>
                        <button class="btn btn-sm btn-outline-warning refresh-devices" title="Refresh device list">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <small>Please open Spotify on your phone, computer, or other device, then refresh to see available devices.</small>
                </div>
            `;
        } else {
            // Sort devices: active first, then by name for consistent ordering
            const sortedDevices = [...devices].sort((a, b) => {
                if (a.is_active && !b.is_active) return -1;
                if (!a.is_active && b.is_active) return 1;
                return a.name.localeCompare(b.name);
            });

            // Set default selected device if none is selected
            if (!selectedDeviceId && sortedDevices.length > 0) {
                const activeDevice = sortedDevices.find(device => device.is_active);
                selectedDeviceId = activeDevice ? activeDevice.id : sortedDevices[0].id;
            }

            const deviceOptions = sortedDevices.map(device => {
                const isSelected = selectedDeviceId === device.id;
                const activeLabel = device.is_active ? ' (Active)' : '';
                const deviceIcon = getDeviceIcon(device.type);

                const activationTip = !device.is_active ?
                    '<small class="text-warning d-block"><i class="bi bi-info-circle me-1"></i>May need activation</small>' : '';

                return `
                    <div class="form-check">
                        <input class="form-check-input device-radio" type="radio" name="spotify-device" 
                               id="device-${device.id}" value="${device.id}" ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label d-flex align-items-center" for="device-${device.id}">
                            <i class="bi ${deviceIcon} me-2"></i>
                            <div>
                                <div class="fw-medium">${escapeHtml(device.name)}${activeLabel}</div>
                                <small class="text-muted">${escapeHtml(device.type)}</small>
                                ${activationTip}
                            </div>
                        </label>
                    </div>
                `;
            }).join('');

            deviceStatus.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-speaker me-2"></i>
                            <strong>Select Playback Device</strong>
                        </div>
                        <button class="btn btn-sm btn-outline-info refresh-devices" title="Refresh device list">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <div class="device-selection">
                        ${deviceOptions}
                    </div>
                    <small class="text-muted mt-2 d-block">
                        <strong>Device Setup:</strong><br>
                        • Don't see your device? Open Spotify on the desired device and refresh this list.<br>
                        • If playback fails: Open Spotify on the selected device, play any song briefly to activate it, then try again.
                    </small>
                </div>
            `;

            // Add event listeners for device selection
            deviceStatus.querySelectorAll('.device-radio').forEach(radio => {
                radio.addEventListener('change', handleDeviceSelection);
            });
        }
    } catch (error) {
        console.error('Failed to check device status:', error);

        if (error.message.includes('Premium')) {
            deviceStatus.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-star me-2"></i>
                            <strong>Spotify Premium Required</strong>
                        </div>
                        <button class="btn btn-sm btn-outline-warning refresh-devices" title="Refresh device status">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <small>Playback control requires a Spotify Premium subscription. You can still save segments, but preview won't work.</small>
                </div>
            `;
        } else {
            deviceStatus.innerHTML = `
                <div class="alert alert-secondary" role="alert">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-question-circle me-2"></i>
                            <strong>Unable to check device status</strong>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary refresh-devices" title="Refresh device status">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <small>Preview may not work. Make sure Spotify is open and you're logged in.</small>
                </div>
            `;
        }
    }
}

/**
 * Handle device selection change
 * @param {Event} event - Change event from device radio button
 */
function handleDeviceSelection(event) {
    selectedDeviceId = event.target.value;
    console.log('Selected device:', selectedDeviceId);

    // Show feedback to user with activation tip
    const selectedDevice = event.target.closest('.form-check').querySelector('label .fw-medium').textContent;
    showNotification(`Selected device: ${selectedDevice}. If playback fails, open Spotify on this device and play any song briefly to activate it.`, 'info');
}

/**
 * Validate time inputs
 */
function validateTimeInputs() {
    if (!currentTrack) return;

    const maxTime = Math.floor(currentTrack.duration_ms / 1000);
    const minDuration = 5; // Minimum 5 seconds
    const maxDuration = 60; // Maximum 60 seconds

    // Ensure minimum and maximum duration constraints
    if (currentSegment.duration < minDuration) {
        const adjustment = minDuration - currentSegment.duration;
        if (currentSegment.endTime + adjustment <= maxTime) {
            updateEndTime(currentSegment.endTime + adjustment);
        } else {
            updateStartTime(Math.max(0, currentSegment.startTime - adjustment));
        }

        showNotification(`Segment duration must be at least ${minDuration} seconds.`, 'warning');
    } else if (currentSegment.duration > maxDuration) {
        updateEndTime(currentSegment.startTime + maxDuration);
        showNotification(`Segment duration cannot exceed ${maxDuration} seconds.`, 'warning');
    }
}

/**
 * Handle preview segment button click
 */
async function handlePreviewSegment() {
    if (!currentTrack) return;

    // Use the improved preview function
    const result = await previewSegment();

    if (result.success) {
        showNotification('Playing segment preview...', 'success');
    } else {
        showNotification(result.error, 'danger');
    }
}

/**
 * Handle play full song button click
 */
async function handlePlayFullSong() {
    if (!currentTrack) return;

    try {
        const { playSong } = await import('./spotify-api.js');

        // Check if a device is selected
        if (!selectedDeviceId) {
            showNotification('No device selected. Please select a device from the list above.', 'danger');
            return;
        }

        // Stop any existing segment monitoring
        stopSegmentMonitoring();

        await playSong(currentTrack.id, 0, selectedDeviceId);

        togglePlaybackButtons(true);
        showNotification('Playing full song...', 'success');

    } catch (error) {
        console.error('Failed to play full song:', error);

        // Provide more specific error messages
        if (error.message.includes('Premium')) {
            showNotification('Spotify Premium is required to control playback. Please upgrade your account.', 'danger');
        } else if (error.message.includes('Device not available') || error.message.includes('Device may not be ready')) {
            showNotification('Device not ready for playback. Please open Spotify on the selected device, play any song briefly to activate it, then try again.', 'danger');
        } else if (error.message.includes('No active Spotify device')) {
            showNotification('No active Spotify device found. Please open Spotify on your phone, computer, or other device, start playing any song, then try again.', 'danger');
        } else {
            showNotification(`Failed to play song: ${error.message}`, 'danger');
        }
    }
}

/**
 * Handle pause playback button click
 */
async function handlePausePlayback() {
    try {
        const { pauseSong } = await import('./spotify-api.js');
        await pauseSong(selectedDeviceId);

        // Stop segment monitoring
        stopSegmentMonitoring();

        togglePlaybackButtons(false);
        showNotification('Playback paused.', 'info');

    } catch (error) {
        console.error('Failed to pause playback:', error);
        showNotification('Failed to pause playback.', 'danger');
    }
}

/**
 * Toggle playback button visibility
 * @param {boolean} isPlaying - Whether music is currently playing
 */
function togglePlaybackButtons(isPlaying) {
    const previewButton = document.getElementById('preview-segment');
    const playFullButton = document.getElementById('play-full-song');
    const pauseButton = document.getElementById('pause-playback');

    if (previewButton) previewButton.style.display = isPlaying ? 'none' : 'inline-block';
    if (playFullButton) playFullButton.style.display = isPlaying ? 'none' : 'inline-block';
    if (pauseButton) pauseButton.style.display = isPlaying ? 'inline-block' : 'none';
}

/**
 * Handle use Spotify preview button click
 */
function handleUseSpotifyPreview() {
    const result = useSpotifyPreview();

    if (result.success) {
        // Button feedback is handled by the useSpotifyPreview function
    } else {
        showNotification(result.error, 'warning');
    }
}

/**
 * Handle save segment button click
 */
function handleSaveSegment() {
    if (!currentPlayer || !currentTrack) return;

    // Validate segment
    const validation = validateSegmentForSaving();
    if (!validation.isValid) {
        showNotification(validation.errors.join(' '), 'danger');
        return;
    }

    // Create song selection model
    const artistNames = currentTrack.artists.map(artist => artist.name).join(', ');
    const albumArt = currentTrack.album.images.length > 0 ? currentTrack.album.images[0].url : '';

    const songSelection = new SongSelectionModel({
        playerId: currentPlayer.id,
        trackId: currentTrack.id,
        trackName: currentTrack.name,
        artistName: artistNames,
        albumArt: albumArt,
        startTime: currentSegment.startTime,
        endTime: currentSegment.endTime,
        duration: currentSegment.duration
    });

    // Save to storage
    const result = DataManager.saveSongSelection(songSelection);

    if (result.success) {
        showNotification('Walk-up music saved successfully!', 'success');

        // Navigate back to players view after a short delay
        setTimeout(() => {
            handleBackToPlayers();
        }, 1500);
    } else {
        showNotification(`Failed to save walk-up music: ${result.error}`, 'danger');
    }
}

/**
 * Validate segment for saving
 * @returns {Object} Validation result
 */
function validateSegmentForSaving() {
    const errors = [];

    if (currentSegment.duration < 5) {
        errors.push('Segment must be at least 5 seconds long.');
    }

    if (currentSegment.duration > 60) {
        errors.push('Segment cannot exceed 60 seconds.');
    }

    if (currentSegment.startTime >= currentSegment.endTime) {
        errors.push('End time must be greater than start time.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Handle back to players button click
 */
function handleBackToPlayers() {
    // Stop any active monitoring
    stopSegmentMonitoring();

    // Navigate to players view
    const playersNavLink = document.querySelector('[data-view="players"]');
    if (playersNavLink) {
        playersNavLink.click();
    }
}

/**
 * Toggle search results visibility (mobile)
 */
window.toggleSearchResults = function () {
    const header = document.querySelector('.search-results-header');
    const content = document.getElementById('search-results-content');

    if (header && content) {
        const isCollapsed = content.classList.contains('collapsed');

        if (isCollapsed) {
            content.classList.remove('collapsed');
            header.classList.remove('collapsed');
            content.style.maxHeight = content.scrollHeight + 'px';
        } else {
            content.classList.add('collapsed');
            header.classList.add('collapsed');
            content.style.maxHeight = '0px';
        }
    }
};

/**
 * Update search results layout based on screen size
 */
function updateSearchResultsLayout() {
    const isMobile = window.innerWidth <= 767;
    const searchResultsContent = document.getElementById('search-results-content');

    if (searchResultsContent) {
        if (isMobile) {
            // Ensure mobile layout is applied
            const header = document.querySelector('.search-results-header');
            if (header) {
                header.style.display = 'flex';
            }
        } else {
            // Ensure desktop layout is applied
            const header = document.querySelector('.search-results-header');
            if (header) {
                header.style.display = 'none';
            }
            searchResultsContent.classList.remove('collapsed');
            searchResultsContent.style.maxHeight = 'none';
        }
    }
}

/**
 * Handle swipe gesture for preview selection
 */
function handleSwipePreview(trackId) {
    const tracks = window.currentSearchTracks || [];
    const track = tracks.find(t => t.id === trackId);
    if (track && track.preview_url) {
        selectTrackWithPreview(track);
        scrollToSegmentation();
        showNotification('Swipe right: Using preview segment', 'info');
    } else {
        showNotification('No preview available for this track', 'warning');
    }
}

/**
 * Handle swipe gesture for custom segment selection
 */
function handleSwipeCustom(trackId) {
    const tracks = window.currentSearchTracks || [];
    const track = tracks.find(t => t.id === trackId);
    if (track) {
        selectTrack(track);
        scrollToSegmentation();
        showNotification('Swipe left: Creating custom segment', 'info');
    }
}

/**
 * Scroll to segmentation interface smoothly
 */
function scrollToSegmentation() {
    const segmentationInterface = document.getElementById('segmentation-interface');
    if (segmentationInterface) {
        segmentationInterface.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
    }
}

/**
 * Show empty segmentation state
 */
function showEmptySegmentationState() {
    if (!segmentationInterface) return;

    segmentationInterface.innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="bi bi-music-note-beamed display-4 mb-3"></i>
            <p>Select a song from the search results to start creating a segment</p>
        </div>
    `;
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, danger, etc.)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Find or create notification container
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'position-fixed top-0 end-0 p-3';
        notificationContainer.style.zIndex = '1050';
        document.body.appendChild(notificationContainer);
    }

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} - The escaped string
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/**
 *
 Show playback status notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, info, warning, danger)
 */
function showPlaybackStatusNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show playback-notification`;
    notification.innerHTML = `
        <i class="bi bi-${getNotificationIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to the top of the song selection view
    const songSelectionView = document.getElementById('song-selection-view');
    if (songSelectionView) {
        const container = songSelectionView.querySelector('.container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
        }
    }

    // Auto-dismiss after 5 seconds for info messages
    if (type === 'info') {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} Bootstrap icon name
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        case 'danger': return 'x-circle';
        default: return 'info-circle';
    }
}

/**
 * Update device selection UI to show SDK device as default
 * @param {string} sdkDeviceId - SDK device ID
 */
function updateDeviceSelectionUI(sdkDeviceId) {
    // Set SDK device as selected
    selectedDeviceId = sdkDeviceId;

    // Hide device selection since SDK handles it automatically
    const deviceSelection = document.getElementById('device-selection');
    if (deviceSelection) {
        deviceSelection.style.display = 'none';
    }

    // Add a small indicator showing browser player is active
    addBrowserPlayerIndicator();
}

/**
 * Add browser player indicator to the UI
 */
function addBrowserPlayerIndicator() {
    const segmentationInterface = document.getElementById('segmentation-interface');
    if (!segmentationInterface) return;

    // Check if indicator already exists
    if (segmentationInterface.querySelector('.browser-player-indicator')) return;

    const indicator = document.createElement('div');
    indicator.className = 'browser-player-indicator alert alert-success mb-3';
    indicator.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-browser-chrome me-2"></i>
            <div class="flex-grow-1">
                <strong>Browser Player Active</strong>
                <small class="d-block text-muted">Music will play directly in your browser - no device selection needed</small>
            </div>
            <button class="btn btn-sm btn-outline-secondary" onclick="showDeviceSelection()">
                <i class="bi bi-gear me-1"></i>Change
            </button>
        </div>
    `;

    // Insert at the top of segmentation interface
    segmentationInterface.insertBefore(indicator, segmentationInterface.firstChild);
}

/**
 * Show device selection interface
 */
async function showDeviceSelection() {
    try {
        if (!spotifyAPI) {
            throw new Error('Spotify API not initialized');
        }
        const devices = await spotifyAPI.getAvailableDevicesEnhanced();
        displayDeviceSelection(devices);
    } catch (error) {
        console.error('Failed to get devices:', error);
        showNotification('Failed to load devices. Please try again.', 'danger');
    }
}

/**
 * Display device selection interface
 * @param {Array} devices - Available devices
 */
function displayDeviceSelection(devices) {
    const segmentationInterface = document.getElementById('segmentation-interface');
    if (!segmentationInterface) return;

    // Remove existing device selection
    const existingSelection = segmentationInterface.querySelector('.device-selection-container');
    if (existingSelection) {
        existingSelection.remove();
    }

    // Remove browser player indicator
    const indicator = segmentationInterface.querySelector('.browser-player-indicator');
    if (indicator) {
        indicator.remove();
    }

    if (devices.length === 0) {
        showNotification('No devices available. Please open Spotify on a device and try again.', 'warning');
        return;
    }

    const deviceSelectionHtml = `
        <div class="device-selection-container card mb-3">
            <div class="card-header bg-info text-white">
                <h6 class="mb-0">
                    <i class="bi bi-speaker me-2"></i>Select Playback Device
                </h6>
            </div>
            <div class="card-body">
                <div class="device-list">
                    ${devices.map(device => `
                        <div class="device-item ${device.is_active ? 'active' : ''}" data-device-id="${device.id}">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-${getDeviceIcon(device.type)} me-3"></i>
                                <div class="flex-grow-1">
                                    <div class="device-name">${escapeHtml(device.name)}</div>
                                    <small class="text-muted">${device.type}${device.is_sdk_device ? ' (Browser)' : ''}</small>
                                </div>
                                <div class="device-status">
                                    ${device.is_active ? '<span class="badge bg-success">Active</span>' : ''}
                                    ${device.is_sdk_device ? '<span class="badge bg-primary ms-1">Recommended</span>' : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3">
                    <button class="btn btn-sm btn-secondary" onclick="hideDeviceSelection()">
                        <i class="bi bi-x me-1"></i>Cancel
                    </button>
                </div>
            </div>
        </div>
    `;

    // Insert device selection
    segmentationInterface.insertAdjacentHTML('afterbegin', deviceSelectionHtml);

    // Add click handlers for device selection
    segmentationInterface.querySelectorAll('.device-item').forEach(item => {
        item.addEventListener('click', () => {
            const deviceId = item.dataset.deviceId;
            const deviceName = item.querySelector('.device-name').textContent;
            const isSDKDevice = item.querySelector('.badge.bg-primary');

            selectDevice(deviceId, deviceName, !!isSDKDevice);
        });
    });
}

/**
 * Get device icon based on device type
 * @param {string} type - Device type
 * @returns {string} Bootstrap icon name
 */
function getDeviceIcon(type) {
    switch (type.toLowerCase()) {
        case 'computer': return 'laptop';
        case 'smartphone': return 'phone';
        case 'speaker': return 'speaker';
        case 'tv': return 'tv';
        case 'automobile': return 'car-front';
        case 'game_console': return 'controller';
        default: return 'speaker';
    }
}

/**
 * Select a device for playback
 * @param {string} deviceId - Device ID
 * @param {string} deviceName - Device name
 * @param {boolean} isSDKDevice - Whether this is the SDK device
 */
function selectDevice(deviceId, deviceName, isSDKDevice) {
    selectedDeviceId = deviceId;

    // Set SDK preference based on device selection
    if (spotifyAPI) {
        spotifyAPI.setSDKPreference(isSDKDevice);
    }

    // Hide device selection
    hideDeviceSelection();

    // Show confirmation
    if (isSDKDevice) {
        addBrowserPlayerIndicator();
        showNotification('Browser player selected', 'success');
    } else {
        showNotification(`Selected device: ${deviceName}`, 'success');

        // Add external device indicator
        addExternalDeviceIndicator(deviceName);
    }
}

/**
 * Add external device indicator
 * @param {string} deviceName - Selected device name
 */
function addExternalDeviceIndicator(deviceName) {
    const segmentationInterface = document.getElementById('segmentation-interface');
    if (!segmentationInterface) return;

    // Remove existing indicators
    const existingIndicator = segmentationInterface.querySelector('.device-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.className = 'device-indicator alert alert-info mb-3';
    indicator.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-speaker me-2"></i>
            <div class="flex-grow-1">
                <strong>External Device Selected</strong>
                <small class="d-block text-muted">Playing on: ${escapeHtml(deviceName)}</small>
            </div>
            <button class="btn btn-sm btn-outline-secondary" onclick="showDeviceSelection()">
                <i class="bi bi-gear me-1"></i>Change
            </button>
        </div>
    `;

    segmentationInterface.insertBefore(indicator, segmentationInterface.firstChild);
}

/**
 * Hide device selection interface
 */
function hideDeviceSelection() {
    const deviceSelection = document.querySelector('.device-selection-container');
    if (deviceSelection) {
        deviceSelection.remove();
    }
}

/**
 * Handle re-authentication for SDK scopes
 */
async function handleReauthForSDK() {
    try {
        // Import logout function
        const { logout } = await import('./auth.js');

        // Show confirmation
        if (confirm('This will log you out and redirect to Spotify for re-authentication with browser player permissions. Continue?')) {
            logout();
        }
    } catch (error) {
        console.error('Failed to handle re-authentication:', error);
        alert('Failed to initiate re-authentication. Please try refreshing the page.');
    }
}

// Make functions available globally for onclick handlers
window.showDeviceSelection = showDeviceSelection;
window.hideDeviceSelection = hideDeviceSelection;
window.handleReauthForSDK = handleReauthForSDK;