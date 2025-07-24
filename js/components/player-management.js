/**
 * Player Management Component
 * Implements requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { PlayerModel, DataManager } from '../models/data-models.js';
import playerManagementService from './player-management-service.js';

// DOM Elements
let playerNameInput;
let addPlayerForm;
let playersList;
let playerCountBadge;
let editPlayerModal;
let editPlayerForm;
let editPlayerNameInput;
let editPlayerId;
let deleteConfirmModal;
let deletePlayerId;

/**
 * Initialize the player management component
 */
export function initPlayerManagement() {
  // Get DOM elements
  playerNameInput = document.getElementById('player-name');
  addPlayerForm = document.getElementById('add-player-form');
  playersList = document.getElementById('players-list');
  playerCountBadge = document.getElementById('player-count');

  // Create modals if they don't exist
  createModals();

  // Set up event listeners
  setupEventListeners();

  // Set up authentication event listeners
  setupAuthEventListeners();

  // Load and display players
  loadPlayers();
}

/**
 * Create modals for editing and deleting players
 */
function createModals() {
  // Create edit player modal if it doesn't exist
  if (!document.getElementById('edit-player-modal')) {
    const editModalHtml = `
      <div class="modal fade" id="edit-player-modal" tabindex="-1" aria-labelledby="editPlayerModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="editPlayerModalLabel">Edit Player</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="edit-player-form">
                <div class="mb-3">
                  <label for="edit-player-name" class="form-label">Player Name</label>
                  <input type="text" class="form-control" id="edit-player-name" required>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-spotify" id="save-edit-player">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', editModalHtml);
  }

  // Create delete confirmation modal if it doesn't exist
  if (!document.getElementById('delete-player-modal')) {
    const deleteModalHtml = `
      <div class="modal fade" id="delete-player-modal" tabindex="-1" aria-labelledby="deletePlayerModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="deletePlayerModalLabel">Delete Player</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this player? This action cannot be undone.</p>
              <p>This will also remove any song selections and batting order positions for this player.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirm-delete-player">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', deleteModalHtml);
  }

  // Get modal elements
  editPlayerModal = new bootstrap.Modal(document.getElementById('edit-player-modal'));
  editPlayerForm = document.getElementById('edit-player-form');
  editPlayerNameInput = document.getElementById('edit-player-name');
  deleteConfirmModal = new bootstrap.Modal(document.getElementById('delete-player-modal'));
}

/**
 * Set up event listeners for player management
 */
function setupEventListeners() {
  // Add player form submission
  if (addPlayerForm) {
    addPlayerForm.addEventListener('submit', handleAddPlayer);
  }

  // Edit player form submission
  const saveEditButton = document.getElementById('save-edit-player');
  if (saveEditButton) {
    saveEditButton.addEventListener('click', handleSaveEditPlayer);
  }

  // Delete player confirmation
  const confirmDeleteButton = document.getElementById('confirm-delete-player');
  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener('click', handleConfirmDeletePlayer);
  }
}

/**
 * Set up authentication event listeners
 */
function setupAuthEventListeners() {
  // Listen for authentication state changes
  document.addEventListener('authStateChanged', handleAuthStateChange);
  document.addEventListener('authSuccess', handleAuthSuccess);
  document.addEventListener('authRefreshed', handleAuthRefresh);
  document.addEventListener('authLogout', handleAuthLogout);

  // Listen for navigation events
  document.addEventListener('navigatedToApp', handleNavigatedToApp);
}

/**
 * Load and display players
 */
function loadPlayers() {
  if (!playersList) {
    console.log('Player management: playersList element not found, skipping load');
    return;
  }

  // Clear the current list
  playersList.innerHTML = '';

  // Get players from player management service
  const result = playerManagementService.getPlayers();

  if (!result.success) {
    // Display error message
    showNotification(`Failed to load players: ${result.error}`, 'danger');
    return;
  }

  const players = result.data;

  if (players.length === 0) {
    // Display a message if no players
    playersList.innerHTML = `
      <li class="list-group-item text-center text-muted">
        No players added yet. Add your first player above.
      </li>
    `;
  } else {
    // Add each player to the list
    players.forEach(player => {
      addPlayerToList(player);
    });
  }

  // Update player count
  if (playerCountBadge) {
    playerCountBadge.textContent = players.length;
  }

  console.log(`Player management: Loaded ${players.length} players`);
}

/**
 * Add a player to the display list
 * @param {PlayerModel} player - The player to add
 */
function addPlayerToList(player) {
  if (!playersList) return;

  const playerItem = document.createElement('li');
  playerItem.className = 'list-group-item d-flex justify-content-between align-items-center';
  playerItem.dataset.playerId = player.id;

  // Get song selection for this player if it exists
  const songSelectionResult = playerManagementService.getPlayerSongSelection(player.id);
  const hasSong = songSelectionResult.success;
  const songSelection = hasSong ? songSelectionResult.data : null;

  // Create player item content
  playerItem.innerHTML = `
    <div>
      <h5 class="mb-1">${escapeHtml(player.name)}</h5>
      ${hasSong ?
      `<small class="text-muted">
          <i class="bi bi-music-note-beamed me-1"></i>
          ${escapeHtml(songSelection.trackName)} - ${escapeHtml(songSelection.artistName)}
        </small>` :
      '<small class="text-muted">No song selected</small>'
    }
    </div>
    <div class="btn-group">
      <button class="btn btn-sm btn-outline-success select-music" title="Select Music">
        <i class="bi bi-music-note"></i>
      </button>
      <button class="btn btn-sm btn-outline-primary edit-player" title="Edit Player">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger delete-player" title="Delete Player">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  // Add event listeners for select music, edit and delete buttons
  const selectMusicButton = playerItem.querySelector('.select-music');
  selectMusicButton.addEventListener('click', () => openSongSelectionForPlayer(player));

  const editButton = playerItem.querySelector('.edit-player');
  editButton.addEventListener('click', () => openEditPlayerModal(player));

  const deleteButton = playerItem.querySelector('.delete-player');
  deleteButton.addEventListener('click', () => openDeletePlayerModal(player.id));

  // Add to the list
  playersList.appendChild(playerItem);
}

/**
 * Handle adding a new player
 * @param {Event} event - The form submission event
 */
function handleAddPlayer(event) {
  event.preventDefault();

  if (!playerNameInput) return;

  const playerName = playerNameInput.value.trim();

  if (playerName) {
    // Use the player management service to add the player
    const result = playerManagementService.addPlayer(playerName);

    if (result.success) {
      // Clear the form
      playerNameInput.value = '';

      // Reload the player list
      loadPlayers();

      // Show success message
      showNotification('Player added successfully!', 'success');
    } else {
      // Show error message
      showNotification(`Failed to add player: ${result.error}`, 'danger');
    }
  }
}

/**
 * Open the edit player modal
 * @param {PlayerModel} player - The player to edit
 */
function openEditPlayerModal(player) {
  if (!editPlayerModal || !editPlayerNameInput) return;

  // Set the current player data
  editPlayerId = player.id;
  editPlayerNameInput.value = player.name;

  // Show the modal
  editPlayerModal.show();
}

/**
 * Handle saving edited player
 */
function handleSaveEditPlayer() {
  if (!editPlayerNameInput) return;

  const playerName = editPlayerNameInput.value.trim();

  if (playerName && editPlayerId) {
    // Use the player management service to update the player
    const result = playerManagementService.updatePlayer(editPlayerId, { name: playerName });

    if (result.success) {
      // Hide the modal
      editPlayerModal.hide();

      // Reload the player list
      loadPlayers();

      // Show success message
      showNotification('Player updated successfully!', 'success');
    } else {
      // Show error message
      showNotification(`Failed to update player: ${result.error}`, 'danger');
    }
  }
}

/**
 * Open the delete player confirmation modal
 * @param {string} playerId - The ID of the player to delete
 */
function openDeletePlayerModal(playerId) {
  if (!deleteConfirmModal) return;

  // Set the player ID to delete
  deletePlayerId = playerId;

  // Show the modal
  deleteConfirmModal.show();
}

/**
 * Handle confirming player deletion
 */
function handleConfirmDeletePlayer() {
  if (!deletePlayerId) return;

  // Use the player management service to delete the player
  const result = playerManagementService.deletePlayer(deletePlayerId);

  if (result.success) {
    // Hide the modal
    deleteConfirmModal.hide();

    // Reload the player list
    loadPlayers();

    // Show success message
    showNotification('Player deleted successfully!', 'success');
  } else {
    // Show error message
    showNotification(`Failed to delete player: ${result.error}`, 'danger');
  }

  // Clear the player ID
  deletePlayerId = null;
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
 * Open song selection for a player
 * @param {PlayerModel} player - The player to select music for
 */
async function openSongSelectionForPlayer(player) {
  // Ensure song segmentation is initialized first using the initialization manager
  if (!window.InitializationManager.isSongSegmentationInitialized()) {
    console.log('Player management: Song segmentation not initialized, initializing now...');
    
    const result = await window.InitializationManager.initializeSongSegmentation();
    if (!result.success) {
      console.error('Player management: Failed to initialize song segmentation:', result.error);
      showNotification('Failed to initialize song selection. Please try again.', 'danger');
      return;
    }
  }
  
  try {
    // Import song segmentation component dynamically
    const { setCurrentPlayer } = await import('./song-segmentation.js');
    
    // Set the current player in the song segmentation component
    setCurrentPlayer(player);

    // Navigate to song selection view
    const songSelectionNavLink = document.querySelector('[data-view="song-selection"]');
    if (songSelectionNavLink) {
      songSelectionNavLink.click();
    }
  } catch (error) {
    console.error('Failed to load song segmentation component:', error);
    showNotification('Failed to open song selection. Please try again.', 'danger');
  }
}

/**
 * Handle authentication state changes
 * @param {CustomEvent} event - The authentication state change event
 */
function handleAuthStateChange(event) {
  const { isAuthenticated } = event.detail;
  console.log('Player management: Authentication state changed:', isAuthenticated);
  console.log('Player management: Current DOM elements available:', {
    playersList: !!playersList,
    playerCountBadge: !!playerCountBadge
  });

  if (isAuthenticated) {
    // User is authenticated, refresh the player list
    console.log('Player management: User is authenticated, triggering refresh...');
    refreshPlayerList();
    
    // Note: Song segmentation will be initialized lazily when first needed
    console.log('Player management: Song segmentation will be initialized on demand');
  } else {
    console.log('Player management: User is not authenticated, skipping refresh');
  }
}

/**
 * Handle successful authentication
 * @param {CustomEvent} event - The authentication success event
 */
function handleAuthSuccess(event) {
  console.log('Player management: Authentication successful, refreshing player list');
  // Refresh the player list after successful authentication
  refreshPlayerList();
  
  // Note: Song segmentation will be initialized lazily when first needed
  console.log('Player management: Song segmentation will be initialized on demand');
}

/**
 * Handle authentication token refresh
 * @param {CustomEvent} event - The authentication refresh event
 */
function handleAuthRefresh(event) {
  console.log('Player management: Authentication refreshed, ensuring player list is current');
  // Refresh the player list after token refresh
  refreshPlayerList();
}

/**
 * Handle user logout
 * @param {CustomEvent} event - The logout event
 */
function handleAuthLogout(event) {
  console.log('Player management: User logged out, clearing player list');
  // Clear the player list when user logs out
  if (playersList) {
    playersList.innerHTML = '';
  }
  if (playerCountBadge) {
    playerCountBadge.textContent = '0';
  }
  
  // Note: Initialization manager will handle cleanup on logout automatically
  console.log('Player management: Initialization manager will handle component cleanup');
}

/**
 * Handle navigation to app (authenticated state)
 * @param {CustomEvent} event - The navigation event
 */
function handleNavigatedToApp(event) {
  console.log('Player management: Navigated to app, refreshing player list');
  console.log('Player management: Current DOM elements available:', {
    playersList: !!playersList,
    playerCountBadge: !!playerCountBadge
  });
  // Refresh the player list when navigating to the app
  refreshPlayerList();
  
  // Note: Song segmentation will be initialized lazily when first needed
  console.log('Player management: Song segmentation will be initialized on demand');
}

/**
 * Refresh the player list (wrapper around loadPlayers with additional logging)
 */
function refreshPlayerList() {
  console.log('Player management: Refreshing player list...');

  // Add a small delay to ensure DOM elements are available
  setTimeout(() => {
    // Re-get DOM elements in case they were recreated
    const oldPlayersList = playersList;
    playerNameInput = document.getElementById('player-name');
    addPlayerForm = document.getElementById('add-player-form');
    playersList = document.getElementById('players-list');
    playerCountBadge = document.getElementById('player-count');

    console.log('Player management: DOM elements check:', {
      playerNameInput: !!playerNameInput,
      addPlayerForm: !!addPlayerForm,
      playersList: !!playersList,
      playerCountBadge: !!playerCountBadge,
      playersListChanged: oldPlayersList !== playersList
    });

    // Load and display players
    loadPlayers();

    console.log('Player management: Player list refresh completed');
  }, 100);
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

