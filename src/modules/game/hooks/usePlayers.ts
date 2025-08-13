import { usePlayersStore } from '@/modules/game/state/playersStore';
import type { Player } from '@/modules/game/models/Player';

export function usePlayers(): Player[] {
  return usePlayersStore((s) => s.players);
}

export function usePlayersActions() {
  return usePlayersStore((s) => s.actions);
}

export function useCreatePlayer() {
  return usePlayersStore((s) => s.actions.createPlayer);
}

export function useUpdatePlayerById() {
  return usePlayersStore((s) => s.actions.updatePlayerById);
}

export function useDeletePlayerById() {
  return usePlayersStore((s) => s.actions.deletePlayerById);
}
