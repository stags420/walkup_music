import {
  StorageService,
  AuthService,
  PlayerService,
  GameService,
} from '../../src/services/interfaces';

// Type-only tests to ensure interfaces are properly defined
describe('Service Interfaces', () => {
  test('StorageService interface has required methods', () => {
    // This test ensures the interface is properly defined
    const mockStorage: StorageService = {
      save: jest.fn(),
      load: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      export: jest.fn(),
      import: jest.fn(),
    };

    expect(typeof mockStorage.save).toBe('function');
    expect(typeof mockStorage.load).toBe('function');
    expect(typeof mockStorage.delete).toBe('function');
    expect(typeof mockStorage.clear).toBe('function');
    expect(typeof mockStorage.export).toBe('function');
    expect(typeof mockStorage.import).toBe('function');
  });

  test('AuthService interface has required methods', () => {
    const mockAuth: AuthService = {
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isAuthenticated: jest.fn(),
      refreshToken: jest.fn(),
      handleCallback: jest.fn(),
    };

    expect(typeof mockAuth.login).toBe('function');
    expect(typeof mockAuth.logout).toBe('function');
    expect(typeof mockAuth.getAccessToken).toBe('function');
    expect(typeof mockAuth.isAuthenticated).toBe('function');
    expect(typeof mockAuth.refreshToken).toBe('function');
  });

  test('PlayerService interface has required methods', () => {
    const mockPlayer: PlayerService = {
      createPlayer: jest.fn(),
      updatePlayer: jest.fn(),
      deletePlayer: jest.fn(),
      getPlayer: jest.fn(),
      getAllPlayers: jest.fn(),
      searchSongs: jest.fn(),
    };

    expect(typeof mockPlayer.createPlayer).toBe('function');
    expect(typeof mockPlayer.updatePlayer).toBe('function');
    expect(typeof mockPlayer.deletePlayer).toBe('function');
    expect(typeof mockPlayer.getPlayer).toBe('function');
    expect(typeof mockPlayer.getAllPlayers).toBe('function');
    expect(typeof mockPlayer.searchSongs).toBe('function');
  });

  test('GameService interface has required methods', () => {
    const mockGame: GameService = {
      createBattingOrder: jest.fn(),
      updateBattingOrder: jest.fn(),
      getCurrentBatter: jest.fn(),
      getOnDeckBatter: jest.fn(),
      getInTheHoleBatter: jest.fn(),
      nextBatter: jest.fn(),
      playWalkUpMusic: jest.fn(),
      stopMusic: jest.fn(),
    };

    expect(typeof mockGame.createBattingOrder).toBe('function');
    expect(typeof mockGame.updateBattingOrder).toBe('function');
    expect(typeof mockGame.getCurrentBatter).toBe('function');
    expect(typeof mockGame.getOnDeckBatter).toBe('function');
    expect(typeof mockGame.getInTheHoleBatter).toBe('function');
    expect(typeof mockGame.nextBatter).toBe('function');
    expect(typeof mockGame.playWalkUpMusic).toBe('function');
    expect(typeof mockGame.stopMusic).toBe('function');
  });
});
