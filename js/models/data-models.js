/**
 * Data models and validation for the Spotify Walk-up Music application
 * Implements requirements 6.1, 6.5
 */

import { STORAGE_KEYS, wouldFitInStorage } from '../utils/storage-utils.js';

// Constants for validation
const CONSTANTS = {
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 1,
  MAX_PLAYERS: 30,
  MAX_SEGMENT_DURATION: 60, // Maximum segment duration in seconds
  MIN_SEGMENT_DURATION: 5,  // Minimum segment duration in seconds
};

/**
 * Player model with validation
 */
class PlayerModel {
  /**
   * Create a new player
   * @param {Object} data - Player data
   * @param {string} data.id - Unique identifier
   * @param {string} data.name - Player name
   * @param {number} [data.position] - Position in batting order (optional)
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.position = data.position || null;
  }

  /**
   * Generate a unique ID for a new player
   * @returns {string} - Unique ID
   * @private
   */
  _generateId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate the player data
   * @returns {Object} - Validation result {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    // Validate name
    if (!this.name) {
      errors.push('Player name is required');
    } else if (this.name.length < CONSTANTS.MIN_NAME_LENGTH) {
      errors.push(`Player name must be at least ${CONSTANTS.MIN_NAME_LENGTH} character`);
    } else if (this.name.length > CONSTANTS.MAX_NAME_LENGTH) {
      errors.push(`Player name cannot exceed ${CONSTANTS.MAX_NAME_LENGTH} characters`);
    }

    // Validate position if provided
    if (this.position !== null) {
      if (!Number.isInteger(this.position) || this.position < 0) {
        errors.push('Position must be a non-negative integer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      position: this.position
    };
  }

  /**
   * Create a PlayerModel from a plain object
   * @param {Object} obj - Plain object
   * @returns {PlayerModel} - New PlayerModel instance
   */
  static fromObject(obj) {
    return new PlayerModel(obj);
  }
}

/**
 * Song Selection model with validation
 */
class SongSelectionModel {
  /**
   * Create a new song selection
   * @param {Object} data - Song selection data
   * @param {string} data.playerId - Reference to player
   * @param {string} data.trackId - Spotify track ID
   * @param {string} data.trackName - Song name
   * @param {string} data.artistName - Artist name
   * @param {string} [data.albumArt] - URL to album artwork
   * @param {number} data.startTime - Start time in seconds
   * @param {number} data.endTime - End time in seconds
   * @param {number} [data.duration] - Segment duration in seconds (calculated if not provided)
   */
  constructor(data = {}) {
    this.playerId = data.playerId || '';
    this.trackId = data.trackId || '';
    this.trackName = data.trackName || '';
    this.artistName = data.artistName || '';
    this.albumArt = data.albumArt || '';
    this.startTime = data.startTime || 0;
    this.endTime = data.endTime || 0;
    this.duration = data.duration || (this.endTime - this.startTime);
  }

  /**
   * Validate the song selection data
   * @returns {Object} - Validation result {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    // Validate required fields
    if (!this.playerId) {
      errors.push('Player ID is required');
    }
    
    if (!this.trackId) {
      errors.push('Track ID is required');
    }
    
    if (!this.trackName) {
      errors.push('Track name is required');
    }
    
    if (!this.artistName) {
      errors.push('Artist name is required');
    }

    // Validate time values
    if (typeof this.startTime !== 'number' || this.startTime < 0) {
      errors.push('Start time must be a non-negative number');
    }
    
    if (typeof this.endTime !== 'number' || this.endTime <= 0) {
      errors.push('End time must be a positive number');
    }
    
    if (this.endTime <= this.startTime) {
      errors.push('End time must be greater than start time');
    }

    // Validate segment duration
    const duration = this.endTime - this.startTime;
    if (duration < CONSTANTS.MIN_SEGMENT_DURATION) {
      errors.push(`Segment must be at least ${CONSTANTS.MIN_SEGMENT_DURATION} seconds long`);
    }
    
    if (duration > CONSTANTS.MAX_SEGMENT_DURATION) {
      errors.push(`Segment cannot exceed ${CONSTANTS.MAX_SEGMENT_DURATION} seconds`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      playerId: this.playerId,
      trackId: this.trackId,
      trackName: this.trackName,
      artistName: this.artistName,
      albumArt: this.albumArt,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime - this.startTime
    };
  }

  /**
   * Create a SongSelectionModel from a plain object
   * @param {Object} obj - Plain object
   * @returns {SongSelectionModel} - New SongSelectionModel instance
   */
  static fromObject(obj) {
    return new SongSelectionModel(obj);
  }
}

/**
 * Batting Order model with validation
 */
class BattingOrderModel {
  /**
   * Create a new batting order
   * @param {Object} data - Batting order data
   * @param {string[]} data.order - Array of player IDs in batting order
   */
  constructor(data = {}) {
    this.order = data.order || [];
  }

  /**
   * Validate the batting order data
   * @param {PlayerModel[]} players - Available players for validation
   * @returns {Object} - Validation result {isValid: boolean, errors: string[]}
   */
  validate(players = []) {
    const errors = [];
    const playerIds = players.map(player => player.id);
    
    // Check for duplicate player IDs
    const uniqueIds = new Set(this.order);
    if (uniqueIds.size !== this.order.length) {
      errors.push('Batting order contains duplicate players');
    }
    
    // Check that all players in order exist in the provided players array
    const invalidIds = this.order.filter(id => !playerIds.includes(id));
    if (invalidIds.length > 0) {
      errors.push(`Batting order contains invalid player IDs: ${invalidIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      order: [...this.order]
    };
  }

  /**
   * Create a BattingOrderModel from a plain object
   * @param {Object} obj - Plain object
   * @returns {BattingOrderModel} - New BattingOrderModel instance
   */
  static fromObject(obj) {
    return new BattingOrderModel(obj);
  }
}

/**
 * Application State model
 */
class AppStateModel {
  /**
   * Create a new application state
   * @param {Object} data - Application state data
   * @param {number} [data.currentBatterIndex] - Index of current batter in order
   * @param {boolean} [data.isPlaying] - Whether music is currently playing
   * @param {boolean} [data.gameMode] - Whether game mode is active
   */
  constructor(data = {}) {
    this.currentBatterIndex = data.currentBatterIndex !== undefined ? data.currentBatterIndex : 0;
    this.isPlaying = data.isPlaying !== undefined ? data.isPlaying : false;
    this.gameMode = data.gameMode !== undefined ? data.gameMode : false;
  }

  /**
   * Validate the application state data
   * @returns {Object} - Validation result {isValid: boolean, errors: string[]}
   */
  validate() {
    const errors = [];

    // Validate currentBatterIndex
    if (!Number.isInteger(this.currentBatterIndex) || this.currentBatterIndex < 0) {
      errors.push('Current batter index must be a non-negative integer');
    }

    // Validate boolean fields
    if (typeof this.isPlaying !== 'boolean') {
      errors.push('isPlaying must be a boolean value');
    }
    
    if (typeof this.gameMode !== 'boolean') {
      errors.push('gameMode must be a boolean value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to a plain object for storage
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      currentBatterIndex: this.currentBatterIndex,
      isPlaying: this.isPlaying,
      gameMode: this.gameMode
    };
  }

  /**
   * Create an AppStateModel from a plain object
   * @param {Object} obj - Plain object
   * @returns {AppStateModel} - New AppStateModel instance
   */
  static fromObject(obj) {
    return new AppStateModel(obj);
  }
}

/**
 * Data manager for handling models and storage
 */
class DataManager {
  /**
   * Get all players
   * @returns {PlayerModel[]} - Array of player models
   */
  static getPlayers() {
    const playersData = this._getDataFromStorage(STORAGE_KEYS.PLAYERS, []);
    const playerModels = playersData.map(playerData => PlayerModel.fromObject(playerData));
    console.log('DataManager: Loaded', playerModels.length, 'players from storage');
    return playerModels;
  }

  /**
   * Save a player
   * @param {PlayerModel} player - Player to save
   * @returns {Object} - Result {success: boolean, error: string}
   */
  static savePlayer(player) {
    // Validate player
    const validation = player.validate();
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Get existing players
    const players = this.getPlayers();
    
    // Check if we're updating an existing player or adding a new one
    const existingIndex = players.findIndex(p => p.id === player.id);
    
    if (existingIndex >= 0) {
      // Update existing player
      players[existingIndex] = player;
    } else {
      // Check if we've reached the maximum number of players
      if (players.length >= CONSTANTS.MAX_PLAYERS) {
        return {
          success: false,
          error: `Cannot add more than ${CONSTANTS.MAX_PLAYERS} players`
        };
      }
      
      // Add new player
      players.push(player);
    }

    // Convert to plain objects for storage
    const playersData = players.map(p => p.toObject());
    
    // Check if data will fit in storage
    if (!wouldFitInStorage(STORAGE_KEYS.PLAYERS, playersData)) {
      return {
        success: false,
        error: 'Storage limit exceeded. Try removing some players or songs.'
      };
    }

    // Save to storage
    return this._saveDataToStorage(STORAGE_KEYS.PLAYERS, playersData);
  }

  /**
   * Delete a player
   * @param {string} playerId - ID of player to delete
   * @returns {Object} - Result {success: boolean, error: string}
   */
  static deletePlayer(playerId) {
    // Get existing players
    const players = this.getPlayers();
    
    // Filter out the player to delete
    const filteredPlayers = players.filter(p => p.id !== playerId);
    
    // If no players were removed, the ID was invalid
    if (filteredPlayers.length === players.length) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    // Convert to plain objects for storage
    const playersData = filteredPlayers.map(p => p.toObject());
    
    // Save to storage
    const result = this._saveDataToStorage(STORAGE_KEYS.PLAYERS, playersData);
    
    // If successful, also delete any song selections for this player
    if (result.success) {
      this._deleteSongSelectionsForPlayer(playerId);
      this._removePlayerFromBattingOrder(playerId);
    }
    
    return result;
  }

  /**
   * Get all song selections
   * @returns {SongSelectionModel[]} - Array of song selection models
   */
  static getSongSelections() {
    const selectionsData = this._getDataFromStorage(STORAGE_KEYS.SONG_SELECTIONS, []);
    return selectionsData.map(data => SongSelectionModel.fromObject(data));
  }

  /**
   * Get song selection for a player
   * @param {string} playerId - Player ID
   * @returns {SongSelectionModel|null} - Song selection model or null if not found
   */
  static getSongSelectionForPlayer(playerId) {
    const selections = this.getSongSelections();
    const selection = selections.find(s => s.playerId === playerId);
    return selection || null;
  }

  /**
   * Save a song selection
   * @param {SongSelectionModel} songSelection - Song selection to save
   * @returns {Object} - Result {success: boolean, error: string}
   */
  static saveSongSelection(songSelection) {
    // Validate song selection
    const validation = songSelection.validate();
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Get existing song selections
    const selections = this.getSongSelections();
    
    // Check if we're updating an existing selection or adding a new one
    const existingIndex = selections.findIndex(s => s.playerId === songSelection.playerId);
    
    if (existingIndex >= 0) {
      // Update existing selection
      selections[existingIndex] = songSelection;
    } else {
      // Add new selection
      selections.push(songSelection);
    }

    // Convert to plain objects for storage
    const selectionsData = selections.map(s => s.toObject());
    
    // Check if data will fit in storage
    if (!wouldFitInStorage(STORAGE_KEYS.SONG_SELECTIONS, selectionsData)) {
      return {
        success: false,
        error: 'Storage limit exceeded. Try removing some songs or players.'
      };
    }

    // Save to storage
    return this._saveDataToStorage(STORAGE_KEYS.SONG_SELECTIONS, selectionsData);
  }

  /**
   * Delete song selections for a player
   * @param {string} playerId - Player ID
   * @returns {Object} - Result {success: boolean, error: string}
   * @private
   */
  static _deleteSongSelectionsForPlayer(playerId) {
    // Get existing song selections
    const selections = this.getSongSelections();
    
    // Filter out selections for the specified player
    const filteredSelections = selections.filter(s => s.playerId !== playerId);
    
    // Convert to plain objects for storage
    const selectionsData = filteredSelections.map(s => s.toObject());
    
    // Save to storage
    return this._saveDataToStorage(STORAGE_KEYS.SONG_SELECTIONS, selectionsData);
  }

  /**
   * Get the batting order
   * @returns {BattingOrderModel} - Batting order model
   */
  static getBattingOrder() {
    const orderData = this._getDataFromStorage(STORAGE_KEYS.BATTING_ORDER, { order: [] });
    return BattingOrderModel.fromObject(orderData);
  }

  /**
   * Save the batting order
   * @param {BattingOrderModel} battingOrder - Batting order to save
   * @returns {Object} - Result {success: boolean, error: string}
   */
  static saveBattingOrder(battingOrder) {
    // Validate batting order against existing players
    const players = this.getPlayers();
    const validation = battingOrder.validate(players);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Convert to plain object for storage
    const orderData = battingOrder.toObject();
    
    // Check if data will fit in storage
    if (!wouldFitInStorage(STORAGE_KEYS.BATTING_ORDER, orderData)) {
      return {
        success: false,
        error: 'Storage limit exceeded.'
      };
    }

    // Save to storage
    return this._saveDataToStorage(STORAGE_KEYS.BATTING_ORDER, orderData);
  }

  /**
   * Remove a player from the batting order
   * @param {string} playerId - Player ID to remove
   * @returns {Object} - Result {success: boolean, error: string}
   * @private
   */
  static _removePlayerFromBattingOrder(playerId) {
    // Get current batting order
    const battingOrder = this.getBattingOrder();
    
    // Remove player from order
    battingOrder.order = battingOrder.order.filter(id => id !== playerId);
    
    // Save updated order
    return this.saveBattingOrder(battingOrder);
  }

  /**
   * Get the application state
   * @returns {AppStateModel} - Application state model
   */
  static getAppState() {
    const stateData = this._getDataFromStorage(STORAGE_KEYS.APP_STATE, {});
    return AppStateModel.fromObject(stateData);
  }

  /**
   * Save the application state
   * @param {AppStateModel} appState - Application state to save
   * @returns {Object} - Result {success: boolean, error: string}
   */
  static saveAppState(appState) {
    // Validate app state
    const validation = appState.validate();
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Convert to plain object for storage
    const stateData = appState.toObject();
    
    // Check if data will fit in storage
    if (!wouldFitInStorage(STORAGE_KEYS.APP_STATE, stateData)) {
      return {
        success: false,
        error: 'Storage limit exceeded.'
      };
    }

    // Save to storage
    return this._saveDataToStorage(STORAGE_KEYS.APP_STATE, stateData);
  }

  /**
   * Helper method to get data from storage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} - Retrieved data or default value
   * @private
   */
  static _getDataFromStorage(key, defaultValue) {
    try {
      const serializedData = localStorage.getItem(key);
      
      if (serializedData === null) {
        console.log(`DataManager: No data found for key ${key}, using default`);
        return defaultValue;
      }
      
      const parsedData = JSON.parse(serializedData);
      return parsedData;
    } catch (error) {
      console.error(`Error retrieving ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Helper method to save data to storage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {Object} - Result {success: boolean, error: string}
   * @private
   */
  static _saveDataToStorage(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return {
        success: true,
        error: null
      };
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      
      // Handle storage quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: 'Storage limit exceeded. Try removing some data.'
        };
      }
      
      return {
        success: false,
        error: 'Failed to save data to storage.'
      };
    }
  }
}

export {
  CONSTANTS,
  PlayerModel,
  SongSelectionModel,
  BattingOrderModel,
  AppStateModel,
  DataManager
};