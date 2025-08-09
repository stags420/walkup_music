import type { BattingOrder, Player } from '@/modules/game';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { StorageService } from '@/modules/storage';

// Game control interface
export interface LineupService {
  createBattingOrder(playerIds: string[]): Promise<BattingOrder>;
  updateBattingOrder(order: BattingOrder): Promise<BattingOrder>;
  getCurrentBatter(): Promise<Player | null>;
  getOnDeckBatter(): Promise<Player | null>;
  getInTheHoleBatter(): Promise<Player | null>;
  nextBatter(): Promise<void>;
  playWalkUpMusic(player: Player): Promise<void>;
  stopMusic(): Promise<void>;
  startGame(): void;
  endGame(): void;
  isGameInProgress(): boolean;
  getCurrentBattingOrder(): BattingOrder | null;
  loadGameState(): Promise<void>;
}

export class LineupServiceImpl implements LineupService {
  private currentBattingOrder: BattingOrder | null = null;
  private isGameActive = false;
  private readonly storageKey = 'game-state';

  constructor(
    private playerService: PlayerService,
    private musicService: MusicService,
    private storageService: StorageService
  ) {
    // Load game state on initialization
    void this.loadGameState();
  }

  private async saveGameState(): Promise<void> {
    const gameState = {
      isGameActive: this.isGameActive,
      currentBattingOrder: this.currentBattingOrder,
      timestamp: new Date().toISOString(),
    };
    await this.storageService.save(this.storageKey, gameState);
  }

  async loadGameState(): Promise<void> {
    try {
      const gameState = await this.storageService.load<{
        isGameActive: boolean;
        currentBattingOrder: BattingOrder | null;
        timestamp: string;
      }>(this.storageKey);

      if (gameState) {
        this.isGameActive = gameState.isGameActive;
        this.currentBattingOrder = gameState.currentBattingOrder;
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  }

  async createBattingOrder(playerIds: string[]): Promise<BattingOrder> {
    const allPlayers = await this.playerService.getAllPlayers();
    const validPlayerIds = playerIds.filter((id) =>
      allPlayers.some((player) => player.id === id)
    );

    const battingOrder: BattingOrder = {
      id: `batting-order-${Date.now()}`,
      name: `Lineup ${new Date().toLocaleDateString()}`,
      playerIds: validPlayerIds,
      currentPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.currentBattingOrder = battingOrder;
    await this.saveGameState();
    return battingOrder;
  }

  async updateBattingOrder(order: BattingOrder): Promise<BattingOrder> {
    const updatedOrder = {
      ...order,
      updatedAt: new Date(),
    };
    this.currentBattingOrder = updatedOrder;
    await this.saveGameState();
    return updatedOrder;
  }

  async getCurrentBatter(): Promise<Player | null> {
    if (!this.currentBattingOrder || !this.isGameActive) {
      return null;
    }

    const currentPlayerId =
      this.currentBattingOrder.playerIds[
        this.currentBattingOrder.currentPosition
      ];
    if (!currentPlayerId) {
      return null;
    }

    return await this.playerService.getPlayer(currentPlayerId);
  }

  async getOnDeckBatter(): Promise<Player | null> {
    if (!this.currentBattingOrder || !this.isGameActive) {
      return null;
    }

    const nextPosition =
      (this.currentBattingOrder.currentPosition + 1) %
      this.currentBattingOrder.playerIds.length;
    const onDeckPlayerId = this.currentBattingOrder.playerIds[nextPosition];
    if (!onDeckPlayerId) {
      return null;
    }

    return await this.playerService.getPlayer(onDeckPlayerId);
  }

  async getInTheHoleBatter(): Promise<Player | null> {
    if (!this.currentBattingOrder || !this.isGameActive) {
      return null;
    }

    const inTheHolePosition =
      (this.currentBattingOrder.currentPosition + 2) %
      this.currentBattingOrder.playerIds.length;
    const inTheHolePlayerId =
      this.currentBattingOrder.playerIds[inTheHolePosition];
    if (!inTheHolePlayerId) {
      return null;
    }

    return await this.playerService.getPlayer(inTheHolePlayerId);
  }

  async nextBatter(): Promise<void> {
    if (!this.currentBattingOrder || !this.isGameActive) {
      return;
    }

    this.currentBattingOrder.currentPosition =
      (this.currentBattingOrder.currentPosition + 1) %
      this.currentBattingOrder.playerIds.length;
    this.currentBattingOrder.updatedAt = new Date();
    await this.saveGameState();
  }

  async playWalkUpMusic(player: Player): Promise<void> {
    if (!player.song) {
      throw new Error('Player has no song selected');
    }

    // Convert segment timing to milliseconds
    const startPositionMs = player.song.startTime * 1000;
    const durationMs = player.song.duration * 1000;

    await this.musicService.previewTrack(
      player.song.track.uri,
      startPositionMs,
      durationMs
    );
  }

  async stopMusic(): Promise<void> {
    await this.musicService.pause();
  }

  // Additional methods for game state management
  startGame(): void {
    this.isGameActive = true;
    void this.saveGameState();
  }

  endGame(): void {
    this.isGameActive = false;
    // Keep the batting order persistent - don't clear it
    // this.currentBattingOrder = null;
    // this.storageService.delete(this.storageKey);
    void this.saveGameState();
  }

  isGameInProgress(): boolean {
    return this.isGameActive;
  }

  getCurrentBattingOrder(): BattingOrder | null {
    return this.currentBattingOrder;
  }
}
