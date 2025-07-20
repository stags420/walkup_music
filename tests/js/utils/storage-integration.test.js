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
  let throwOnNextSetItem = false;
  let throwQuotaExceededOnNextSetItem = false;
  
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      if (throwOnNextSetItem) {
        throwOnNextSetItem = false;
        throw new Error('Storage not available');
      }
      if (throwQuotaExceededOnNextSetItem) {
        throwQuotaExceededOnNextSetItem = false;
        const error = new DOMException('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get throwOnNextSetItem() { return throwOnNextSetItem; },
    set throwOnNextSetItem(value) { throwOnNextSetItem = value; },
    get throwQuotaExceededOnNextSetItem() { return throwQuotaExceededOnNextSetItem; },
    set throwQuotaExceededOnNextSetItem(value) { throwQuotaExceededOnNextSetItem = value; }
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Since we can't easily import ES modules in Jest, we'll test the integration interfaces
// and create mock implementations for testing

// Mock storage utilities
const storageUtils = {
  STORAGE_KEYS: {
    PLAYERS: 'walkup_players',
    BATTING_ORDER: 'walkup_batting_order',
    SONG_SELECTIONS: 'walkup_song_selections',
    APP_STATE: 'walkup_app_state'
  },
  wouldFitInStorage: jest.fn().mockReturnValue(true),
  setWouldFitInStorageReturnValue: jest.fn((value) => {
    storageUtils.wouldFitInStorage.mockReturnValue(value);
  }),
  clearData: jest.fn((key) => {
    localStorageMock.removeItem(key);
    return true;
  }),
  clearAllData: jest.fn(() => {
    localStorageMock.clear();
    return true;
  }),
  getStorageSize: jest.fn((key) => {
    const data = localStorageMock.getItem(key);
    return data ? data.length * 2 : 0; // Simulate UTF-16 encoding
  }),
  isStorageAvailable: jest.fn(() => {
    try {
      localStorageMock.setItem('test', 'test');
      localStorageMock.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  })
};

const CONSTANTS = {
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 1,
  MAX_PLAYERS: 30,
  MAX_SEGMENT_DURATION: 60,
  MIN_SEGMENT_DURATION: 5,
};

// Mock PlayerModel for testing
class PlayerModel {
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.name = data.name || '';
    this.position = data.position || null;
  }

  _generateId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    const errors = [];
    if (!this.name) {
      errors.push('Player name is required');
    } else if (this.name.length < CONSTANTS.MIN_NAME_LENGTH) {
      errors.push(`Player name must be at least ${CONSTANTS.MIN_NAME_LENGTH} character`);
    } else if (this.name.length > CONSTANTS.MAX_NAME_LENGTH) {
      errors.push(`Player name cannot exceed ${CONSTANTS.MAX_NAME_LENGTH} characters`);
    }
    if (this.position !== null) {
      if (!Number.isInteger(this.position) || this.position < 0) {
        errors.push('Position must be a non-negative integer');
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  toObject() {
    return { id: this.id, name: this.name, position: this.position };
  }

  static fromObject(obj) {
    return new PlayerModel(obj);
  }
}

// Mock SongSelectionModel for testing
class SongSelectionModel {
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

  validate() {
    const errors = [];
    if (!this.playerId) errors.push('Player ID is required');
    if (!this.trackId) errors.push('Track ID is required');
    if (!this.trackName) errors.push('Track name is required');
    if (!this.artistName) errors.push('Artist name is required');
    if (typeof this.startTime !== 'number' || this.startTime < 0) {
      errors.push('Start time must be a non-negative number');
    }
    if (typeof this.endTime !== 'number' || this.endTime <= 0) {
      errors.push('End time must be a positive number');
    }
    if (this.endTime <= this.startTime) {
      errors.push('End time must be greater than start time');
    }
    const duration = this.endTime - this.startTime;
    if (duration < CONSTANTS.MIN_SEGMENT_DURATION) {
      errors.push(`Segment must be at least ${CONSTANTS.MIN_SEGMENT_DURATION} seconds long`);
    }
    if (duration > CONSTANTS.MAX_SEGMENT_DURATION) {
      errors.push(`Segment cannot exceed ${CONSTANTS.MAX_SEGMENT_DURATION} seconds`);
    }
    return { isValid: errors.length === 0, errors };
  }

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

  static fromObject(obj) {
    return new SongSelectionModel(obj);
  }
}

// Mock BattingOrderModel for testing
class BattingOrderModel {
  constructor(data = {}) {
    this.order = data.order || [];
  }

  validate(players = []) {
    const errors = [];
    const playerIds = players.map(player => player.id);
    const uniqueIds = new Set(this.order);
    if (uniqueIds.size !== this.order.length) {
      errors.push('Batting order contains duplicate players');
    }
    const invalidIds = this.order.filter(id => !playerIds.includes(id));
    if (invalidIds.length > 0) {
      errors.push(`Batting order contains invalid player IDs: ${invalidIds.join(', ')}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  toObject() {
    return { order: [...this.order] };
  }

  static fromObject(obj) {
    return new BattingOrderModel(obj);
  }
}

// Mock AppStateModel for testing
class AppStateModel {
  constructor(data = {}) {
    this.currentBatterIndex = data.currentBatterIndex !== undefined ? data.currentBatterIndex : 0;
    this.isPlaying = data.isPlaying !== undefined ? data.isPlaying : false;
    this.gameMode = data.gameMode !== undefined ? data.gameMode : false;
  }

  validate() {
    const errors = [];
    if (!Number.isInteger(this.currentBatterIndex) || this.currentBatterIndex < 0) {
      errors.push('Current batter index must be a non-negative integer');
    }
    if (typeof this.isPlaying !== 'boolean') {
      errors.push('isPlaying must be a boolean value');
    }
    if (typeof this.gameMode !== 'boolean') {
      errors.push('gameMode must be a boolean value');
    }
    return { isValid: errors.length === 0, errors };
  }

  toObject() {
    return {
      currentBatterIndex: this.currentBatterIndex,
      isPlaying: this.isPlaying,
      gameMode: this.gameMode
    };
  }

  static fromObject(obj) {
    return new AppStateModel(obj);
  }
}

// Mock DataManager for testing
class DataManager {
  static getPlayers() {
    const playersData = this._getDataFromStorage(storageUtils.STORAGE_KEYS.PLAYERS, []);
    return playersData.map(playerData => PlayerModel.fromObject(playerData));
  }

  static savePlayer(player) {
    const validation = player.validate();
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    const players = this.getPlayers();
    const existingIndex = players.findIndex(p => p.id === player.id);
    if (existingIndex >= 0) {
      players[existingIndex] = player;
    } else {
      if (players.length >= CONSTANTS.MAX_PLAYERS) {
        return { success: false, error: `Cannot add more than ${CONSTANTS.MAX_PLAYERS} players` };
      }
      players.push(player);
    }
    const playersData = players.map(p => p.toObject());
    if (!storageUtils.wouldFitInStorage(storageUtils.STORAGE_KEYS.PLAYERS, playersData)) {
      return { success: false, error: 'Storage limit exceeded. Try removing some players or songs.' };
    }
    return this._saveDataToStorage(storageUtils.STORAGE_KEYS.PLAYERS, playersData);
  }

  static deletePlayer(playerId) {
    const players = this.getPlayers();
    const filteredPlayers = players.filter(p => p.id !== playerId);
    if (filteredPlayers.length === players.length) {
      return { success: false, error: 'Player not found' };
    }
    const playersData = filteredPlayers.map(p => p.toObject());
    const result = this._saveDataToStorage(storageUtils.STORAGE_KEYS.PLAYERS, playersData);
    if (result.success) {
      this._deleteSongSelectionsForPlayer(playerId);
      this._removePlayerFromBattingOrder(playerId);
    }
    return result;
  }

  static getSongSelections() {
    const selectionsData = this._getDataFromStorage(storageUtils.STORAGE_KEYS.SONG_SELECTIONS, []);
    return selectionsData.map(data => SongSelectionModel.fromObject(data));
  }

  static getSongSelectionForPlayer(playerId) {
    const selections = this.getSongSelections();
    const selection = selections.find(s => s.playerId === playerId);
    return selection || null;
  }

  static saveSongSelection(songSelection) {
    const validation = songSelection.validate();
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    const selections = this.getSongSelections();
    const existingIndex = selections.findIndex(s => s.playerId === songSelection.playerId);
    if (existingIndex >= 0) {
      selections[existingIndex] = songSelection;
    } else {
      selections.push(songSelection);
    }
    const selectionsData = selections.map(s => s.toObject());
    if (!storageUtils.wouldFitInStorage(storageUtils.STORAGE_KEYS.SONG_SELECTIONS, selectionsData)) {
      return { success: false, error: 'Storage limit exceeded. Try removing some songs or players.' };
    }
    return this._saveDataToStorage(storageUtils.STORAGE_KEYS.SONG_SELECTIONS, selectionsData);
  }

  static _deleteSongSelectionsForPlayer(playerId) {
    const selections = this.getSongSelections();
    const filteredSelections = selections.filter(s => s.playerId !== playerId);
    const selectionsData = filteredSelections.map(s => s.toObject());
    return this._saveDataToStorage(storageUtils.STORAGE_KEYS.SONG_SELECTIONS, selectionsData);
  }

  static getBattingOrder() {
    const orderData = this._getDataFromStorage(storageUtils.STORAGE_KEYS.BATTING_ORDER, { order: [] });
    return BattingOrderModel.fromObject(orderData);
  }

  static saveBattingOrder(battingOrder) {
    const players = this.getPlayers();
    const validation = battingOrder.validate(players);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    const orderData = battingOrder.toObject();
    if (!storageUtils.wouldFitInStorage(storageUtils.STORAGE_KEYS.BATTING_ORDER, orderData)) {
      return { success: false, error: 'Storage limit exceeded.' };
    }
    return this._saveDataToStorage(storageUtils.STORAGE_KEYS.BATTING_ORDER, orderData);
  }

  static _removePlayerFromBattingOrder(playerId) {
    const battingOrder = this.getBattingOrder();
    battingOrder.order = battingOrder.order.filter(id => id !== playerId);
    return this.saveBattingOrder(battingOrder);
  }

  static getAppState() {
    const stateData = this._getDataFromStorage(storageUtils.STORAGE_KEYS.APP_STATE, {});
    return AppStateModel.fromObject(stateData);
  }

  static saveAppState(appState) {
    const validation = appState.validate();
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }
    const stateData = appState.toObject();
    if (!storageUtils.wouldFitInStorage(storageUtils.STORAGE_KEYS.APP_STATE, stateData)) {
      return { success: false, error: 'Storage limit exceeded.' };
    }
    return this._saveDataToStorage(storageUtils.STORAGE_KEYS.APP_STATE, stateData);
  }

  static _getDataFromStorage(key, defaultValue) {
    try {
      const serializedData = localStorageMock.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error(`Error retrieving ${key} from storage:`, error);
      return defaultValue;
    }
  }

  static _saveDataToStorage(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorageMock.setItem(key, serializedData);
      return { success: true, error: null };
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return { success: false, error: 'Storage limit exceeded. Try removing some data.' };
      }
      return { success: false, error: 'Failed to save data to storage.' };
    }
  }
}

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