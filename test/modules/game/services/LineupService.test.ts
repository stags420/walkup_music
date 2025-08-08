import { LineupServiceImpl } from '@/modules/game/services/LineupService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { StorageService } from '@/modules/storage';
import type { Player } from '@/modules/game/models/Player';

// Mock services
const mockPlayerService = {
  getAllPlayers: jest.fn(),
  getPlayer: jest.fn(),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  storageKey: 'players',
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
} as unknown as jest.Mocked<PlayerService>;

const mockMusicService = {
  previewTrack: jest.fn(),
  pause: jest.fn(),
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentTrack: jest.fn(),
  isPlaybackReady: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn(),
} as unknown as jest.Mocked<MusicService>;

const mockStorageService = {
  save: jest.fn(),
  load: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  export: jest.fn(),
  import: jest.fn(),
} as jest.Mocked<StorageService>;

describe('LineupServiceImpl', () => {
  let lineupService: LineupServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    lineupService = new LineupServiceImpl(
      mockPlayerService,
      mockMusicService,
      mockStorageService
    );
  });

  describe('createBattingOrder', () => {
    it('should create a batting order with valid player IDs', async () => {
      const mockPlayers = [
        { id: 'player1', name: 'Player 1' } as Player,
        { id: 'player2', name: 'Player 2' } as Player,
        { id: 'player3', name: 'Player 3' } as Player,
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);

      const playerIds = ['player1', 'player2', 'player3'];
      const result = await lineupService.createBattingOrder(playerIds);

      expect(result).toBeDefined();
      expect(result.playerIds).toEqual(playerIds);
      expect(result.currentPosition).toBe(0);
      expect(result.name).toContain('Lineup');
    });

    it('should filter out invalid player IDs', async () => {
      const mockPlayers = [
        { id: 'player1', name: 'Player 1' } as Player,
        { id: 'player2', name: 'Player 2' } as Player,
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);

      const playerIds = ['player1', 'invalid-player', 'player2'];
      const result = await lineupService.createBattingOrder(playerIds);

      expect(result.playerIds).toEqual(['player1', 'player2']);
    });
  });

  describe('game state management', () => {
    it('should start and end game correctly', () => {
      expect(lineupService.isGameInProgress()).toBe(false);

      lineupService.startGame();
      expect(lineupService.isGameInProgress()).toBe(true);

      lineupService.endGame();
      expect(lineupService.isGameInProgress()).toBe(false);
    });

    it('should track current batting order', async () => {
      const mockPlayers = [
        { id: 'player1', name: 'Player 1' } as Player,
        { id: 'player2', name: 'Player 2' } as Player,
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);

      const playerIds = ['player1', 'player2'];
      const battingOrder = await lineupService.createBattingOrder(playerIds);

      expect(lineupService.getCurrentBattingOrder()).toEqual(battingOrder);
    });
  });

  describe('batter tracking', () => {
    beforeEach(async () => {
      const mockPlayers = [
        { id: 'player1', name: 'Player 1' } as Player,
        { id: 'player2', name: 'Player 2' } as Player,
        { id: 'player3', name: 'Player 3' } as Player,
      ];

      mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);
      mockPlayerService.getPlayer.mockImplementation((id: string) =>
        Promise.resolve(mockPlayers.find((p) => p.id === id) || null)
      );

      const playerIds = ['player1', 'player2', 'player3'];
      await lineupService.createBattingOrder(playerIds);
      lineupService.startGame();
    });

    it('should get current batter', async () => {
      const currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter?.id).toBe('player1');
    });

    it('should get on-deck batter', async () => {
      const onDeckBatter = await lineupService.getOnDeckBatter();
      expect(onDeckBatter?.id).toBe('player2');
    });

    it('should get in-the-hole batter', async () => {
      const inTheHoleBatter = await lineupService.getInTheHoleBatter();
      expect(inTheHoleBatter?.id).toBe('player3');
    });

    it('should advance to next batter', async () => {
      // Start with player1
      let currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter?.id).toBe('player1');

      // Advance to next batter
      await lineupService.nextBatter();
      currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter?.id).toBe('player2');

      // Advance again
      await lineupService.nextBatter();
      currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter?.id).toBe('player3');

      // Should wrap around to first player
      await lineupService.nextBatter();
      currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter?.id).toBe('player1');
    });
  });

  describe('music playback', () => {
    it('should play walk-up music for player with song', async () => {
      const playerWithSong = {
        id: 'player1',
        name: 'Player 1',
        song: {
          track: { uri: 'spotify:track:123' },
          startTime: 10,
          duration: 30,
        },
      } as Player;

      await lineupService.playWalkUpMusic(playerWithSong);

      expect(mockMusicService.previewTrack).toHaveBeenCalledWith(
        'spotify:track:123',
        10000, // startTime * 1000
        30000 // duration * 1000
      );
    });

    it('should throw error when player has no song', async () => {
      const playerWithoutSong = {
        id: 'player1',
        name: 'Player 1',
      } as Player;

      await expect(
        lineupService.playWalkUpMusic(playerWithoutSong)
      ).rejects.toThrow('Player has no song selected');
    });

    it('should stop music', async () => {
      await lineupService.stopMusic();
      expect(mockMusicService.pause).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should return null for batters when game is not active', async () => {
      const currentBatter = await lineupService.getCurrentBatter();
      expect(currentBatter).toBeNull();

      const onDeckBatter = await lineupService.getOnDeckBatter();
      expect(onDeckBatter).toBeNull();

      const inTheHoleBatter = await lineupService.getInTheHoleBatter();
      expect(inTheHoleBatter).toBeNull();
    });

    it('should not advance batter when game is not active', async () => {
      await lineupService.nextBatter();
      // Should not throw error and should not change state
      expect(lineupService.isGameInProgress()).toBe(false);
    });
  });
});
