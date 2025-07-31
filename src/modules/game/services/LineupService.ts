import { BattingOrder, Player } from '@/modules/game';

// Game control interface

export interface LineupService {
  createBattingOrder(playerIds: string[]): Promise<BattingOrder>;
  updateBattingOrder(order: BattingOrder): Promise<BattingOrder>;
  getCurrentBatter(): Player | null;
  getOnDeckBatter(): Player | null;
  getInTheHoleBatter(): Player | null;
  nextBatter(): Promise<void>;
  playWalkUpMusic(player: Player): Promise<void>;
  stopMusic(): Promise<void>;
}
