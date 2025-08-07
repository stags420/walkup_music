import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsState {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (mode) => set({ theme: mode }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
