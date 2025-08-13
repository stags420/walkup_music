import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

type SettingsState = {
  theme: ThemeMode;
  actions: {
    setTheme: (mode: ThemeMode) => void;
  };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      actions: {
        setTheme: (mode) => set({ theme: mode }),
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
