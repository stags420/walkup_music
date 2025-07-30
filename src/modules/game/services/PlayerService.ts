import { Player } from '@/modules/game';
import { SpotifyTrack } from '@/modules/music';

// Player management interface

export interface PlayerService {
  createPlayer(name: string): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player>;
  deletePlayer(id: string): Promise<void>;
  getPlayer(id: string): Promise<Player | null>;
  getAllPlayers(): Promise<Player[]>;
  searchSongs(query: string): Promise<SpotifyTrack[]>;
}
