/**
 * Tests for data models and validation
 */

// Mock the storage-utils module
jest.mock('../../../js/utils/storage-utils', () => {
  return {
    STORAGE_KEYS: {
      PLAYERS: 'walkup_players',
      BATTING_ORDER: 'walkup_batting_order',
      SONG_SELECTIONS: 'walkup_song_selections',
      APP_STATE: 'walkup_app_state'
    },
    wouldFitInStorage: jest.fn().mockReturnValue(true)
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
    })
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock the storage-utils module
jest.mock('../../../js/utils/storage-utils.js', () => {
  return {
    STORAGE_KEYS: {
      PLAYERS: 'walkup_players',
      BATTING_ORDER: 'walkup_batting_order',
      SONG_SELECTIONS: 'walkup_song_selections',
      APP_STATE: 'walkup_app_state'
    },
    wouldFitInStorage: jest.fn().mockReturnValue(true)
  };
});

// Import the models
const {
  CONSTANTS,
  PlayerModel,
  SongSelectionModel,
  BattingOrderModel,
  AppStateModel,
  DataManager
} = require('../../../js/models/data-models');

describe('Data Models', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('PlayerModel', () => {
    test('should create a player with default values', () => {
      const player = new PlayerModel();
      
      expect(player.id).toBeDefined();
      expect(player.name).toBe('');
      expect(player.position).toBeNull();
    });

    test('should create a player with provided values', () => {
      const playerData = {
        id: 'test_id',
        name: 'Test Player',
        position: 1
      };
      
      const player = new PlayerModel(playerData);
      
      expect(player.id).toBe('test_id');
      expect(player.name).toBe('Test Player');
      expect(player.position).toBe(1);
    });

    test('should validate a valid player', () => {
      const player = new PlayerModel({
        name: 'Test Player',
        position: 1
      });
      
      const validation = player.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should invalidate a player with no name', () => {
      const player = new PlayerModel({
        position: 1
      });
      
      const validation = player.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Player name is required');
    });

    test('should invalidate a player with too long name', () => {
      const longName = 'A'.repeat(CONSTANTS.MAX_NAME_LENGTH + 1);
      const player = new PlayerModel({
        name: longName
      });
      
      const validation = player.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(`Player name cannot exceed ${CONSTANTS.MAX_NAME_LENGTH} characters`);
    });

    test('should invalidate a player with negative position', () => {
      const player = new PlayerModel({
        name: 'Test Player',
        position: -1
      });
      
      const validation = player.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Position must be a non-negative integer');
    });

    test('should convert to and from plain object', () => {
      const originalPlayer = new PlayerModel({
        id: 'test_id',
        name: 'Test Player',
        position: 1
      });
      
      const obj = originalPlayer.toObject();
      const recreatedPlayer = PlayerModel.fromObject(obj);
      
      expect(recreatedPlayer).toBeInstanceOf(PlayerModel);
      expect(recreatedPlayer.id).toBe('test_id');
      expect(recreatedPlayer.name).toBe('Test Player');
      expect(recreatedPlayer.position).toBe(1);
    });
  });

  describe('SongSelectionModel', () => {
    test('should create a song selection with default values', () => {
      const songSelection = new SongSelectionModel();
      
      expect(songSelection.playerId).toBe('');
      expect(songSelection.trackId).toBe('');
      expect(songSelection.startTime).toBe(0);
      expect(songSelection.endTime).toBe(0);
      expect(songSelection.duration).toBe(0);
    });

    test('should create a song selection with provided values', () => {
      const songData = {
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        albumArt: 'http://example.com/album.jpg',
        startTime: 10,
        endTime: 40
      };
      
      const songSelection = new SongSelectionModel(songData);
      
      expect(songSelection.playerId).toBe('player_1');
      expect(songSelection.trackId).toBe('track_1');
      expect(songSelection.trackName).toBe('Test Song');
      expect(songSelection.artistName).toBe('Test Artist');
      expect(songSelection.albumArt).toBe('http://example.com/album.jpg');
      expect(songSelection.startTime).toBe(10);
      expect(songSelection.endTime).toBe(40);
      expect(songSelection.duration).toBe(30);
    });

    test('should validate a valid song selection', () => {
      const songSelection = new SongSelectionModel({
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 40
      });
      
      const validation = songSelection.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should invalidate a song selection with missing required fields', () => {
      const songSelection = new SongSelectionModel({
        startTime: 10,
        endTime: 40
      });
      
      const validation = songSelection.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Player ID is required');
      expect(validation.errors).toContain('Track ID is required');
      expect(validation.errors).toContain('Track name is required');
      expect(validation.errors).toContain('Artist name is required');
    });

    test('should invalidate a song selection with invalid time values', () => {
      const songSelection = new SongSelectionModel({
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 40,
        endTime: 10
      });
      
      const validation = songSelection.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('End time must be greater than start time');
    });

    test('should invalidate a song selection with segment too short', () => {
      const songSelection = new SongSelectionModel({
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 10 + CONSTANTS.MIN_SEGMENT_DURATION - 1
      });
      
      const validation = songSelection.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(`Segment must be at least ${CONSTANTS.MIN_SEGMENT_DURATION} seconds long`);
    });

    test('should invalidate a song selection with segment too long', () => {
      const songSelection = new SongSelectionModel({
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        startTime: 10,
        endTime: 10 + CONSTANTS.MAX_SEGMENT_DURATION + 1
      });
      
      const validation = songSelection.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(`Segment cannot exceed ${CONSTANTS.MAX_SEGMENT_DURATION} seconds`);
    });

    test('should convert to and from plain object', () => {
      const originalSelection = new SongSelectionModel({
        playerId: 'player_1',
        trackId: 'track_1',
        trackName: 'Test Song',
        artistName: 'Test Artist',
        albumArt: 'http://example.com/album.jpg',
        startTime: 10,
        endTime: 40
      });
      
      const obj = originalSelection.toObject();
      const recreatedSelection = SongSelectionModel.fromObject(obj);
      
      expect(recreatedSelection).toBeInstanceOf(SongSelectionModel);
      expect(recreatedSelection.playerId).toBe('player_1');
      expect(recreatedSelection.trackId).toBe('track_1');
      expect(recreatedSelection.trackName).toBe('Test Song');
      expect(recreatedSelection.artistName).toBe('Test Artist');
      expect(recreatedSelection.albumArt).toBe('http://example.com/album.jpg');
      expect(recreatedSelection.startTime).toBe(10);
      expect(recreatedSelection.endTime).toBe(40);
      expect(recreatedSelection.duration).toBe(30);
    });
  });

  describe('BattingOrderModel', () => {
    test('should create a batting order with default values', () => {
      const battingOrder = new BattingOrderModel();
      
      expect(battingOrder.order).toEqual([]);
    });

    test('should create a batting order with provided values', () => {
      const orderData = {
        order: ['player_1', 'player_2', 'player_3']
      };
      
      const battingOrder = new BattingOrderModel(orderData);
      
      expect(battingOrder.order).toEqual(['player_1', 'player_2', 'player_3']);
    });

    test('should validate a valid batting order', () => {
      const battingOrder = new BattingOrderModel({
        order: ['player_1', 'player_2', 'player_3']
      });
      
      const players = [
        new PlayerModel({ id: 'player_1', name: 'Player 1' }),
        new PlayerModel({ id: 'player_2', name: 'Player 2' }),
        new PlayerModel({ id: 'player_3', name: 'Player 3' })
      ];
      
      const validation = battingOrder.validate(players);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should invalidate a batting order with duplicate players', () => {
      const battingOrder = new BattingOrderModel({
        order: ['player_1', 'player_2', 'player_1']
      });
      
      const players = [
        new PlayerModel({ id: 'player_1', name: 'Player 1' }),
        new PlayerModel({ id: 'player_2', name: 'Player 2' })
      ];
      
      const validation = battingOrder.validate(players);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Batting order contains duplicate players');
    });

    test('should invalidate a batting order with invalid player IDs', () => {
      const battingOrder = new BattingOrderModel({
        order: ['player_1', 'player_2', 'player_3']
      });
      
      const players = [
        new PlayerModel({ id: 'player_1', name: 'Player 1' }),
        new PlayerModel({ id: 'player_2', name: 'Player 2' })
      ];
      
      const validation = battingOrder.validate(players);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Batting order contains invalid player IDs: player_3');
    });

    test('should convert to and from plain object', () => {
      const originalOrder = new BattingOrderModel({
        order: ['player_1', 'player_2', 'player_3']
      });
      
      const obj = originalOrder.toObject();
      const recreatedOrder = BattingOrderModel.fromObject(obj);
      
      expect(recreatedOrder).toBeInstanceOf(BattingOrderModel);
      expect(recreatedOrder.order).toEqual(['player_1', 'player_2', 'player_3']);
    });
  });

  describe('AppStateModel', () => {
    test('should create an app state with default values', () => {
      const appState = new AppStateModel();
      
      expect(appState.currentBatterIndex).toBe(0);
      expect(appState.isPlaying).toBe(false);
      expect(appState.gameMode).toBe(false);
    });

    test('should create an app state with provided values', () => {
      const stateData = {
        currentBatterIndex: 2,
        isPlaying: true,
        gameMode: true
      };
      
      const appState = new AppStateModel(stateData);
      
      expect(appState.currentBatterIndex).toBe(2);
      expect(appState.isPlaying).toBe(true);
      expect(appState.gameMode).toBe(true);
    });

    test('should validate a valid app state', () => {
      const appState = new AppStateModel({
        currentBatterIndex: 2,
        isPlaying: true,
        gameMode: false
      });
      
      const validation = appState.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should invalidate an app state with invalid currentBatterIndex', () => {
      const appState = new AppStateModel({
        currentBatterIndex: -1,
        isPlaying: true,
        gameMode: false
      });
      
      const validation = appState.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Current batter index must be a non-negative integer');
    });

    test('should invalidate an app state with non-boolean values', () => {
      const appState = new AppStateModel({
        currentBatterIndex: 0,
        isPlaying: 'yes',
        gameMode: 1
      });
      
      const validation = appState.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('isPlaying must be a boolean value');
      expect(validation.errors).toContain('gameMode must be a boolean value');
    });

    test('should convert to and from plain object', () => {
      const originalState = new AppStateModel({
        currentBatterIndex: 2,
        isPlaying: true,
        gameMode: true
      });
      
      const obj = originalState.toObject();
      const recreatedState = AppStateModel.fromObject(obj);
      
      expect(recreatedState).toBeInstanceOf(AppStateModel);
      expect(recreatedState.currentBatterIndex).toBe(2);
      expect(recreatedState.isPlaying).toBe(true);
      expect(recreatedState.gameMode).toBe(true);
    });
  });

  describe('DataManager', () => {
    // Setup test data
    const testPlayer1 = new PlayerModel({
      id: 'player_1',
      name: 'Player 1',
      position: 0
    });
    
    const testPlayer2 = new PlayerModel({
      id: 'player_2',
      name: 'Player 2',
      position: 1
    });
    
    const testSongSelection = new SongSelectionModel({
      playerId: 'player_1',
      trackId: 'track_1',
      trackName: 'Test Song',
      artistName: 'Test Artist',
      startTime: 10,
      endTime: 40
    });
    
    const testBattingOrder = new BattingOrderModel({
      order: ['player_1', 'player_2']
    });
    
    const testAppState = new AppStateModel({
      currentBatterIndex: 0,
      isPlaying: false,
      gameMode: false
    });

    beforeEach(() => {
      // Set up localStorage with test data
      localStorageMock.setItem('walkup_players', JSON.stringify([
        testPlayer1.toObject(),
        testPlayer2.toObject()
      ]));
      
      localStorageMock.setItem('walkup_song_selections', JSON.stringify([
        testSongSelection.toObject()
      ]));
      
      localStorageMock.setItem('walkup_batting_order', JSON.stringify(
        testBattingOrder.toObject()
      ));
      
      localStorageMock.setItem('walkup_app_state', JSON.stringify(
        testAppState.toObject()
      ));
    });

    test('should get players from storage', () => {
      const players = DataManager.getPlayers();
      
      expect(players).toHaveLength(2);
      expect(players[0]).toBeInstanceOf(PlayerModel);
      expect(players[0].id).toBe('player_1');
      expect(players[1].id).toBe('player_2');
    });

    test('should save a player', () => {
      const newPlayer = new PlayerModel({
        id: 'player_3',
        name: 'Player 3'
      });
      
      const result = DataManager.savePlayer(newPlayer);
      
      expect(result.success).toBe(true);
      
      // Check that the player was added to storage
      const players = DataManager.getPlayers();
      expect(players).toHaveLength(3);
      expect(players[2].id).toBe('player_3');
    });

    test('should update an existing player', () => {
      const updatedPlayer = new PlayerModel({
        id: 'player_1',
        name: 'Updated Player 1',
        position: 2
      });
      
      const result = DataManager.savePlayer(updatedPlayer);
      
      expect(result.success).toBe(true);
      
      // Check that the player was updated in storage
      const players = DataManager.getPlayers();
      const player = players.find(p => p.id === 'player_1');
      expect(player.name).toBe('Updated Player 1');
      expect(player.position).toBe(2);
    });

    test('should not save an invalid player', () => {
      const invalidPlayer = new PlayerModel({
        id: 'player_3',
        name: '' // Invalid: empty name
      });
      
      const result = DataManager.savePlayer(invalidPlayer);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Player name is required');
      
      // Check that the player was not added to storage
      const players = DataManager.getPlayers();
      expect(players).toHaveLength(2);
    });

    test('should delete a player', () => {
      const result = DataManager.deletePlayer('player_1');
      
      expect(result.success).toBe(true);
      
      // Check that the player was removed from storage
      const players = DataManager.getPlayers();
      expect(players).toHaveLength(1);
      expect(players[0].id).toBe('player_2');
    });

    test('should get song selections from storage', () => {
      const selections = DataManager.getSongSelections();
      
      expect(selections).toHaveLength(1);
      expect(selections[0]).toBeInstanceOf(SongSelectionModel);
      expect(selections[0].playerId).toBe('player_1');
    });

    test('should get song selection for a player', () => {
      const selection = DataManager.getSongSelectionForPlayer('player_1');
      
      expect(selection).toBeInstanceOf(SongSelectionModel);
      expect(selection.playerId).toBe('player_1');
      expect(selection.trackId).toBe('track_1');
    });

    test('should return null for non-existent song selection', () => {
      const selection = DataManager.getSongSelectionForPlayer('non_existent');
      
      expect(selection).toBeNull();
    });

    test('should save a song selection', () => {
      const newSelection = new SongSelectionModel({
        playerId: 'player_2',
        trackId: 'track_2',
        trackName: 'Another Song',
        artistName: 'Another Artist',
        startTime: 20,
        endTime: 50
      });
      
      const result = DataManager.saveSongSelection(newSelection);
      
      expect(result.success).toBe(true);
      
      // Check that the selection was added to storage
      const selections = DataManager.getSongSelections();
      expect(selections).toHaveLength(2);
      expect(selections[1].playerId).toBe('player_2');
    });

    test('should get batting order from storage', () => {
      const battingOrder = DataManager.getBattingOrder();
      
      expect(battingOrder).toBeInstanceOf(BattingOrderModel);
      expect(battingOrder.order).toEqual(['player_1', 'player_2']);
    });

    test('should save batting order', () => {
      const newOrder = new BattingOrderModel({
        order: ['player_2', 'player_1']
      });
      
      const result = DataManager.saveBattingOrder(newOrder);
      
      expect(result.success).toBe(true);
      
      // Check that the order was updated in storage
      const battingOrder = DataManager.getBattingOrder();
      expect(battingOrder.order).toEqual(['player_2', 'player_1']);
    });

    test('should get app state from storage', () => {
      const appState = DataManager.getAppState();
      
      expect(appState).toBeInstanceOf(AppStateModel);
      expect(appState.currentBatterIndex).toBe(0);
      expect(appState.isPlaying).toBe(false);
      expect(appState.gameMode).toBe(false);
    });

    test('should save app state', () => {
      const newState = new AppStateModel({
        currentBatterIndex: 1,
        isPlaying: true,
        gameMode: true
      });
      
      const result = DataManager.saveAppState(newState);
      
      expect(result.success).toBe(true);
      
      // Check that the state was updated in storage
      const appState = DataManager.getAppState();
      expect(appState.currentBatterIndex).toBe(1);
      expect(appState.isPlaying).toBe(true);
      expect(appState.gameMode).toBe(true);
    });
  });
});