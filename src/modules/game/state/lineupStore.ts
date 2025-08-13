import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { BattingOrder } from '@/modules/game/models/BattingOrder';

export interface LineupState {
  currentBattingOrder?: BattingOrder;
  isGameActive: boolean;
  actions: {
    setBattingOrder: (order: BattingOrder) => void;
    updateBattingOrder: (order: BattingOrder) => void;
    clearBattingOrder: () => void;
    setGameActive: (active: boolean) => void;
    createBattingOrder: (playerIds: string[]) => BattingOrder;
    next: () => void;
  };
}

const initialState: Omit<LineupState, 'actions'> = {
  currentBattingOrder: undefined,
  isGameActive: false,
};

export const useLineupStore = create<LineupState>()(
  persist(
    (set) => ({
      ...initialState,
      actions: {
        setBattingOrder: (order) => set({ currentBattingOrder: order }),
        updateBattingOrder: (order) => set({ currentBattingOrder: order }),
        clearBattingOrder: () => set({ currentBattingOrder: undefined }),
        setGameActive: (active) => set({ isGameActive: active }),
        createBattingOrder: (playerIds: string[]) => {
          const order: BattingOrder = {
            id: `batting-order-${Date.now()}`,
            name: `Lineup ${new Date().toLocaleDateString()}`,
            playerIds: [...playerIds],
            currentPosition: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set({ currentBattingOrder: order });
          return order;
        },
        next: () =>
          set((state) => {
            const order = state.currentBattingOrder;
            if (!order || !state.isGameActive || order.playerIds.length === 0) {
              return state;
            }
            const nextPos =
              (order.currentPosition + 1) % order.playerIds.length;
            return {
              currentBattingOrder: {
                ...order,
                currentPosition: nextPos,
                updatedAt: new Date(),
              },
            };
          }),
      },
    }),
    {
      name: 'lineup-store',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => ({
        currentBattingOrder: state.currentBattingOrder,
        isGameActive: state.isGameActive,
      }),
      merge: (persistedState, currentState) => {
        // Preserve actions from current state
        const typedPersisted = persistedState as Partial<LineupState>;
        return {
          ...currentState,
          ...typedPersisted,
          actions: currentState.actions,
        } as LineupState;
      },
      migrate: (persistedState, _version) => {
        const typed = persistedState as Partial<LineupState>;
        return {
          currentBattingOrder: typed.currentBattingOrder,
          isGameActive: Boolean(typed.isGameActive),
        } as Partial<LineupState>;
      },
    }
  )
);

export function resetLineupStore(): void {
  useLineupStore.setState({ ...initialState });
}
