import { Player } from '@/modules/game/models/Player';
import { StorageService } from '@/modules/storage';

/**
 * Service for managing player data with CRUD operations
 * Uses storage abstraction for future backend integration
 */
export class PlayerService {
  private readonly storageKey = 'players';

  constructor(private storageService: StorageService) {}

  /**
   * Create a new player
   */
  async createPlayer(name: string): Promise<Player> {
    if (!name.trim()) {
      throw new Error('Player name cannot be empty');
    }

    const player: Player = {
      id:
        globalThis.crypto?.randomUUID?.() ||
        `player-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const players = await this.getAllPlayers();
    players.push(player);
    await this.storageService.save(this.storageKey, players);

    return player;
  }

  /**
   * Update an existing player
   */
  async updatePlayer(
    id: string,
    updates: Partial<Omit<Player, 'id' | 'createdAt'>>
  ): Promise<Player> {
    const players = await this.getAllPlayers();
    const playerIndex = players.findIndex((p) => p.id === id);

    if (playerIndex === -1) {
      throw new Error(`Player with id ${id} not found`);
    }

    const updatedPlayer: Player = {
      ...players[playerIndex],
      ...updates,
      id, // Ensure id cannot be changed
      createdAt: players[playerIndex].createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    players[playerIndex] = updatedPlayer;
    await this.storageService.save(this.storageKey, players);

    return updatedPlayer;
  }

  /**
   * Delete a player by id
   */
  async deletePlayer(id: string): Promise<void> {
    const players = await this.getAllPlayers();
    const filteredPlayers = players.filter((p) => p.id !== id);

    if (filteredPlayers.length === players.length) {
      throw new Error(`Player with id ${id} not found`);
    }

    await this.storageService.save(this.storageKey, filteredPlayers);
  }

  /**
   * Get a player by id
   */
  async getPlayer(id: string): Promise<Player | null> {
    const players = await this.getAllPlayers();
    return players.find((p) => p.id === id) || null;
  }

  /**
   * Get all players
   */
  async getAllPlayers(): Promise<Player[]> {
    try {
      const playersData = await this.storageService.load<
        Array<{
          id: string;
          name: string;
          song?: {
            track: {
              id: string;
              name: string;
              artists: string[];
              album: string;
              albumArt: string;
              previewUrl: string;
              durationMs: number;
              uri: string;
            };
            startTime: number;
            duration: number;
          };
          createdAt: string | Date;
          updatedAt: string | Date;
        }>
      >(this.storageKey);
      if (!playersData) return [];

      // Convert stored data back to Player objects with proper Date objects
      return playersData.map((data) => ({
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }));
    } catch (error) {
      console.error('Failed to load players:', error);
      return [];
    }
  }
}
