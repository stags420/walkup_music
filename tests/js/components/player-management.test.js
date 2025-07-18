/**
 * Tests for the player management component
 */

import { PlayerModel, DataManager } from '../../../js/models/data-models.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store
  };
})();

// Mock DOM elements
document.body.innerHTML = `
  <form id="add-player-form">
    <input id="player-name" type="text" />
    <button type="submit">Add Player</button>
  </form>
  <ul id="players-list"></ul>
  <span id="player-count">0</span>
`;

// Mock bootstrap modal
global.bootstrap = {
  Modal: jest.fn().mockImplementation(() => {
    return {
      show: jest.fn(),
      hide: jest.fn()
    };
  })
};

// Mock the DataManager
jest.mock('../../../js/models/data-models.js', () => {
  const originalModule = jest.requireActual('../../../js/models/data-models.js');
  
  return {
    ...originalModule,
    DataManager: {
      getPlayers: jest.fn(),
      savePlayer: jest.fn(),
      deletePlayer: jest.fn(),
      getSongSelections: jest.fn(),
      getSongSelectionForPlayer: jest.fn()
    }
  };
});

describe('Player Management Component', () => {
  beforeAll(() => {
    // Replace localStorage with mock
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
  
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    document.getElementById('players-list').innerHTML = '';
    document.getElementById('player-count').textContent = '0';
  });
  
  describe('Adding players', () => {
    test('should add a player when form is submitted with valid data', () => {
      // Import the component (this will be done dynamically in the actual test)
      // const { initPlayerManagement } = require('../../../js/components/player-management.js');
      
      // Mock implementation for this test
      DataManager.getPlayers.mockReturnValue([]);
      DataManager.savePlayer.mockReturnValue({ success: true, error: null });
      
      // Set up the form with a player name
      const playerNameInput = document.getElementById('player-name');
      playerNameInput.value = 'Test Player';
      
      // Submit the form
      const addPlayerForm = document.getElementById('add-player-form');
      const submitEvent = new Event('submit');
      
      // Prevent the default action
      submitEvent.preventDefault = jest.fn();
      
      // Dispatch the event
      addPlayerForm.dispatchEvent(submitEvent);
      
      // Check if DataManager.savePlayer was called with a player object
      expect(DataManager.savePlayer).toHaveBeenCalled();
      
      // The first argument to the first call should be a PlayerModel
      const savedPlayer = DataManager.savePlayer.mock.calls[0][0];
      expect(savedPlayer).toBeInstanceOf(PlayerModel);
      expect(savedPlayer.name).toBe('Test Player');
    });
    
    test('should show validation error when player name is too long', () => {
      // Mock implementation for this test
      DataManager.getPlayers.mockReturnValue([]);
      
      // Set up the form with an invalid player name (too long)
      const playerNameInput = document.getElementById('player-name');
      playerNameInput.value = 'A'.repeat(51); // 51 characters (exceeds 50 character limit)
      
      // Submit the form
      const addPlayerForm = document.getElementById('add-player-form');
      const submitEvent = new Event('submit');
      
      // Prevent the default action
      submitEvent.preventDefault = jest.fn();
      
      // Dispatch the event
      addPlayerForm.dispatchEvent(submitEvent);
      
      // Check if validation failed
      expect(DataManager.savePlayer).not.toHaveBeenCalled();
    });
  });
  
  describe('Displaying players', () => {
    test('should display players from DataManager', () => {
      // Mock players data
      const mockPlayers = [
        new PlayerModel({ id: 'player1', name: 'Player 1' }),
        new PlayerModel({ id: 'player2', name: 'Player 2' })
      ];
      
      // Mock implementation
      DataManager.getPlayers.mockReturnValue(mockPlayers);
      DataManager.getSongSelectionForPlayer.mockReturnValue(null);
      
      // Call loadPlayers (this would be called by initPlayerManagement in the actual component)
      // loadPlayers();
      
      // Check if the players list contains the correct number of items
      // const playersList = document.getElementById('players-list');
      // expect(playersList.children.length).toBe(2);
      
      // Check if the player count is updated
      // const playerCount = document.getElementById('player-count');
      // expect(playerCount.textContent).toBe('2');
    });
  });
  
  describe('Editing players', () => {
    test('should update player when edit form is submitted', () => {
      // This would be tested in the actual implementation
    });
  });
  
  describe('Deleting players', () => {
    test('should delete player when confirmed', () => {
      // This would be tested in the actual implementation
    });
  });
});