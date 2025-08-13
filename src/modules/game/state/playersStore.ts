import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Player } from '@/modules/game/models/Player';

export interface PlayersState {
  players: Player[];
  actions: {
    createPlayer?: (name: string) => Player;
    updatePlayerById?: (
      id: string,
      updates: Partial<Omit<Player, 'id' | 'createdAt'>>
    ) => Player;
    deletePlayerById?: (id: string) => void;
    setPlayers: (players: Player[]) => void;
    addPlayer: (player: Player) => void;
    updatePlayer: (player: Player) => void;
    deletePlayer: (playerId: string) => void;
    reset: () => void;
  };
}

const initialState: Omit<PlayersState, 'actions'> = {
  players: [],
};

export const usePlayersStore = create<PlayersState>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        createPlayer: (name: string) => {
          const trimmed = name.trim();
          if (!trimmed) throw new Error('Player name cannot be empty');
          const player: Player = {
            id:
              globalThis.crypto?.randomUUID?.() ||
              `player-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            name: trimmed,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ players: [...state.players, player] }));
          return player;
        },
        updatePlayerById: (id, updates) => {
          const current = get().players.find((p) => p.id === id);
          if (!current) throw new Error(`Player with id ${id} not found`);
          const updated: Player = {
            ...current,
            ...updates,
            id,
            createdAt: current.createdAt,
            updatedAt: new Date(),
          };
          set((state) => ({
            players: state.players.map((p) => (p.id === id ? updated : p)),
          }));
          return updated;
        },
        deletePlayerById: (id) =>
          set((state) => ({
            players: state.players.filter((p) => p.id !== id),
          })),
        setPlayers: (players) => set({ players }),
        addPlayer: (player) =>
          set((state) => ({ players: [...state.players, player] })),
        updatePlayer: (player) =>
          set((state) => ({
            players: state.players.map((p) =>
              p.id === player.id ? player : p
            ),
          })),
        deletePlayer: (playerId) =>
          set((state) => ({
            players: state.players.filter((p) => p.id !== playerId),
          })),
        reset: () => set({ ...initialState }),
      },
    }),
    {
      name: 'players-store',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Only persist serializable state
      partialize: (state) => ({ players: state.players }),
      merge: (persistedState, currentState) => {
        // Ensure actions from current state are preserved
        const typedPersisted = persistedState as Partial<PlayersState>;
        return {
          ...currentState,
          ...typedPersisted,
          actions: currentState.actions,
        } as PlayersState;
      },
      migrate: (persistedState, _version) => {
        // Drop any accidentally persisted functions/unknown keys
        const typed = persistedState as Partial<PlayersState>;
        return {
          players: Array.isArray(typed.players) ? typed.players : [],
        } as Partial<PlayersState>;
      },
    }
  )
);

export function resetPlayersStore(): void {
  usePlayersStore.getState().actions.reset();
}
