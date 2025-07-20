/**
 * Song Segmentation Component
 * Implements requirement 3.4 - Song Selection and Segmentation
 */

import { searchSongs, getTrack } from './spotify-api.js';
import { DataManager, SongSelectionModel } from '../models/data-models.js';

// DOM Elements
let selectedPlayerInfo;
let songSearchForm;
let songSearchInput;
let searchResults;
let segmentationInterface;
let backToPlayersButton;

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

/**
 * Initialize the song segmentation component
 */
export function initSongSegmentation() {
    // Get DOM elements
    selectedPlayerInfo = document.getElementById('selected-player-info');
    songSearchForm = document.getElementById('song-search-form');
    songSearchInput = document.getElementById('song-search');
    searchResults = document.getElementById('search-results');
    segmentationInterface = document.getElementById('segmentation-interface');
    backToPlayersButton = document.getElementById('back-to-players');

    // Set up event listeners
    setupEventListeners();

    // Initialize empty state
    showEmptySegmentationState();
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
        // Import playback functions dynamically to avoid circular dependencies
        const { playSong, pauseSong } = await import('./spotify-api.js');

        await playSong(currentTrack.id, currentSegment.startTime);

        // Show pause button, hide play buttons
        togglePlaybackButtons(true);

        // Auto-pause after segment duration
        setTimeout(async () => {
            try {
                await pauseSong();
                togglePlaybackButtons(false);
            } catch (error) {
                console.error('Failed to auto-pause:', error);
            }
        }, currentSegment.duration * 1000);

        return {
            success: true,
            error: null
        };

    } catch (error) {
        console.error('Failed to preview segment:', error);
        return {
            success: false,
            error: 'Failed to play preview. Make sure Spotify is open and playing.'
        };
    }
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
        const results = await searchSongs(query, { limit: 10 });
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

    const resultsHtml = tracks.map(track => {
        const albumArt = track.album.images.length > 0 ? track.album.images[0].url : '';
        const artistNames = track.artists.map(artist => artist.name).join(', ');
        const durationMinutes = Math.floor(track.duration_ms / 60000);
        const durationSeconds = Math.floor((track.duration_ms % 60000) / 1000);

        return `
            <div class="search-result-item" data-track-id="${track.id}">
                <div class="d-flex align-items-center">
                    ${albumArt ? `<img src="${albumArt}" alt="Album art" class="album-art me-3">` :
                '<div class="album-art me-3 bg-secondary d-flex align-items-center justify-content-center"><i class="bi bi-music-note text-white"></i></div>'}
                    <div class="search-result-info flex-grow-1">
                        <h6 class="mb-1">${escapeHtml(track.name)}</h6>
                        <small class="text-muted">${escapeHtml(artistNames)} • ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}</small>
                    </div>
                    <div class="text-end">
                        <button class="btn btn-sm btn-outline-primary select-track" data-track-id="${track.id}">
                            Select
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = `<div class="search-results">${resultsHtml}</div>`;

    // Add click handlers for track selection
    searchResults.querySelectorAll('.select-track').forEach(button => {
        button.addEventListener('click', (event) => {
            const trackId = event.target.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                selectTrack(track);
            }
        });
    });

    // Add click handlers for result items
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (event) => {
            if (event.target.classList.contains('select-track')) return;

            const trackId = item.dataset.trackId;
            const track = tracks.find(t => t.id === trackId);
            if (track) {
                selectTrack(track);
            }
        });
    });
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
        // Get detailed track information
        const detailedTrack = await getTrack(track.id);
        loadTrackForSegmentation(track.id, null, detailedTrack);
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
 */
async function loadTrackForSegmentation(trackId, existingSelection = null, trackData = null) {
    try {
        // Get track data if not provided
        if (!trackData) {
            trackData = await getTrack(trackId);
        }

        currentTrack = trackData;

        // Set up initial segment values
        if (existingSelection) {
            currentSegment = {
                startTime: existingSelection.startTime,
                endTime: existingSelection.endTime,
                duration: existingSelection.duration
            };
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

    segmentationInterface.innerHTML = `
        <!-- Current Track Info -->
        <div class="current-track-info">
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
        <div class="audio-timeline">
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
        <div class="segment-controls">
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
        </div>
        
        <!-- Segment Info -->
        <div class="segment-info">
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
        
        <!-- Playback Controls -->
        <div class="playback-controls">
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
        <div class="text-center mt-4">
            <button class="btn btn-spotify btn-lg" id="save-segment">
                <i class="bi bi-check-circle me-2"></i>Save Walk-up Music
            </button>
        </div>
    `;

    // Set up segmentation event listeners
    setupSegmentationEventListeners();

    // Update timeline visualization
    updateTimelineVisualization();
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

    // Save button
    const saveButton = document.getElementById('save-segment');
    if (saveButton) {
        saveButton.addEventListener('click', handleSaveSegment);
    }

    // Global mouse events for dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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

    updateSegmentDisplay();
    updateTimelineVisualization();
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

    // Update display values
    const startDisplay = document.getElementById('segment-start-display');
    const endDisplay = document.getElementById('segment-end-display');
    const durationDisplay = document.getElementById('segment-duration-display');

    if (startDisplay) startDisplay.textContent = formatTime(currentSegment.startTime);
    if (endDisplay) endDisplay.textContent = formatTime(currentSegment.endTime);
    if (durationDisplay) durationDisplay.textContent = formatTime(currentSegment.duration);

    // Update ARIA values
    const startHandle = document.getElementById('start-handle');
    const endHandle = document.getElementById('end-handle');

    if (startHandle) startHandle.setAttribute('aria-valuenow', currentSegment.startTime);
    if (endHandle) endHandle.setAttribute('aria-valuenow', currentSegment.endTime);
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

    try {
        // Import playback functions dynamically to avoid circular dependencies
        const { playSong, pauseSong } = await import('./spotify-api.js');

        await playSong(currentTrack.id, currentSegment.startTime);

        // Show pause button, hide play buttons
        togglePlaybackButtons(true);

        // Auto-pause after segment duration
        setTimeout(async () => {
            try {
                await pauseSong();
                togglePlaybackButtons(false);
            } catch (error) {
                console.error('Failed to auto-pause:', error);
            }
        }, currentSegment.duration * 1000);

        showNotification('Playing segment preview...', 'success');

    } catch (error) {
        console.error('Failed to preview segment:', error);
        showNotification('Failed to play preview. Make sure Spotify is open and playing.', 'danger');
    }
}

/**
 * Handle play full song button click
 */
async function handlePlayFullSong() {
    if (!currentTrack) return;

    try {
        const { playSong } = await import('./spotify-api.js');
        await playSong(currentTrack.id, 0);

        togglePlaybackButtons(true);
        showNotification('Playing full song...', 'success');

    } catch (error) {
        console.error('Failed to play full song:', error);
        showNotification('Failed to play song. Make sure Spotify is open and playing.', 'danger');
    }
}

/**
 * Handle pause playback button click
 */
async function handlePausePlayback() {
    try {
        const { pauseSong } = await import('./spotify-api.js');
        await pauseSong();

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
    // Navigate to players view
    const playersNavLink = document.querySelector('[data-view="players"]');
    if (playersNavLink) {
        playersNavLink.click();
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