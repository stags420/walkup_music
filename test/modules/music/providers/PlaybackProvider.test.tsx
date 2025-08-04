// React import not needed for this test file
import { render, screen, act, waitFor } from '@testing-library/react';
import { PlaybackProvider } from '@/modules/music/providers/PlaybackProvider';
import { usePlayback } from '@/modules/music/hooks/usePlayback';
import { MusicService } from '@/modules/music/services/MusicService';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

// Mock MusicService
const mockMusicService: jest.Mocked<MusicService> = {
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  previewTrack: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn(),
  isPlaybackReady: jest.fn(),
};

const mockTrack: SpotifyTrack = {
  id: 'track1',
  name: 'Test Track',
  artists: ['Test Artist'],
  album: 'Test Album',
  albumArt: 'https://example.com/art.jpg',
  previewUrl: 'https://example.com/preview.mp3',
  durationMs: 180000,
  uri: 'spotify:track:test',
};

// Test component that uses the playback hook
function TestComponent() {
  const {
    playbackState,
    playTrack,
    pauseTrack,
    stopTrack,
    isCurrentTrack,
    isPlaying,
    isPaused,
    isLoading,
    hasError,
  } = usePlayback();

  return (
    <div>
      <div data-testid="current-track">
        {playbackState.currentTrack?.name || 'No track'}
      </div>
      <div data-testid="playback-state">{playbackState.state}</div>
      <div data-testid="position">{playbackState.position}</div>
      <div data-testid="duration">{playbackState.duration}</div>
      <div data-testid="error">{playbackState.error || 'No error'}</div>
      <div data-testid="is-current-track">
        {isCurrentTrack('track1').toString()}
      </div>
      <div data-testid="is-playing">{isPlaying().toString()}</div>
      <div data-testid="is-paused">{isPaused().toString()}</div>
      <div data-testid="is-loading">{isLoading().toString()}</div>
      <div data-testid="has-error">{hasError().toString()}</div>

      <button data-testid="play-button" onClick={() => playTrack(mockTrack)}>
        Play
      </button>
      <button
        data-testid="play-with-config-button"
        onClick={() => playTrack(mockTrack, { startTime: 30, duration: 10 })}
      >
        Play with Config
      </button>
      <button data-testid="pause-button" onClick={() => pauseTrack()}>
        Pause
      </button>
      <button data-testid="stop-button" onClick={() => stopTrack()}>
        Stop
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <PlaybackProvider musicService={mockMusicService}>
      <TestComponent />
    </PlaybackProvider>
  );
}

describe('PlaybackProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initial state', () => {
    test('should provide default playback state', () => {
      // Given a PlaybackProvider
      renderWithProvider();

      // Then the initial state should be idle with no track
      expect(screen.getByTestId('current-track')).toHaveTextContent('No track');
      expect(screen.getByTestId('playback-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('position')).toHaveTextContent('0');
      expect(screen.getByTestId('duration')).toHaveTextContent('0');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('is-current-track')).toHaveTextContent('false');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
    });
  });

  describe('playTrack', () => {
    test('should play track successfully', async () => {
      // Given a PlaybackProvider and successful music service
      mockMusicService.playTrack.mockResolvedValue();
      renderWithProvider();

      // When I play a track
      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      // Then the track should be playing
      await waitFor(() => {
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'Test Track'
        );
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
        expect(screen.getByTestId('position')).toHaveTextContent('0');
        expect(screen.getByTestId('duration')).toHaveTextContent('180000');
        expect(screen.getByTestId('is-current-track')).toHaveTextContent(
          'true'
        );
        expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
      });

      expect(mockMusicService.playTrack).toHaveBeenCalledWith(
        'spotify:track:test',
        0
      );
    });

    test('should show loading state during playback start', async () => {
      // Given a PlaybackProvider and delayed music service
      let resolvePlay: () => void;
      const playPromise = new Promise<void>((resolve) => {
        resolvePlay = resolve;
      });
      mockMusicService.playTrack.mockReturnValue(playPromise);
      renderWithProvider();

      // When I start playing a track
      act(() => {
        screen.getByTestId('play-button').click();
      });

      // Then it should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'loading'
        );
        expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
      });

      // When playback completes
      await act(async () => {
        resolvePlay();
        await playPromise;
      });

      // Then it should show playing state
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
      });
    });

    test('should play track with configuration', async () => {
      // Given a PlaybackProvider and successful music service
      mockMusicService.playTrack.mockResolvedValue();
      renderWithProvider();

      // When I play a track with configuration
      await act(async () => {
        screen.getByTestId('play-with-config-button').click();
      });

      // Then the track should be playing with correct start position
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
        expect(screen.getByTestId('position')).toHaveTextContent('30000');
      });

      expect(mockMusicService.playTrack).toHaveBeenCalledWith(
        'spotify:track:test',
        30000
      );
    });

    test('should auto-stop track after duration', async () => {
      // Given a PlaybackProvider and successful music service
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      const onTrackEnd = jest.fn();

      // Create a test component that plays with duration
      function TestComponentWithDuration() {
        const { playTrack } = usePlayback();

        return (
          <button
            data-testid="play-with-duration-button"
            onClick={() => playTrack(mockTrack, { duration: 2, onTrackEnd })}
          >
            Play with Duration
          </button>
        );
      }

      render(
        <PlaybackProvider musicService={mockMusicService}>
          <TestComponent />
          <TestComponentWithDuration />
        </PlaybackProvider>
      );

      // When I play a track with duration
      await act(async () => {
        screen.getByTestId('play-with-duration-button').click();
      });

      // Then the track should be playing
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
      });

      // When the duration expires
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Then the track should be stopped and callback called
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent('idle');
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'No track'
        );
      });

      expect(mockMusicService.pause).toHaveBeenCalled();
      expect(onTrackEnd).toHaveBeenCalled();
    });

    test('should handle playback errors', async () => {
      // Given a PlaybackProvider and failing music service
      const error = new Error('Playback failed');
      mockMusicService.playTrack.mockRejectedValue(error);
      renderWithProvider();

      // When I try to play a track
      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      // Then it should show error state
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent('error');
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Playback failed'
        );
        expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      });
    });

    test('should clear previous timeout when playing new track', async () => {
      // Given a PlaybackProvider with a track playing with duration
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();

      const newTrack = { ...mockTrack, id: 'track2', name: 'New Track' };

      // Create a test component that plays multiple tracks
      function TestComponentWithMultipleTracks() {
        const { playTrack } = usePlayback();

        return (
          <div>
            <button
              data-testid="play-first-track-button"
              onClick={() => playTrack(mockTrack, { duration: 10 })}
            >
              Play First Track
            </button>
            <button
              data-testid="play-second-track-button"
              onClick={() => playTrack(newTrack, { duration: 5 })}
            >
              Play Second Track
            </button>
          </div>
        );
      }

      render(
        <PlaybackProvider musicService={mockMusicService}>
          <TestComponent />
          <TestComponentWithMultipleTracks />
        </PlaybackProvider>
      );

      // When I play a track with duration
      await act(async () => {
        screen.getByTestId('play-first-track-button').click();
      });

      // And then play another track immediately
      await act(async () => {
        screen.getByTestId('play-second-track-button').click();
      });

      // Then the new track should be playing
      await waitFor(() => {
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'New Track'
        );
      });

      // When some time passes but before the second track's timeout
      await act(async () => {
        jest.advanceTimersByTime(3000); // 3 seconds, less than the second track's 5 second duration
      });

      // Then the new track should still be playing (original timeout was cleared)
      expect(screen.getByTestId('current-track')).toHaveTextContent(
        'New Track'
      );
      expect(screen.getByTestId('playback-state')).toHaveTextContent('playing');

      // When the second track's timeout expires
      await act(async () => {
        jest.advanceTimersByTime(2000); // Total 5 seconds
      });

      // Then the second track should be stopped
      await waitFor(() => {
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'No track'
        );
        expect(screen.getByTestId('playback-state')).toHaveTextContent('idle');
      });
    });
  });

  describe('pauseTrack', () => {
    test('should pause track successfully', async () => {
      // Given a playing track
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      renderWithProvider();

      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
      });

      // When I pause the track
      await act(async () => {
        screen.getByTestId('pause-button').click();
      });

      // Then the track should be paused
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'paused'
        );
        expect(screen.getByTestId('is-paused')).toHaveTextContent('true');
        expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
      });

      expect(mockMusicService.pause).toHaveBeenCalled();
    });

    test('should handle pause errors', async () => {
      // Given a playing track and failing pause
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockRejectedValue(new Error('Pause failed'));
      renderWithProvider();

      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      // When I try to pause
      await act(async () => {
        screen.getByTestId('pause-button').click();
      });

      // Then it should show error state
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent('error');
        expect(screen.getByTestId('error')).toHaveTextContent('Pause failed');
      });
    });

    test('should clear auto-stop timeout when pausing', async () => {
      // Given a track playing with auto-stop duration
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      const onTrackEnd = jest.fn();

      // Create a test component that plays with duration
      function TestComponentWithDurationAndPause() {
        const { playTrack } = usePlayback();

        return (
          <button
            data-testid="play-with-duration-and-pause-button"
            onClick={() => playTrack(mockTrack, { duration: 10, onTrackEnd })}
          >
            Play with Duration
          </button>
        );
      }

      render(
        <PlaybackProvider musicService={mockMusicService}>
          <TestComponent />
          <TestComponentWithDurationAndPause />
        </PlaybackProvider>
      );

      await act(async () => {
        screen.getByTestId('play-with-duration-and-pause-button').click();
      });

      // When I pause before the duration expires
      await act(async () => {
        screen.getByTestId('pause-button').click();
      });

      // Then the track should be paused
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'paused'
        );
      });

      // When the original duration would have expired
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // Then the track should still be paused (timeout was cleared)
      expect(screen.getByTestId('playback-state')).toHaveTextContent('paused');
      expect(onTrackEnd).not.toHaveBeenCalled();
    });
  });

  describe('stopTrack', () => {
    test('should stop track successfully', async () => {
      // Given a playing track
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      renderWithProvider();

      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent(
          'playing'
        );
      });

      // When I stop the track
      await act(async () => {
        screen.getByTestId('stop-button').click();
      });

      // Then the track should be stopped and state reset
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent('idle');
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'No track'
        );
        expect(screen.getByTestId('position')).toHaveTextContent('0');
        expect(screen.getByTestId('is-current-track')).toHaveTextContent(
          'false'
        );
        expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
      });

      expect(mockMusicService.pause).toHaveBeenCalled();
    });

    test('should reset state even if pause fails', async () => {
      // Given a playing track and failing pause
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockRejectedValue(new Error('Pause failed'));
      renderWithProvider();

      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      // When I stop the track
      await act(async () => {
        screen.getByTestId('stop-button').click();
      });

      // Then the state should still be reset
      await waitFor(() => {
        expect(screen.getByTestId('playback-state')).toHaveTextContent('idle');
        expect(screen.getByTestId('current-track')).toHaveTextContent(
          'No track'
        );
      });
    });
  });

  describe('utility functions', () => {
    test('should correctly identify current track', async () => {
      // Given a playing track
      mockMusicService.playTrack.mockResolvedValue();
      renderWithProvider();

      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      // Then isCurrentTrack should work correctly
      await waitFor(() => {
        expect(screen.getByTestId('is-current-track')).toHaveTextContent(
          'true'
        );
      });
    });

    test('should correctly identify playback states', async () => {
      // Given different playback states
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      renderWithProvider();

      // Initially idle
      expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
      expect(screen.getByTestId('is-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('has-error')).toHaveTextContent('false');

      // When playing
      await act(async () => {
        screen.getByTestId('play-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
      });

      // When paused
      await act(async () => {
        screen.getByTestId('pause-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('is-paused')).toHaveTextContent('true');
        expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
      });
    });
  });

  describe('cleanup', () => {
    test('should cleanup timeouts on unmount', async () => {
      // Given a component with auto-stop timeout
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      const onTrackEnd = jest.fn();

      // Create a test component that plays with duration
      function TestComponentWithCleanup() {
        const { playTrack } = usePlayback();

        return (
          <button
            data-testid="play-with-cleanup-button"
            onClick={() => playTrack(mockTrack, { duration: 10, onTrackEnd })}
          >
            Play with Cleanup
          </button>
        );
      }

      const { unmount } = render(
        <PlaybackProvider musicService={mockMusicService}>
          <TestComponent />
          <TestComponentWithCleanup />
        </PlaybackProvider>
      );

      await act(async () => {
        screen.getByTestId('play-with-cleanup-button').click();
      });

      // When the component unmounts
      unmount();

      // And the timeout would have expired
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // Then the callback should not be called (timeout was cleaned up)
      expect(onTrackEnd).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should throw error when usePlayback is used outside provider', () => {
      // Given a component without PlaybackProvider
      function ComponentWithoutProvider() {
        usePlayback();
        return <div>Test</div>;
      }

      // When I render it
      // Then it should throw an error
      expect(() => render(<ComponentWithoutProvider />)).toThrow(
        'usePlayback must be used within a PlaybackProvider'
      );
    });
  });
});
