/**
 * Player Management Service
 * Implements requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * 
 * This service provides the core functionality for managing players,
 * including adding, editing, and deleting players, and integrating
 * with the storage component.
 */

import { PlayerModel, DataManager } from '../models/data-models.js';

/**
 * Player Management Service
 */
class PlayerManagementService {
  /**
   * Get all players
   * @returns {Object} - Result {success: boolean, data: PlayerModel[], error: string}
   */
  getPlayers() {
    try {
      const players = DataManager.getPlayers();
      console.log('PlayerManagementService: Retrieved', players.length, 'players');
      
      return {
        success: true,
        data: players,
        error: null
      };
    } catch (error) {
      console.error('Error getting players:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to retrieve players'
      };
    }
  }

  /**
   * Get a player by ID
   * @param {string} playerId - The ID of the player to get
   * @returns {Object} - Result {success: boolean, data: PlayerModel, error: string}
   */
  getPlayerById(playerId) {
    try {
      const players = DataManager.getPlayers();
      const player = players.find(p => p.id === playerId);
      
      if (!player) {
        return {
          success: false,
          data: null,
          error: 'Player not found'
        };
      }
      
      return {
        success: true,
        data: player,
        error: null
      };
    } catch (error) {
      console.error('Error getting player by ID:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to retrieve player'
      };
    }
  }

  /**
   * Add a new player
   * @param {string} name - The name of the player to add
   * @returns {Object} - Result {success: boolean, data: PlayerModel, error: string}
   */
  addPlayer(name) {
    try {
      // Validate input
      if (!name || typeof name !== 'string') {
        return {
          success: false,
          data: null,
          error: 'Player name is required'
        };
      }
      
      // Create a new player model
      const player = new PlayerModel({
        name: name.trim()
      });
      
      // Validate the player
      const validation = player.validate();
      if (!validation.isValid) {
        return {
          success: false,
          data: null,
          error: validation.errors.join(', ')
        };
      }
      
      // Save the player
      const result = DataManager.savePlayer(player);
      
      if (!result.success) {
        return {
          success: false,
          data: null,
          error: result.error
        };
      }
      
      return {
        success: true,
        data: player,
        error: null
      };
    } catch (error) {
      console.error('Error adding player:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to add player'
      };
    }
  }

  /**
   * Update an existing player
   * @param {string} playerId - The ID of the player to update
   * @param {Object} updates - The updates to apply to the player
   * @param {string} [updates.name] - The new name for the player
   * @returns {Object} - Result {success: boolean, data: PlayerModel, error: string}
   */
  updatePlayer(playerId, updates) {
    try {
      // Validate input
      if (!playerId) {
        return {
          success: false,
          data: null,
          error: 'Player ID is required'
        };
      }
      
      if (!updates || typeof updates !== 'object') {
        return {
          success: false,
          data: null,
          error: 'Updates object is required'
        };
      }
      
      // Get the existing player
      const playerResult = this.getPlayerById(playerId);
      
      if (!playerResult.success) {
        return playerResult;
      }
      
      const player = playerResult.data;
      
      // Apply updates
      if (updates.name !== undefined) {
        player.name = updates.name.trim();
      }
      
      // Validate the updated player
      const validation = player.validate();
      if (!validation.isValid) {
        return {
          success: false,
          data: null,
          error: validation.errors.join(', ')
        };
      }
      
      // Save the updated player
      const result = DataManager.savePlayer(player);
      
      if (!result.success) {
        return {
          success: false,
          data: null,
          error: result.error
        };
      }
      
      return {
        success: true,
        data: player,
        error: null
      };
    } catch (error) {
      console.error('Error updating player:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to update player'
      };
    }
  }

  /**
   * Delete a player
   * @param {string} playerId - The ID of the player to delete
   * @returns {Object} - Result {success: boolean, error: string}
   */
  deletePlayer(playerId) {
    try {
      // Validate input
      if (!playerId) {
        return {
          success: false,
          error: 'Player ID is required'
        };
      }
      
      // Delete the player
      const result = DataManager.deletePlayer(playerId);
      
      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      console.error('Error deleting player:', error);
      return {
        success: false,
        error: 'Failed to delete player'
      };
    }
  }

  /**
   * Get song selection for a player
   * @param {string} playerId - The ID of the player
   * @returns {Object} - Result {success: boolean, data: SongSelectionModel, error: string}
   */
  getPlayerSongSelection(playerId) {
    try {
      // Validate input
      if (!playerId) {
        return {
          success: false,
          data: null,
          error: 'Player ID is required'
        };
      }
      
      // Get the song selection
      const songSelection = DataManager.getSongSelectionForPlayer(playerId);
      
      if (!songSelection) {
        return {
          success: false,
          data: null,
          error: 'No song selection found for player'
        };
      }
      
      return {
        success: true,
        data: songSelection,
        error: null
      };
    } catch (error) {
      console.error('Error getting player song selection:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to get song selection'
      };
    }
  }
}

// Create and export a singleton instance
const playerManagementService = new PlayerManagementService();
export default playerManagementService;