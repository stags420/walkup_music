import { Player, BattingOrder, SpotifyTrack } from '@/types';

// Storage abstraction for future backend integration
export interface StorageService {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  export(): Promise<string>; // JSON export
  import(data: string): Promise<void>; // JSON import
}

// Authentication service interface
export interface AuthService {
  login(): Promise<void>;
  logout(): Promise<void>;
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  refreshToken(): Promise<void>;
}

// Player management interface
export interface PlayerService {
  createPlayer(name: string): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  getPlayer(id: string): Promise<Player | null>;
  getAllPlayers(): Promise<Player[]>;
  searchSongs(query: string): Promise<SpotifyTrack[]>;
}

// Game control interface
export interface GameService {
  createBattingOrder(playerIds: string[]): Promise<BattingOrder>;
  updateBattingOrder(order: BattingOrder): Promise<BattingOrder>;
  getCurrentBatter(): Player | null;
  getOnDeckBatter(): Player | null;
  getInTheHoleBatter(): Player | null;
  nextBatter(): Promise<void>;
  playWalkUpMusic(player: Player): Promise<void>;
  stopMusic(): Promise<void>;
}
