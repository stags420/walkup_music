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
      // Given I have a valid player name
      const playerName = 'John Doe';

      // When I create a new player
      const player = await playerService.createPlayer(playerName);

      // Then the player should have the correct properties
      expect(player.name).toBe(playerName);
      expect(player.id).toBeDefined();
      expect(player.id).toMatch(/^test-uuid-/); // Mock UUID format
      expect(player.createdAt).toBeInstanceOf(Date);
      expect(player.updatedAt).toBeInstanceOf(Date);
      expect(player.song).toBeUndefined();
    });

    it('should trim whitespace from player name', async () => {
      // Given I have a player name with whitespace
      // When I create a new player
      const player = await playerService.createPlayer('  John Doe  ');

      // Then the name should be trimmed
      expect(player.name).toBe('John Doe');
    });

    it('should throw error for empty name', async () => {
      // Given I have an empty player name
      // When I try to create a player
      // Then it should throw an error
      await expect(playerService.createPlayer('')).rejects.toThrow(
        'Player name cannot be empty'
      );
      await expect(playerService.createPlayer('   ')).rejects.toThrow(
        'Player name cannot be empty'
      );
    });

    it('should save player to storage', async () => {
      // Given I have a valid player name
      // When I create a new player
      const player = await playerService.createPlayer('John Doe');

      // Then the player should be saved to storage
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
      // Given I have no existing players
      // When I create multiple players
      await playerService.createPlayer('Player 1');
      await playerService.createPlayer('Player 2');

      // Then all players should be stored
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
      // Given I have an existing player
      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When I update the player name
      const updatedPlayer = await playerService.updatePlayer(
        existingPlayer.id,
        {
          name: 'Updated Name',
        }
      );

      // Then the player should be updated with the new name
      expect(updatedPlayer.name).toBe('Updated Name');
      expect(updatedPlayer.id).toBe(existingPlayer.id);
      expect(updatedPlayer.createdAt).toEqual(existingPlayer.createdAt);
      expect(updatedPlayer.updatedAt.getTime()).toBeGreaterThanOrEqual(
        existingPlayer.updatedAt.getTime()
      );
    });

    it('should throw error for non-existent player', async () => {
      // Given I have a non-existent player ID
      // When I try to update a non-existent player
      // Then it should throw an error
      await expect(
        playerService.updatePlayer('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Player with id non-existent-id not found');
    });

    it('should preserve id and createdAt', async () => {
      // Given I have an existing player
      // When I update the player
      const updatedPlayer = await playerService.updatePlayer(
        existingPlayer.id,
        {
          name: 'New Name',
        }
      );

      // Then the ID and createdAt should be preserved
      expect(updatedPlayer.id).toBe(existingPlayer.id);
      expect(updatedPlayer.createdAt).toEqual(existingPlayer.createdAt);
    });

    it('should update player in storage', async () => {
      // Given I have an existing player
      // When I update the player
      await playerService.updatePlayer(existingPlayer.id, {
        name: 'Updated Name',
      });

      // Then the player should be updated in storage
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
      // Given I have multiple players
      // When I delete one player
      await playerService.deletePlayer(player1.id);

      // Then only the remaining player should exist
      const players = await playerService.getAllPlayers();
      expect(players).toHaveLength(1);
      expect(players[0].id).toBe(player2.id);
    });

    it('should throw error for non-existent player', async () => {
      // Given I have a non-existent player ID
      // When I try to delete a non-existent player
      // Then it should throw an error
      await expect(
        playerService.deletePlayer('non-existent-id')
      ).rejects.toThrow('Player with id non-existent-id not found');
    });

    it('should update storage after deletion', async () => {
      // Given I have multiple players
      // When I delete one player
      await playerService.deletePlayer(player1.id);

      // Then the storage should be updated to reflect the deletion
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
      // Given I have an existing player
      // When I get the player by ID
      const player = await playerService.getPlayer(existingPlayer.id);

      // Then it should return the correct player
      expect(player).toEqual(existingPlayer);
    });

    it('should return null for non-existent player', async () => {
      // Given I have a non-existent player ID
      // When I try to get a non-existent player
      const player = await playerService.getPlayer('non-existent-id');

      // Then it should return null
      expect(player).toBeNull();
    });
  });

  describe('getAllPlayers', () => {
    it('should return empty array when no players exist', async () => {
      // Given I have no players
      // When I get all players
      const players = await playerService.getAllPlayers();

      // Then it should return an empty array
      expect(players).toEqual([]);
    });

    it('should return all players', async () => {
      // Given I have multiple players
      const player1 = await playerService.createPlayer('Player 1');
      const player2 = await playerService.createPlayer('Player 2');

      // When I get all players
      const players = await playerService.getAllPlayers();

      // Then it should return all players
      expect(players).toHaveLength(2);
      expect(players).toContainEqual(player1);
      expect(players).toContainEqual(player2);
    });

    it('should handle storage errors gracefully', async () => {
      // Given I have a storage that will throw an error
      jest
        .spyOn(mockStorage, 'load')
        .mockRejectedValue(new Error('Storage error'));

      // When I get all players
      const players = await playerService.getAllPlayers();

      // Then it should return an empty array instead of throwing
      expect(players).toEqual([]);
    });
  });
});
