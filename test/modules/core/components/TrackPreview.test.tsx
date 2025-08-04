import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrackPreview } from '@/modules/core/components/TrackPreview';
import { PlaybackProvider } from '@/modules/music/providers/PlaybackProvider';
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

const mockTrack = {
  id: 'track1',
  name: 'Test Track',
  artists: [{ name: 'Test Artist' }, { name: 'Another Artist' }],
  album: {
    name: 'Test Album',
    images: [{ url: 'https://example.com/art.jpg' }],
  },
  duration_ms: 180000,
  preview_url: 'https://example.com/preview.mp3',
};

function renderWithPlayback(component: React.ReactElement) {
  return render(
    <PlaybackProvider musicService={mockMusicService}>
      {component}
    </PlaybackProvider>
  );
}

describe('TrackPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    test('should render track information', () => {
      // Given a TrackPreview component
      render(<TrackPreview track={mockTrack} />);

      // Then it should display track information
      expect(screen.getByText('Test Track')).toBeInTheDocument();
      expect(
        screen.getByText('Test Artist, Another Artist')
      ).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });

    test('should render album art when available', () => {
      // Given a TrackPreview component
      render(<TrackPreview track={mockTrack} />);

      // Then it should display album art
      const albumArt = screen.getByAltText('Test Album');
      expect(albumArt).toBeInTheDocument();
      expect(albumArt).toHaveAttribute('src', 'https://example.com/art.jpg');
    });

    test('should not render album art when showAlbumArt is false', () => {
      // Given a TrackPreview component with showAlbumArt disabled
      render(<TrackPreview track={mockTrack} showAlbumArt={false} />);

      // Then it should not display album art
      expect(screen.queryByAltText('Test Album')).not.toBeInTheDocument();
    });

    test('should handle missing album art gracefully', () => {
      // Given a track without album art
      const trackWithoutArt = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          images: [],
        },
      };

      render(<TrackPreview track={trackWithoutArt} />);

      // Then it should not display album art
      expect(screen.queryByAltText('Test Album')).not.toBeInTheDocument();
    });
  });

  describe('variants', () => {
    test('should apply full variant class by default', () => {
      // Given a TrackPreview component
      const { container } = render(<TrackPreview track={mockTrack} />);

      // Then it should have the full variant class
      expect(container.firstChild).toHaveClass('track-preview--full');
    });

    test('should apply compact variant class', () => {
      // Given a TrackPreview component with compact variant
      const { container } = render(
        <TrackPreview track={mockTrack} variant="compact" />
      );

      // Then it should have the compact variant class
      expect(container.firstChild).toHaveClass('track-preview--compact');
    });

    test('should apply minimal variant class', () => {
      // Given a TrackPreview component with minimal variant
      const { container } = render(
        <TrackPreview track={mockTrack} variant="minimal" />
      );

      // Then it should have the minimal variant class
      expect(container.firstChild).toHaveClass('track-preview--minimal');
    });

    test('should show album name in full variant', () => {
      // Given a TrackPreview component with full variant
      render(<TrackPreview track={mockTrack} variant="full" />);

      // Then it should display album name
      expect(screen.getByText('Test Album')).toBeInTheDocument();
    });

    test('should not show album name in compact variant', () => {
      // Given a TrackPreview component with compact variant
      render(<TrackPreview track={mockTrack} variant="compact" />);

      // Then it should not display album name
      expect(screen.queryByText('Test Album')).not.toBeInTheDocument();
    });

    test('should not show album name in minimal variant', () => {
      // Given a TrackPreview component with minimal variant
      render(<TrackPreview track={mockTrack} variant="minimal" />);

      // Then it should not display album name
      expect(screen.queryByText('Test Album')).not.toBeInTheDocument();
    });
  });

  describe('play controls', () => {
    test('should not show play controls by default', () => {
      // Given a TrackPreview component without play controls
      render(<TrackPreview track={mockTrack} />);

      // Then it should not display play button
      expect(screen.queryByTestId('play-button')).not.toBeInTheDocument();
    });

    test('should show play controls when enabled', () => {
      // Given a TrackPreview component with play controls enabled
      renderWithPlayback(
        <TrackPreview track={mockTrack} showPlayControls={true} />
      );

      // Then it should display play button
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });

    test('should play track when play button is clicked', async () => {
      // Given a TrackPreview component with play controls
      mockMusicService.playTrack.mockResolvedValue();
      const onPlay = jest.fn();
      renderWithPlayback(
        <TrackPreview
          track={mockTrack}
          showPlayControls={true}
          onPlay={onPlay}
        />
      );

      // When I click the play button
      fireEvent.click(screen.getByTestId('play-button'));

      // Then it should call the music service and callback
      await waitFor(() => {
        expect(mockMusicService.playTrack).toHaveBeenCalledWith(
          'spotify:track:track1',
          0
        );
        expect(onPlay).toHaveBeenCalled();
      });
    });

    test('should pause track when pause button is clicked', async () => {
      // Given a playing track
      mockMusicService.playTrack.mockResolvedValue();
      mockMusicService.pause.mockResolvedValue();
      const onPlay = jest.fn();
      renderWithPlayback(
        <TrackPreview
          track={mockTrack}
          showPlayControls={true}
          onPlay={onPlay}
        />
      );

      // When I play the track first
      fireEvent.click(screen.getByTestId('play-button'));
      await waitFor(() => {
        expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      });

      // And then click pause
      fireEvent.click(screen.getByTestId('pause-button'));

      // Then it should pause the track
      await waitFor(() => {
        expect(mockMusicService.pause).toHaveBeenCalled();
        expect(onPlay).toHaveBeenCalledTimes(2);
      });
    });

    test('should show loading state', async () => {
      // Given a TrackPreview component with play controls
      let resolvePlay: (() => void) | undefined;
      const playPromise = new Promise<void>((resolve) => {
        resolvePlay = resolve;
      });
      mockMusicService.playTrack.mockReturnValue(playPromise);
      renderWithPlayback(
        <TrackPreview track={mockTrack} showPlayControls={true} />
      );

      // When I click play
      fireEvent.click(screen.getByTestId('play-button'));

      // Then it should show loading state
      await waitFor(() => {
        expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
        expect(screen.getByText('⏳')).toBeInTheDocument();
      });

      // When playback completes
      if (resolvePlay) {
        resolvePlay();
      }
      await playPromise;

      // Then it should show pause state
      await waitFor(() => {
        expect(screen.getByTestId('pause-button')).toBeInTheDocument();
      });
    });

    test('should show error state', async () => {
      // Given a TrackPreview component with failing playback
      mockMusicService.playTrack.mockRejectedValue(
        new Error('Playback failed')
      );
      renderWithPlayback(
        <TrackPreview track={mockTrack} showPlayControls={true} />
      );

      // When I click play
      fireEvent.click(screen.getByTestId('play-button'));

      // Then it should show error state
      await waitFor(() => {
        expect(screen.getByLabelText('Error - Try again')).toBeInTheDocument();
        expect(screen.getByText('⚠')).toBeInTheDocument();
      });
    });

    test('should handle play control errors gracefully', async () => {
      // Given a TrackPreview component with failing playback
      mockMusicService.playTrack.mockRejectedValue(
        new Error('Playback failed')
      );
      const onPlay = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      renderWithPlayback(
        <TrackPreview
          track={mockTrack}
          showPlayControls={true}
          onPlay={onPlay}
        />
      );

      // When I click play
      fireEvent.click(screen.getByTestId('play-button'));

      // Then it should handle the error gracefully
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to play track:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('select functionality', () => {
    test('should not show select button by default', () => {
      // Given a TrackPreview component without select callback
      render(<TrackPreview track={mockTrack} />);

      // Then it should not display select button
      expect(screen.queryByTestId('select-button')).not.toBeInTheDocument();
    });

    test('should show select button when onSelect is provided', () => {
      // Given a TrackPreview component with select callback
      const onSelect = jest.fn();
      render(<TrackPreview track={mockTrack} onSelect={onSelect} />);

      // Then it should display select button
      expect(screen.getByTestId('select-button')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    test('should call onSelect when select button is clicked', () => {
      // Given a TrackPreview component with select callback
      const onSelect = jest.fn();
      render(<TrackPreview track={mockTrack} onSelect={onSelect} />);

      // When I click the select button
      fireEvent.click(screen.getByTestId('select-button'));

      // Then it should call the callback
      expect(onSelect).toHaveBeenCalled();
    });

    test('should show both play and select buttons when both are enabled', () => {
      // Given a TrackPreview component with both controls
      const onSelect = jest.fn();
      renderWithPlayback(
        <TrackPreview
          track={mockTrack}
          showPlayControls={true}
          onSelect={onSelect}
        />
      );

      // Then it should display both buttons
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('select-button')).toBeInTheDocument();
    });
  });

  describe('duration formatting', () => {
    test('should format duration correctly for minutes and seconds', () => {
      // Given a track with specific duration
      const trackWithDuration = {
        ...mockTrack,
        duration_ms: 125000, // 2:05
      };

      render(<TrackPreview track={trackWithDuration} />);

      // Then it should format duration correctly
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });

    test('should format duration correctly for hours', () => {
      // Given a track with long duration
      const trackWithLongDuration = {
        ...mockTrack,
        duration_ms: 3665000, // 61:05 (1 hour, 1 minute, 5 seconds)
      };

      render(<TrackPreview track={trackWithLongDuration} />);

      // Then it should format duration correctly
      expect(screen.getByText('61:05')).toBeInTheDocument();
    });

    test('should pad seconds with zero', () => {
      // Given a track with single-digit seconds
      const trackWithSingleDigitSeconds = {
        ...mockTrack,
        duration_ms: 65000, // 1:05
      };

      render(<TrackPreview track={trackWithSingleDigitSeconds} />);

      // Then it should pad seconds with zero
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have proper aria labels for play button', () => {
      // Given a TrackPreview component with play controls
      renderWithPlayback(
        <TrackPreview track={mockTrack} showPlayControls={true} />
      );

      // Then the play button should have proper aria label
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });

    test('should have proper alt text for album art', () => {
      // Given a TrackPreview component
      render(<TrackPreview track={mockTrack} />);

      // Then the album art should have proper alt text
      expect(screen.getByAltText('Test Album')).toBeInTheDocument();
    });

    test('should have proper test ids for buttons', () => {
      // Given a TrackPreview component with all controls
      const onSelect = jest.fn();
      renderWithPlayback(
        <TrackPreview
          track={mockTrack}
          showPlayControls={true}
          onSelect={onSelect}
        />
      );

      // Then buttons should have proper test ids
      expect(screen.getByTestId('play-button')).toBeInTheDocument();
      expect(screen.getByTestId('select-button')).toBeInTheDocument();
    });
  });
});
