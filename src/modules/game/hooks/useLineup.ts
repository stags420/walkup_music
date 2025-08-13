import { useLineupStore } from '@/modules/game/state/lineupStore';
import type { BattingOrder } from '@/modules/game/models/BattingOrder';

export function useLineupActions() {
  return useLineupStore((s) => s.actions);
}

export function useBattingOrder(): BattingOrder | undefined {
  return useLineupStore((s) => s.currentBattingOrder);
}

export function useGameActive(): boolean {
  return useLineupStore((s) => s.isGameActive);
}
