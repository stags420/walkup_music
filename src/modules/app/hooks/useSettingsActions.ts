import { useSettingsStore } from '@/modules/app/state/settingsStore';

export function useSettingsActions() {
  return useSettingsStore((s) => s.actions);
}
