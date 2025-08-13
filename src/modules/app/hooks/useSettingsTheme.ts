import { useSettingsStore } from '@/modules/app/state/settingsStore';

export function useSettingsTheme() {
  return useSettingsStore((s) => s.theme);
}
