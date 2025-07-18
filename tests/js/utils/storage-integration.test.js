/**
 * Integration tests for storage component
 * Tests the integration between storage utilities and data models
 * Implements task 3.3: Test storage component
 */

// Mock the storage-utils module
jest.mock('../../../js/utils/storage-utils', () => {
  // Create the exported functions
  const STORAGE_KEYS = {
    PLAYERS: 'walkup_players',
    BATTING_ORDER: 'walkup_batting_order',
    SONG_SELECTIONS: 'walkup_song_selections',
    APP_STATE: 'walkup_app_state'
  };

  const saveData = jest.fn((key, data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving data to local storage:', error);
      return false;
    }
  });

  const getData = jest.fn((key, defaultValue = null) => {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error retrieving data from local storage:', error);
      return defaultValue;
    }
  });

  const clearData = jest.fn((key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing data from local storage:', error);
      return false;
    }
  });

  const clearAllData = jest.fn(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data from local storage:', error);
      return false;
    }
  });

  const isStorageAvailable = jest.fn(() => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  });

  const getStorageSize = jest.fn((key) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      return data.length * 2;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  });

  // Mock wouldFitInStorage with a configurable return value
  let wouldFitInStorageReturnValue = true;
  const wouldFitInStorage = jest.fn((key, data) => {
    return wouldFitInStorageReturnValue;
  });

  // Expose a function to set the mock return value
  const setWouldFitInStorageReturnValue = (value) => {
    wouldFitInStorageReturnValue = value;
  };

  return {
    STORAGE_KEYS,
    saveData,
    getData,
    clearData,
    clearAllData,
    isStorageAvailable,
    getStorageSize,
    wouldFitInStorage,
    // For testing only
    setWouldFitInStorageReturnValue
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    // For simulating storage errors
    throwOnNextSetItem: false,
    throwQuotaExceededOnNextSetItem: false
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Import the modules
const storageUtils = require('../../../js/utils/storage-utils');
const {
  CONSTANTS,
  PlayerModel,
  SongSelectionModel,
  BattingOrderModel,
  AppStateModel,
  DataManager
} = require('../../../js/models/data-models');

describe('Storage Component Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.throwOnNextSetItem = false;
    localStorageMock.throwQuotaExceededOnNextSetItem = false;
    storageUtils.setWouldFitInStorageReturnValue(true);
  });

  // Test data saving and retrieval (Requirement 6.1, 6.2)
  describe('Data Saving and Retrieval', () => {
    test('should save and retrieve player data correctly', () => {
      // Create test players
      const player1 = new PlayerModel({ name: 'Player 1' });
      const player2 = new PlayerModel({ name: 'Player 2' });
      
      // Save players
      const saveResult1 = DataManager.savePlayer(player1);
      const saveResult2 = DataManager.savePlayer(player2);
      
      // Verify save was successful
      expect(saveResult1.success).toBe(true);
      expect(saveResult2.success).toBe(true);
      
      // Retrieve players
      const retrievedPlayers = DataManager.getPlayers();
      
      // Verify retrieved data
      expect(retrievedPlayers).toHaveLength(2);
      expect(retrievedPlayers[0].name).toBe('Player 1');
      expect(retrievedPlayers[1].name).toBe('Player 2');
    });

    test('should save and retrieve song selection data correctly', () => {
      // Create a player first
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create song selection
      const songSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      // Save song selection
      const saveResult = DataManager.saveSongSelection(songSelection);
      
      // Verify save was successful
      expect(saveResult.success).toBe(true);
      
      // Retrieve song selection
      const retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      
      // Verify retrieved data
      expect(retrievedSelection).not.toBeNull();
      expect(retrievedSelection.trackId).toBe('track_1');
      expect(retrievedSelection.trackName).toBe('Test Song');
      expect(retrievedSelection.startTime).toBe(10);
      expect(retrievedSelection.endTime).toBe(40);
    });

    test('should save and retrieve batting order data correctly', () => {
      // Create test players
      const player1 = new PlayerModel({ name: 'Player 1' });
      const player2 = new PlayerModel({ name: 'Player 2' });
      
      // Save players
      DataManager.savePlayer(player1);
      DataManager.savePlayer(player2);
      
      // Create batting order
      const battingOrder = new BattingOrderModel({
        order: [player1.id, player2.id]
      });
      
      // Save batting order
      const saveResult = DataManager.saveBattingOrder(battingOrder);
      
      // Verify save was successful
      expect(saveResult.success).toBe(true);
      
      // Retrieve batting order
      const retrievedOrder = DataManager.getBattingOrder();
      
      // Verify retrieved data
      expect(retrievedOrder.order).toHaveLength(2);
      expect(retrievedOrder.order[0]).toBe(player1.id);
      expect(retrievedOrder.order[1]).toBe(player2.id);
    });

    test('should save and retrieve app state data correctly', () => {
      // Create app state
      const appState = new AppStateModel({
        currentBatterIndex: 1,
        isPlaying: true,
        gameMode: true
      });
      
      // Save app state
      const saveResult = DataManager.saveAppState(appState);
      
      // Verify save was successful
      expect(saveResult.success).toBe(true);
      
      // Retrieve app state
      const retrievedState = DataManager.getAppState();
      
      // Verify retrieved data
      expect(retrievedState.currentBatterIndex).toBe(1);
      expect(retrievedState.isPlaying).toBe(true);
      expect(retrievedState.gameMode).toBe(true);
    });

    test('should restore previous session state from local storage (Requirement 6.3)', () => {
      // Set up initial data
      const player1 = new PlayerModel({ name: 'Player 1' });
      const player2 = new PlayerModel({ name: 'Player 2' });
      
      DataManager.savePlayer(player1);
      DataManager.savePlayer(player2);
      
      const songSelection = new SongSelectionModel({
        playerId: player1.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      DataManager.saveSongSelection(songSelection);
      
      const battingOrder = new BattingOrderModel({
        order: [player1.id, player2.id]
      });
      
      DataManager.saveBattingOrder(battingOrder);
      
      const appState = new AppStateModel({
        currentBatterIndex: 1,
        isPlaying: true,
        gameMode: true
      });
      
      DataManager.saveAppState(appState);
      
      // Simulate application restart by clearing all mocks but keeping localStorage data
      jest.clearAllMocks();
      
      // Retrieve data after "restart"
      const retrievedPlayers = DataManager.getPlayers();
      const retrievedSelection = DataManager.getSongSelectionForPlayer(player1.id);
      const retrievedOrder = DataManager.getBattingOrder();
      const retrievedState = DataManager.getAppState();
      
      // Verify all data was restored correctly
      expect(retrievedPlayers).toHaveLength(2);
      expect(retrievedSelection).not.toBeNull();
      expect(retrievedSelection.trackId).toBe('track_1');
      expect(retrievedOrder.order).toHaveLength(2);
      expect(retrievedState.currentBatterIndex).toBe(1);
      expect(retrievedState.isPlaying).toBe(true);
    });

    test('should handle clearing specific data (Requirement 6.4)', () => {
      // Set up initial data
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      const songSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      DataManager.saveSongSelection(songSelection);
      
      // Clear specific data
      const clearResult = storageUtils.clearData(storageUtils.STORAGE_KEYS.SONG_SELECTIONS);
      
      // Verify clear was successful
      expect(clearResult).toBe(true);
      
      // Verify only song selections were cleared
      const retrievedPlayers = DataManager.getPlayers();
      const retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      
      expect(retrievedPlayers).toHaveLength(1);
      expect(retrievedSelection).toBeNull();
    });

    test('should handle clearing all data (Requirement 6.4)', () => {
      // Set up initial data
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      const songSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      DataManager.saveSongSelection(songSelection);
      
      // Clear all data
      const clearResult = storageUtils.clearAllData();
      
      // Verify clear was successful
      expect(clearResult).toBe(true);
      
      // Verify all data was cleared
      const retrievedPlayers = DataManager.getPlayers();
      const retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      const retrievedOrder = DataManager.getBattingOrder();
      const retrievedState = DataManager.getAppState();
      
      expect(retrievedPlayers).toHaveLength(0);
      expect(retrievedSelection).toBeNull();
      expect(retrievedOrder.order).toHaveLength(0);
      expect(retrievedState.currentBatterIndex).toBe(0);
      expect(retrievedState.isPlaying).toBe(false);
      expect(retrievedState.gameMode).toBe(false);
    });
  });

  // Test data validation
  describe('Data Validation', () => {
    test('should reject invalid player data', () => {
      // Create invalid player (no name)
      const invalidPlayer = new PlayerModel({});
      
      // Try to save invalid player
      const saveResult = DataManager.savePlayer(invalidPlayer);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Player name is required');
      
      // Verify no data was saved
      const retrievedPlayers = DataManager.getPlayers();
      expect(retrievedPlayers).toHaveLength(0);
    });

    test('should reject invalid song selection data', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create invalid song selection (end time <= start time)
      const invalidSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 40,
        endTime: 30
      });
      
      // Try to save invalid song selection
      const saveResult = DataManager.saveSongSelection(invalidSelection);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('End time must be greater than start time');
      
      // Verify no data was saved
      const retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      expect(retrievedSelection).toBeNull();
    });

    test('should reject invalid batting order data', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create invalid batting order (contains non-existent player)
      const invalidOrder = new BattingOrderModel({
        order: [player.id, 'non_existent_player']
      });
      
      // Try to save invalid batting order
      const saveResult = DataManager.saveBattingOrder(invalidOrder);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Batting order contains invalid player IDs');
      
      // Verify no data was saved
      const retrievedOrder = DataManager.getBattingOrder();
      expect(retrievedOrder.order).toHaveLength(0);
    });

    test('should reject invalid app state data', () => {
      // Create invalid app state (negative batter index)
      const invalidState = new AppStateModel({
        currentBatterIndex: -1,
        isPlaying: true,
        gameMode: true
      });
      
      // Try to save invalid app state
      const saveResult = DataManager.saveAppState(invalidState);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Current batter index must be a non-negative integer');
      
      // Verify default data is used
      const retrievedState = DataManager.getAppState();
      expect(retrievedState.currentBatterIndex).toBe(0);
    });

    test('should validate player data before saving', () => {
      // Create a player with name that's too long
      const longName = 'A'.repeat(CONSTANTS.MAX_NAME_LENGTH + 1);
      const invalidPlayer = new PlayerModel({ name: longName });
      
      // Try to save invalid player
      const saveResult = DataManager.savePlayer(invalidPlayer);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain(`Player name cannot exceed ${CONSTANTS.MAX_NAME_LENGTH} characters`);
    });

    test('should validate song segment duration', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create song selection with segment that's too short
      const invalidSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 10 + CONSTANTS.MIN_SEGMENT_DURATION - 1
      });
      
      // Try to save invalid song selection
      const saveResult = DataManager.saveSongSelection(invalidSelection);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain(`Segment must be at least ${CONSTANTS.MIN_SEGMENT_DURATION} seconds long`);
    });

    test('should validate song segment maximum duration', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create song selection with segment that's too long
      const invalidSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 10 + CONSTANTS.MAX_SEGMENT_DURATION + 1
      });
      
      // Try to save invalid song selection
      const saveResult = DataManager.saveSongSelection(invalidSelection);
      
      // Verify save failed with validation error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain(`Segment cannot exceed ${CONSTANTS.MAX_SEGMENT_DURATION} seconds`);
    });
  });

  // Test handling of local storage limitations (Requirement 6.5)
  describe('Local Storage Limitations', () => {
    test('should handle storage quota exceeded when saving player data', () => {
      // Configure wouldFitInStorage to return false
      storageUtils.setWouldFitInStorageReturnValue(false);
      
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      
      // Try to save player
      const saveResult = DataManager.savePlayer(player);
      
      // Verify save failed with storage limit error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Storage limit exceeded');
    });

    test('should handle storage quota exceeded when saving song selection data', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Configure wouldFitInStorage to return false
      storageUtils.setWouldFitInStorageReturnValue(false);
      
      // Create a valid song selection
      const songSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      // Try to save song selection
      const saveResult = DataManager.saveSongSelection(songSelection);
      
      // Verify save failed with storage limit error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Storage limit exceeded');
    });

    test('should handle storage quota exceeded when saving batting order data', () => {
      // Create valid players
      const player1 = new PlayerModel({ name: 'Player 1' });
      const player2 = new PlayerModel({ name: 'Player 2' });
      
      DataManager.savePlayer(player1);
      DataManager.savePlayer(player2);
      
      // Configure wouldFitInStorage to return false
      storageUtils.setWouldFitInStorageReturnValue(false);
      
      // Create a valid batting order
      const battingOrder = new BattingOrderModel({
        order: [player1.id, player2.id]
      });
      
      // Try to save batting order
      const saveResult = DataManager.saveBattingOrder(battingOrder);
      
      // Verify save failed with storage limit error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Storage limit exceeded');
    });

    test('should handle storage quota exceeded when saving app state data', () => {
      // Configure wouldFitInStorage to return false
      storageUtils.setWouldFitInStorageReturnValue(false);
      
      // Create a valid app state
      const appState = new AppStateModel({
        currentBatterIndex: 1,
        isPlaying: true,
        gameMode: true
      });
      
      // Try to save app state
      const saveResult = DataManager.saveAppState(appState);
      
      // Verify save failed with storage limit error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Storage limit exceeded');
    });

    test('should check if data would fit in storage before saving', () => {
      // Create a valid player
      const player = new PlayerModel({ name: 'Player 1' });
      
      // Save player
      DataManager.savePlayer(player);
      
      // Verify wouldFitInStorage was called
      expect(storageUtils.wouldFitInStorage).toHaveBeenCalled();
    });

    test('should enforce maximum number of players', () => {
      // Create maximum number of players
      for (let i = 0; i < CONSTANTS.MAX_PLAYERS; i++) {
        const player = new PlayerModel({ name: `Player ${i + 1}` });
        const saveResult = DataManager.savePlayer(player);
        expect(saveResult.success).toBe(true);
      }
      
      // Try to add one more player
      const extraPlayer = new PlayerModel({ name: 'Extra Player' });
      const saveResult = DataManager.savePlayer(extraPlayer);
      
      // Verify save failed with max players error
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain(`Cannot add more than ${CONSTANTS.MAX_PLAYERS} players`);
    });

    test('should calculate storage size correctly', () => {
      // Create test data
      const testData = { name: 'Test Data' };
      const serializedData = JSON.stringify(testData);
      
      // Set up mock localStorage
      localStorageMock.getItem.mockReturnValueOnce(serializedData);
      
      // Get storage size
      const size = storageUtils.getStorageSize('test_key');
      
      // Verify size calculation
      expect(size).toBe(serializedData.length * 2);
    });

    test('should handle storage not available', () => {
      // Mock localStorage.setItem to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      // Check if storage is available
      const isAvailable = storageUtils.isStorageAvailable();
      
      // Verify storage is not available
      expect(isAvailable).toBe(false);
      
      // Restore original mock
      localStorageMock.setItem = originalSetItem;
    });
  });

  // Test data integrity and relationships
  describe('Data Integrity and Relationships', () => {
    test('should remove song selections when player is deleted', () => {
      // Create a player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create song selection for the player
      const songSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      DataManager.saveSongSelection(songSelection);
      
      // Verify song selection exists
      let retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      expect(retrievedSelection).not.toBeNull();
      
      // Delete the player
      DataManager.deletePlayer(player.id);
      
      // Verify song selection was also deleted
      retrievedSelection = DataManager.getSongSelectionForPlayer(player.id);
      expect(retrievedSelection).toBeNull();
    });

    test('should remove player from batting order when player is deleted', () => {
      // Create players
      const player1 = new PlayerModel({ name: 'Player 1' });
      const player2 = new PlayerModel({ name: 'Player 2' });
      
      DataManager.savePlayer(player1);
      DataManager.savePlayer(player2);
      
      // Create batting order
      const battingOrder = new BattingOrderModel({
        order: [player1.id, player2.id]
      });
      
      DataManager.saveBattingOrder(battingOrder);
      
      // Verify batting order contains both players
      let retrievedOrder = DataManager.getBattingOrder();
      expect(retrievedOrder.order).toHaveLength(2);
      expect(retrievedOrder.order).toContain(player1.id);
      
      // Delete player 1
      DataManager.deletePlayer(player1.id);
      
      // Verify player 1 was removed from batting order
      retrievedOrder = DataManager.getBattingOrder();
      expect(retrievedOrder.order).toHaveLength(1);
      expect(retrievedOrder.order).not.toContain(player1.id);
      expect(retrievedOrder.order).toContain(player2.id);
    });

    test('should update existing song selection instead of creating duplicate', () => {
      // Create a player
      const player = new PlayerModel({ name: 'Player 1' });
      DataManager.savePlayer(player);
      
      // Create initial song selection
      const initialSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_1',
        trackName: 'Initial Song',
        artistName: 'Initial Artist',
        startTime: 10,
        endTime: 40
      });
      
      DataManager.saveSongSelection(initialSelection);
      
      // Create updated song selection for the same player
      const updatedSelection = new SongSelectionModel({
        playerId: player.id,
        trackId: 'track_2',
        trackName: 'Updated Song',
        artistName: 'Updated Artist',
        startTime: 20,
        endTime: 50
      });
      
      DataManager.saveSongSelection(updatedSelection);
      
      // Get all song selections
      const allSelections = DataManager.getSongSelections();
      
      // Verify only one song selection exists
      expect(allSelections).toHaveLength(1);
      
      // Verify it's the updated selection
      expect(allSelections[0].trackId).toBe('track_2');
      expect(allSelections[0].trackName).toBe('Updated Song');
    });

    test('should update existing player instead of creating duplicate', () => {
      // Create initial player
      const initialPlayer = new PlayerModel({ name: 'Initial Name' });
      DataManager.savePlayer(initialPlayer);
      
      // Create updated player with same ID
      const updatedPlayer = new PlayerModel({
        id: initialPlayer.id,
        name: 'Updated Name'
      });
      
      DataManager.savePlayer(updatedPlayer);
      
      // Get all players
      const allPlayers = DataManager.getPlayers();
      
      // Verify only one player exists
      expect(allPlayers).toHaveLength(1);
      
      // Verify it's the updated player
      expect(allPlayers[0].name).toBe('Updated Name');
    });
  });
});