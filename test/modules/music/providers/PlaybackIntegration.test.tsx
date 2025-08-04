import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaybackProvider } from '@/modules/music/providers/PlaybackProvider';
import { usePlayback } from '@/modules/music/hooks/usePlayback';
import { TrackPreview } from '@/modules/core/components/TrackPreview';
import { MusicService } from '@/modules/music/services/MusicService';

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

const mockTrack1 = {
  id: 'track1',
  name: 'First Track',
  artists: [{ name: 'Artist 1' }],
  album: {
    name: 'Album 1',
    images: [{ url: 'https://example.com/art1.jpg' }],
  },
  duration_ms: 180000,
  preview_url: 'https://example.com/preview1.mp3',
};

const mockTrack2 = {
  id: 'track2',
  name: 'Second Track',
  artists: [{ name: 'Artist 2' }],
  album: {
    name: 'Album 2',
    images: [{ url: 'https://example.com/art2.jpg' }],
  },
  duration_ms: 200000,
  preview_url: 'https://example.com/preview2.mp3',
};

describe('Playback Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('should maintain consistent playback state across multiple components', async () => {
    // Given multiple TrackPreview components with centralized playback
    mockMusicService.playTrack.mockResolvedValue();
    mockMusicService.pause.mockResolvedValue();

    render(
      <PlaybackProvider musicService={mockMusicService}>
        <div data-testid="track1-container">
          <TrackPreview track={mockTrack1} showPlayControls={true} />
        </div>
        <div data-testid="track2-container">
          <TrackPreview track={mockTrack2} showPlayControls={true} />
        </div>
      </PlaybackProvider>
    );

    // When I play the first track
    const track1PlayButton = screen.getAllByTestId('play-button')[0];
    fireEvent.click(track1PlayButton);

    // Then the first track should be playing and the second should show play
    await waitFor(() => {
      expect(screen.getAllByTestId('pause-button')).toHaveLength(1);
      expect(screen.getAllByTestId('play-button')).toHaveLength(1);
    });

    // When I play the second track
    const track2PlayButton = screen.getByTestId('play-button');
    fireEvent.click(track2PlayButton);

    // Then the second track should be playing and the first should show play
    await waitFor(() => {
      // Both should show pause button for the currently playing track
      // and play button for the non-playing track
      const playButtons = screen.getAllByTestId('play-button');
      const pauseButtons = screen.getAllByTestId('pause-button');

      expect(playButtons).toHaveLength(1);
      expect(pauseButtons).toHaveLength(1);
    });

    // Verify the music service was called correctly
    expect(mockMusicService.playTrack).toHaveBeenCalledTimes(2);
    expect(mockMusicService.playTrack).toHaveBeenNthCalledWith(
      1,
      'spotify:track:track1',
      0
    );
    expect(mockMusicService.playTrack).toHaveBeenNthCalledWith(
      2,
      'spotify:track:track2',
      0
    );
  });

  test('should handle auto-stop functionality correctly', async () => {
    // Given a PlaybackProvider with auto-stop functionality
    mockMusicService.playTrack.mockResolvedValue();
    mockMusicService.pause.mockResolvedValue();
    const onTrackEnd = jest.fn();

    function TestComponentWithAutoStop() {
      const { playTrack } = usePlayback();

      const handlePlayWithDuration = () => {
        const spotifyTrack = {
          id: 'track1',
          name: 'First Track',
          artists: ['Artist 1'],
          album: 'Album 1',
          albumArt: 'https://example.com/art1.jpg',
          previewUrl: 'https://example.com/preview1.mp3',
          durationMs: 180000,
          uri: 'spotify:track:track1',
        };
        playTrack(spotifyTrack, { duration: 2, onTrackEnd });
      };

      return (
        <div>
          <button
            data-testid="play-with-duration"
            onClick={handlePlayWithDuration}
          >
            Play with Duration
          </button>
          <TrackPreview track={mockTrack1} showPlayControls={true} />
        </div>
      );
    }

    render(
      <PlaybackProvider musicService={mockMusicService}>
        <TestComponentWithAutoStop />
      </PlaybackProvider>
    );

    // When I play a track with auto-stop duration
    fireEvent.click(screen.getByTestId('play-with-duration'));

    // Then the track should be playing
    await waitFor(() => {
      expect(screen.getByTestId('pause-button')).toBeInTheDocument();
    });

    // When the duration expires
    jest.advanceTimersByTime(2000);

    // Then the track should be stopped and callback called
    await waitFor(() => {
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
    });

    expect(mockMusicService.pause).toHaveBeenCalled();
    expect(onTrackEnd).toHaveBeenCalled();
  });

  test('should handle playback errors consistently across components', async () => {
    // Given multiple components with failing playback
    mockMusicService.playTrack.mockRejectedValue(new Error('Playback failed'));

    render(
      <PlaybackProvider musicService={mockMusicService}>
        <div data-testid="track1-container">
          <TrackPreview track={mockTrack1} showPlayControls={true} />
        </div>
        <div data-testid="track2-container">
          <TrackPreview track={mockTrack2} showPlayControls={true} />
        </div>
      </PlaybackProvider>
    );

    // When I try to play the first track
    const track1PlayButton = screen.getAllByTestId('play-button')[0];
    fireEvent.click(track1PlayButton);

    // Then both components should reflect the error state consistently
    await waitFor(() => {
      const errorButtons = screen.getAllByLabelText('Error - Try again');
      expect(errorButtons).toHaveLength(1); // Only the track that failed should show error

      const playButtons = screen.getAllByTestId('play-button');
      expect(playButtons).toHaveLength(2); // Both should still show play buttons
    });
  });

  test('should cleanup properly when provider unmounts', async () => {
    // Given a provider with active playback
    mockMusicService.playTrack.mockResolvedValue();
    mockMusicService.pause.mockResolvedValue();
    const onTrackEnd = jest.fn();

    function TestComponentWithCleanup() {
      const { playTrack } = usePlayback();

      const handlePlayWithDuration = () => {
        const spotifyTrack = {
          id: 'track1',
          name: 'First Track',
          artists: ['Artist 1'],
          album: 'Album 1',
          albumArt: 'https://example.com/art1.jpg',
          previewUrl: 'https://example.com/preview1.mp3',
          durationMs: 180000,
          uri: 'spotify:track:track1',
        };
        playTrack(spotifyTrack, { duration: 10, onTrackEnd });
      };

      return (
        <button
          data-testid="play-with-cleanup"
          onClick={handlePlayWithDuration}
        >
          Play with Cleanup
        </button>
      );
    }

    const { unmount } = render(
      <PlaybackProvider musicService={mockMusicService}>
        <TestComponentWithCleanup />
      </PlaybackProvider>
    );

    // When I start playback with auto-stop
    fireEvent.click(screen.getByTestId('play-with-cleanup'));

    // And then unmount the provider
    unmount();

    // And the timeout would have expired
    jest.advanceTimersByTime(10000);

    // Then the callback should not be called (cleanup worked)
    expect(onTrackEnd).not.toHaveBeenCalled();
  });

  test('should support configurable TrackPreview variants', () => {
    // Given TrackPreview components with different configurations
    const onSelect = jest.fn();

    render(
      <PlaybackProvider musicService={mockMusicService}>
        <div data-testid="full-variant">
          <TrackPreview
            track={mockTrack1}
            variant="full"
            showPlayControls={true}
            showAlbumArt={true}
          />
        </div>
        <div data-testid="compact-variant">
          <TrackPreview
            track={mockTrack1}
            variant="compact"
            showPlayControls={false}
            showAlbumArt={true}
          />
        </div>
        <div data-testid="minimal-variant">
          <TrackPreview
            track={mockTrack1}
            variant="minimal"
            showPlayControls={false}
            showAlbumArt={false}
            onSelect={onSelect}
          />
        </div>
        <div data-testid="search-result">
          <TrackPreview
            track={mockTrack1}
            showPlayControls={false}
            onSelect={onSelect}
          />
        </div>
      </PlaybackProvider>
    );

    // Then each variant should render appropriately

    // Full variant should show everything
    const fullVariant = screen.getByTestId('full-variant');
    expect(
      fullVariant.querySelector('.track-preview--full')
    ).toBeInTheDocument();
    expect(fullVariant.querySelector('.track-album-art')).toBeInTheDocument();
    expect(
      fullVariant.querySelector('[data-testid="play-button"]')
    ).toBeInTheDocument();
    expect(fullVariant).toHaveTextContent('Album 1'); // Shows album name

    // Compact variant should not show play controls
    const compactVariant = screen.getByTestId('compact-variant');
    expect(
      compactVariant.querySelector('.track-preview--compact')
    ).toBeInTheDocument();
    expect(
      compactVariant.querySelector('.track-album-art')
    ).toBeInTheDocument();
    expect(
      compactVariant.querySelector('[data-testid="play-button"]')
    ).not.toBeInTheDocument();
    expect(compactVariant).not.toHaveTextContent('Album 1'); // Doesn't show album name

    // Minimal variant should not show album art
    const minimalVariant = screen.getByTestId('minimal-variant');
    expect(
      minimalVariant.querySelector('.track-preview--minimal')
    ).toBeInTheDocument();
    expect(
      minimalVariant.querySelector('.track-album-art')
    ).not.toBeInTheDocument();
    expect(
      minimalVariant.querySelector('[data-testid="select-button"]')
    ).toBeInTheDocument();

    // Search result should not show play controls by default
    const searchResult = screen.getByTestId('search-result');
    expect(
      searchResult.querySelector('[data-testid="play-button"]')
    ).not.toBeInTheDocument();
    expect(
      searchResult.querySelector('[data-testid="select-button"]')
    ).toBeInTheDocument();
  });
});
