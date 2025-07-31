import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { useMusic } from '@/modules/music/hooks/useMusic';
import { MusicProvider } from '@/modules/music';

describe('useMusic', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MusicProvider>{children}</MusicProvider>
  );

  it('should return music service when used within MusicProvider', () => {
    const { result } = renderHook(() => useMusic(), { wrapper });

    expect(result.current.musicService).toBeDefined();
    expect(result.current.musicService.constructor.name).toBe(
      'MockMusicService'
    );
  });

  it('should throw error when used outside MusicProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useMusic());
    }).toThrow('useMusic must be used within a MusicProvider');

    consoleSpy.mockRestore();
  });

  it('should provide the same service instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useMusic(), { wrapper });
    const firstService = result.current.musicService;

    rerender();
    const secondService = result.current.musicService;

    expect(firstService).toBe(secondService);
  });
});
