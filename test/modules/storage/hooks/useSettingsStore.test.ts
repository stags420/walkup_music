import { act } from '@testing-library/react';
import { useSettingsStore } from '@/modules/storage/hooks/useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Clear persisted state between tests
    localStorage.clear();
  });

  test('has default dark theme', () => {
    const theme = useSettingsStore.getState().theme;
    expect(theme).toBe('dark');
  });

  test('can set theme and persists it', () => {
    act(() => useSettingsStore.getState().setTheme('light'));
    expect(useSettingsStore.getState().theme).toBe('light');
    const persisted = JSON.parse(localStorage.getItem('app-settings') || '{}');
    expect(persisted.state.theme).toBe('light');
  });
});
