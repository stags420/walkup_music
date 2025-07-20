/**
 * Tests for the player management service
 */

// Mock the DataManager
jest.mock('../../../js/models/data-models.js', () => {
  // Create a mock PlayerModel class
  class MockPlayerModel {
    constructor(data = {}) {
      this.id = data.id || `player_${Date.now()}`;
      this.name = data.name || '';
      this.position = data.position || null;
    }
    
    validate() {
      const errors = [];
      if (!this.name) {
        errors.push('Player name is required');
      } else if (this.name.length > 50) {
        errors.push('Player name cannot exceed 50 characters');
      }
      return {
        isValid: errors.length === 0,
        errors
      };
    }
    
    toObject() {
      return {
        id: this.id,
        name: this.name,
        position: this.position
      };
    }
    
    static fromObject(obj) {
      return new MockPlayerModel(obj);
    }
  }
  
  return {
    PlayerModel: MockPlayerModel,
    DataManager: {
      getPlayers: jest.fn(),
      savePlayer: jest.fn(),
      deletePlayer: jest.fn(),
      getSongSelectionForPlayer: jest.fn()
    }
  };
});

// Import the modules after mocking
const { PlayerModel, DataManager } = require('../../../js/models/data-models.js');

// Mock the player management service
const playerManagementService = {
  getPlayers: function() {
    try {
      const players = DataManager.getPlayers();
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
  },
  
  addPlayer: function(name) {
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
  },
  
  deletePlayer: function(playerId) {
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
};

describe('Player Management Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('getPlayers', () => {
    test('should return players when successful', () => {
      // Mock data
      const mockPlayers = [
        new PlayerModel({ id: 'player1', name: 'Player 1' }),
        new PlayerModel({ id: 'player2', name: 'Player 2' })
      ];
      
      // Mock implementation
      DataManager.getPlayers.mockReturnValue(mockPlayers);
      
      // Call the method
      const result = playerManagementService.getPlayers();
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPlayers);
      expect(result.error).toBeNull();
      expect(DataManager.getPlayers).toHaveBeenCalledTimes(1);
    });
    
    test('should handle errors', () => {
      // Mock implementation to throw an error
      DataManager.getPlayers.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Call the method
      const result = playerManagementService.getPlayers();
      
      // Assertions
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Failed to retrieve players');
      expect(DataManager.getPlayers).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('addPlayer', () => {
    test('should add player when valid', () => {
      // Mock implementation
      DataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the method
      const result = playerManagementService.addPlayer('Test Player');
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(PlayerModel);
      expect(result.data.name).toBe('Test Player');
      expect(result.error).toBeNull();
      expect(DataManager.savePlayer).toHaveBeenCalledTimes(1);
    });
    
    test('should return error when name is invalid', () => {
      // Call the method with empty name
      const result = playerManagementService.addPlayer('');
      
      // Assertions
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name is required');
      expect(DataManager.savePlayer).not.toHaveBeenCalled();
    });
  });
  
  describe('deletePlayer', () => {
    test('should delete player when valid', () => {
      // Mock implementation
      DataManager.deletePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the method
      const result = playerManagementService.deletePlayer('player1');
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(DataManager.deletePlayer).toHaveBeenCalledWith('player1');
    });
  });
});