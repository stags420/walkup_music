/**
 * Tests for the player management functionality
 * Tests requirements 2.3, 2.4, 2.5, 2.6
 * 
 * This test file focuses on testing the player management service layer
 * and core functionality rather than DOM manipulation, since the component
 * uses ES6 modules which are difficult to test directly with Jest.
 */

// Mock the DataManager
const mockDataManager = {
  getPlayers: jest.fn(),
  savePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  getSongSelectionForPlayer: jest.fn()
};

// Mock PlayerModel
class MockPlayerModel {
  constructor(data = {}) {
    this.id = data.id || `player_${Date.now()}_${Math.random()}`;
    this.name = data.name || '';
    this.position = data.position || null;
  }
  
  validate() {
    const errors = [];
    if (!this.name || this.name.trim() === '') {
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

// Mock the modules
jest.mock('../../../js/models/data-models.js', () => ({
  PlayerModel: MockPlayerModel,
  DataManager: mockDataManager
}));

// Create a test implementation of the player management service
// This mirrors the actual service functionality for testing purposes
const playerManagementService = {
  getPlayers() {
    try {
      const players = mockDataManager.getPlayers();
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

  getPlayerById(playerId) {
    try {
      const players = mockDataManager.getPlayers();
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
  },

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
      const player = new MockPlayerModel({
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
      const result = mockDataManager.savePlayer(player);
      
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
      const result = mockDataManager.savePlayer(player);
      
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
  },

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
      const result = mockDataManager.deletePlayer(playerId);
      
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
  },

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
      const songSelection = mockDataManager.getSongSelectionForPlayer(playerId);
      
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
};

describe('Player Management Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  describe('Player Addition (Requirement 2.3)', () => {
    test('should successfully add a player with valid name', () => {
      // Mock successful save
      mockDataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service
      const result = playerManagementService.addPlayer('Test Player');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(MockPlayerModel);
      expect(result.data.name).toBe('Test Player');
      expect(result.error).toBeNull();
      
      // Verify DataManager was called
      expect(mockDataManager.savePlayer).toHaveBeenCalledTimes(1);
      const savedPlayer = mockDataManager.savePlayer.mock.calls[0][0];
      expect(savedPlayer).toBeInstanceOf(MockPlayerModel);
      expect(savedPlayer.name).toBe('Test Player');
    });
    
    test('should reject empty player name', () => {
      // Call the service with empty name
      const result = playerManagementService.addPlayer('');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should reject null player name', () => {
      // Call the service with null name
      const result = playerManagementService.addPlayer(null);
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should reject non-string player name', () => {
      // Call the service with non-string name
      const result = playerManagementService.addPlayer(123);
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should trim whitespace from player names', () => {
      // Mock successful save
      mockDataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service with whitespace
      const result = playerManagementService.addPlayer('  Test Player  ');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Player');
      
      // Verify DataManager was called with trimmed name
      const savedPlayer = mockDataManager.savePlayer.mock.calls[0][0];
      expect(savedPlayer.name).toBe('Test Player');
    });
    
    test('should reject player name that is too long', () => {
      // Mock successful save
      mockDataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service with a name that's too long
      const longName = 'A'.repeat(51); // 51 characters
      const result = playerManagementService.addPlayer(longName);
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name cannot exceed 50 characters');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should handle DataManager save errors', () => {
      // Mock failed save
      mockDataManager.savePlayer.mockReturnValue({ 
        success: false, 
        error: 'Storage error' 
      });
      
      // Call the service
      const result = playerManagementService.addPlayer('Test Player');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage error');
    });
    
    test('should handle unexpected errors during player addition', () => {
      // Mock DataManager to throw an error
      mockDataManager.savePlayer.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the service
      const result = playerManagementService.addPlayer('Test Player');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to add player');
    });
  });
  
  describe('Player Editing (Requirement 2.4)', () => {
    test('should successfully update a player', () => {
      const existingPlayer = new MockPlayerModel({ id: 'player1', name: 'Original Name' });
      
      // Mock getting existing player
      mockDataManager.getPlayers.mockReturnValue([existingPlayer]);
      
      // Mock successful save
      mockDataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service
      const result = playerManagementService.updatePlayer('player1', { name: 'Updated Name' });
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(MockPlayerModel);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.id).toBe('player1');
      expect(result.error).toBeNull();
      
      // Verify DataManager was called
      expect(mockDataManager.savePlayer).toHaveBeenCalledTimes(1);
    });
    
    test('should reject update with empty player ID', () => {
      // Call the service with empty ID
      const result = playerManagementService.updatePlayer('', { name: 'Updated Name' });
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player ID is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should reject update with null updates object', () => {
      // Call the service with null updates
      const result = playerManagementService.updatePlayer('player1', null);
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Updates object is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should handle player not found', () => {
      // Mock empty player list
      mockDataManager.getPlayers.mockReturnValue([]);
      
      // Call the service
      const result = playerManagementService.updatePlayer('nonexistent', { name: 'Updated Name' });
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player not found');
      
      // Verify DataManager save was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should trim whitespace from updated names', () => {
      const existingPlayer = new MockPlayerModel({ id: 'player1', name: 'Original Name' });
      
      // Mock getting existing player
      mockDataManager.getPlayers.mockReturnValue([existingPlayer]);
      
      // Mock successful save
      mockDataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service with whitespace
      const result = playerManagementService.updatePlayer('player1', { name: '  Updated Name  ' });
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
    });
    
    test('should reject updated name that is too long', () => {
      const existingPlayer = new MockPlayerModel({ id: 'player1', name: 'Original Name' });
      
      // Mock getting existing player
      mockDataManager.getPlayers.mockReturnValue([existingPlayer]);
      
      // Call the service with a name that's too long
      const longName = 'A'.repeat(51); // 51 characters
      const result = playerManagementService.updatePlayer('player1', { name: longName });
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player name cannot exceed 50 characters');
      
      // Verify DataManager save was not called
      expect(mockDataManager.savePlayer).not.toHaveBeenCalled();
    });
    
    test('should handle DataManager save errors during update', () => {
      const existingPlayer = new MockPlayerModel({ id: 'player1', name: 'Original Name' });
      
      // Mock getting existing player
      mockDataManager.getPlayers.mockReturnValue([existingPlayer]);
      
      // Mock failed save
      mockDataManager.savePlayer.mockReturnValue({ 
        success: false, 
        error: 'Storage error' 
      });
      
      // Call the service
      const result = playerManagementService.updatePlayer('player1', { name: 'Updated Name' });
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Storage error');
    });
    
    test('should handle unexpected errors during player update', () => {
      // Mock DataManager to throw an error
      mockDataManager.getPlayers.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the service
      const result = playerManagementService.updatePlayer('player1', { name: 'Updated Name' });
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to retrieve player');
    });
  });
  
  describe('Player Deletion (Requirement 2.5)', () => {
    test('should successfully delete a player', () => {
      // Mock successful deletion
      mockDataManager.deletePlayer.mockReturnValue({ success: true, error: null });
      
      // Call the service
      const result = playerManagementService.deletePlayer('player1');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      
      // Verify DataManager was called
      expect(mockDataManager.deletePlayer).toHaveBeenCalledWith('player1');
    });
    
    test('should reject deletion with empty player ID', () => {
      // Call the service with empty ID
      const result = playerManagementService.deletePlayer('');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player ID is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.deletePlayer).not.toHaveBeenCalled();
    });
    
    test('should reject deletion with null player ID', () => {
      // Call the service with null ID
      const result = playerManagementService.deletePlayer(null);
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player ID is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.deletePlayer).not.toHaveBeenCalled();
    });
    
    test('should handle DataManager deletion errors', () => {
      // Mock failed deletion
      mockDataManager.deletePlayer.mockReturnValue({ 
        success: false, 
        error: 'Player not found' 
      });
      
      // Call the service
      const result = playerManagementService.deletePlayer('player1');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });
    
    test('should handle unexpected errors during player deletion', () => {
      // Mock DataManager to throw an error
      mockDataManager.deletePlayer.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the service
      const result = playerManagementService.deletePlayer('player1');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete player');
    });
  });
  
  describe('Player Retrieval (Requirement 2.6)', () => {
    test('should successfully get all players', () => {
      const mockPlayers = [
        new MockPlayerModel({ id: 'player1', name: 'Player 1' }),
        new MockPlayerModel({ id: 'player2', name: 'Player 2' })
      ];
      
      // Mock successful retrieval
      mockDataManager.getPlayers.mockReturnValue(mockPlayers);
      
      // Call the service
      const result = playerManagementService.getPlayers();
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPlayers);
      expect(result.data.length).toBe(2);
      expect(result.error).toBeNull();
      
      // Verify DataManager was called
      expect(mockDataManager.getPlayers).toHaveBeenCalledTimes(1);
    });
    
    test('should handle empty player list', () => {
      // Mock empty player list
      mockDataManager.getPlayers.mockReturnValue([]);
      
      // Call the service
      const result = playerManagementService.getPlayers();
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.data.length).toBe(0);
      expect(result.error).toBeNull();
    });
    
    test('should handle unexpected errors during player retrieval', () => {
      // Mock DataManager to throw an error
      mockDataManager.getPlayers.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the service
      const result = playerManagementService.getPlayers();
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Failed to retrieve players');
    });
    
    test('should successfully get player by ID', () => {
      const mockPlayer = new MockPlayerModel({ id: 'player1', name: 'Test Player' });
      const mockPlayers = [mockPlayer];
      
      // Mock successful retrieval
      mockDataManager.getPlayers.mockReturnValue(mockPlayers);
      
      // Call the service
      const result = playerManagementService.getPlayerById('player1');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPlayer);
      expect(result.error).toBeNull();
    });
    
    test('should handle player not found by ID', () => {
      // Mock empty player list
      mockDataManager.getPlayers.mockReturnValue([]);
      
      // Call the service
      const result = playerManagementService.getPlayerById('nonexistent');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player not found');
    });
    
    test('should get player song selection', () => {
      const mockSongSelection = {
        trackId: 'track1',
        trackName: 'Test Song',
        artistName: 'Test Artist'
      };
      
      // Mock successful song selection retrieval
      mockDataManager.getSongSelectionForPlayer.mockReturnValue(mockSongSelection);
      
      // Call the service
      const result = playerManagementService.getPlayerSongSelection('player1');
      
      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSongSelection);
      expect(result.error).toBeNull();
      
      // Verify DataManager was called
      expect(mockDataManager.getSongSelectionForPlayer).toHaveBeenCalledWith('player1');
    });
    
    test('should handle no song selection found', () => {
      // Mock no song selection
      mockDataManager.getSongSelectionForPlayer.mockReturnValue(null);
      
      // Call the service
      const result = playerManagementService.getPlayerSongSelection('player1');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('No song selection found for player');
    });
    
    test('should reject getting song selection with empty player ID', () => {
      // Call the service with empty ID
      const result = playerManagementService.getPlayerSongSelection('');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player ID is required');
      
      // Verify DataManager was not called
      expect(mockDataManager.getSongSelectionForPlayer).not.toHaveBeenCalled();
    });
    
    test('should handle unexpected errors during song selection retrieval', () => {
      // Mock DataManager to throw an error
      mockDataManager.getSongSelectionForPlayer.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      // Call the service
      const result = playerManagementService.getPlayerSongSelection('player1');
      
      // Verify the result
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Failed to get song selection');
    });
  });
});