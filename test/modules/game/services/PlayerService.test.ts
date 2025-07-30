import { PlayerService } from '@/modules/game/services/PlayerService';
import { Player } from '@/modules/game/models/Player';

// Mock storage service for testing
class MockStorageService {
  private data: Record<string, unknown> = {};

  async save<T>(key: string, data: T): Promise<void> {
    this.data[key] = structuredClone(data); // Deep clone
  }

  async load<T>(key: string): Promise<T | null> {
    return (this.data[key] as T) || null;
  }

  async delete(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }

  async export(): Promise<string> {
    return JSON.stringify(this.data);
  }

  async import(data: string): Promise<void> {
    this.data = JSON.parse(data);
  }

  // Test helper
  getData() {
    return this.data;
  }
}

describe('PlayerService', () => {
  let playerService: PlayerService;
  let mockStorage: MockStorageService;

  beforeEach(() => {
    mockStorage = new MockStorageService();
    playerService = new PlayerService(mockStorage);
  });

  describe('createPlayer', () => {
    it('should create a new player with valid name', async () => {
      const playerName = 'John Doe';
      const player = await playerService.createPlayer(playerName);

      expect(player.name).toBe(playerName);
      expect(player.id).toBeDefined();
      expect(player.id).toMatch(/^test-uuid-/); // Mock UUID format
      expect(player.createdAt).toBeInstanceOf(Date);
      expect(player.updatedAt).toBeInstanceOf(Date);
      expect(player.song).toBeUndefined();
    });

    it('should trim whitespace from player name', async () => {
      const player = await playerService.createPlayer('  John Doe  ');
      expect(player.name).toBe('John Doe');
    });

    it('should throw error for empty name', async () => {
      await expect(playerService.createPlayer('')).rejects.toThrow(
        'Player name cannot be empty'
      );
      await expect(playerService.createPlayer('   ')).rejects.toThrow(
        'Player name cannot be empty'
      );
    });

    it('should save player to storage', async () => {
      const player = await playerService.createPlayer('John Doe');
      const storedPlayers = await mockStorage.load<
        Array<{
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
        }>
      >('players');

      expect(storedPlayers).toHaveLength(1);
      expect(storedPlayers![0].id).toBe(player.id);
      expect(storedPlayers![0].name).toBe(player.name);
      expect(new Date(storedPlayers![0].createdAt)).toEqual(player.createdAt);
      expect(new Date(storedPlayers![0].updatedAt)).toEqual(player.updatedAt);
    });

    it('should add to existing players list', async () => {
      await playerService.createPlayer('Player 1');
      await playerService.createPlayer('Player 2');

      const players = await playerService.getAllPlayers();
      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Player 1');
      expect(players[1].name).toBe('Player 2');
    });
  });

  describe('updatePlayer', () => {
    let existingPlayer: Player;

    beforeEach(async () => {
      existingPlayer = await playerService.createPlayer('Original Name');
    });

    it('should update player name', async () => {
      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedPlayer = await playerService.updatePlayer(
        existingPlayer.id,
        {
          name: 'Updated Name',
        }
      );

      expect(updatedPlayer.name).toBe('Updated Name');
      expect(updatedPlayer.id).toBe(existingPlayer.id);
      expect(updatedPlayer.createdAt).toEqual(existingPlayer.createdAt);
      expect(updatedPlayer.updatedAt.getTime()).toBeGreaterThanOrEqual(
        existingPlayer.updatedAt.getTime()
      );
    });

    it('should throw error for non-existent player', async () => {
      await expect(
        playerService.updatePlayer('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Player with id non-existent-id not found');
    });

    it('should preserve id and createdAt', async () => {
      const updatedPlayer = await playerService.updatePlayer(
        existingPlayer.id,
        {
          name: 'New Name',
        }
      );

      expect(updatedPlayer.id).toBe(existingPlayer.id);
      expect(updatedPlayer.createdAt).toEqual(existingPlayer.createdAt);
    });

    it('should update player in storage', async () => {
      await playerService.updatePlayer(existingPlayer.id, {
        name: 'Updated Name',
      });

      const players = await playerService.getAllPlayers();
      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('Updated Name');
    });
  });

  describe('deletePlayer', () => {
    let player1: Player;
    let player2: Player;

    beforeEach(async () => {
      player1 = await playerService.createPlayer('Player 1');
      player2 = await playerService.createPlayer('Player 2');
    });

    it('should delete existing player', async () => {
      await playerService.deletePlayer(player1.id);

      const players = await playerService.getAllPlayers();
      expect(players).toHaveLength(1);
      expect(players[0].id).toBe(player2.id);
    });

    it('should throw error for non-existent player', async () => {
      await expect(
        playerService.deletePlayer('non-existent-id')
      ).rejects.toThrow('Player with id non-existent-id not found');
    });

    it('should update storage after deletion', async () => {
      await playerService.deletePlayer(player1.id);

      const storedPlayers = await mockStorage.load<Player[]>('players');
      expect(storedPlayers).toHaveLength(1);
      expect(storedPlayers![0].id).toBe(player2.id);
    });
  });

  describe('getPlayer', () => {
    let existingPlayer: Player;

    beforeEach(async () => {
      existingPlayer = await playerService.createPlayer('Test Player');
    });

    it('should return existing player', async () => {
      const player = await playerService.getPlayer(existingPlayer.id);
      expect(player).toEqual(existingPlayer);
    });

    it('should return null for non-existent player', async () => {
      const player = await playerService.getPlayer('non-existent-id');
      expect(player).toBeNull();
    });
  });

  describe('getAllPlayers', () => {
    it('should return empty array when no players exist', async () => {
      const players = await playerService.getAllPlayers();
      expect(players).toEqual([]);
    });

    it('should return all players', async () => {
      const player1 = await playerService.createPlayer('Player 1');
      const player2 = await playerService.createPlayer('Player 2');

      const players = await playerService.getAllPlayers();
      expect(players).toHaveLength(2);
      expect(players).toContainEqual(player1);
      expect(players).toContainEqual(player2);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock storage to throw error
      jest
        .spyOn(mockStorage, 'load')
        .mockRejectedValue(new Error('Storage error'));

      const players = await playerService.getAllPlayers();
      expect(players).toEqual([]);
    });
  });
});
