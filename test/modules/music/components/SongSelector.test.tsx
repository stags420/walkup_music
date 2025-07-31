import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SongSelector } from '@/modules/music/components/SongSelector';
import { MusicService, SpotifyTrack } from '@/modules/music';

// Mock music service
const mockMusicService: MusicService = {
  searchTracks: jest.fn(),
};

const mockTrack: SpotifyTrack = {
  id: 'track1',
  name: 'Test Song',
  artists: ['Test Artist'],
  album: 'Test Album',
  albumArt: 'https://example.com/album.jpg',
  previewUrl: 'https://example.com/preview.mp3',
  durationMs: 180000,
  uri: 'spotify:track:test123',
};

describe('SongSelector', () => {
  const mockOnSelectTrack = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSongSelector = (props = {}) => {
    return render(
      <SongSelector
        musicService={mockMusicService}
        onSelectTrack={mockOnSelectTrack}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('should render with initial empty state', () => {
    // Given I have a SongSelector component
    // When I render the component without any search
    renderSongSelector();

    // Then it should display the initial empty state
    expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
    expect(screen.getByLabelText(/search for songs/i)).toBeInTheDocument();
    expect(
      screen.getByText('Start typing to search for songs...')
    ).toBeInTheDocument();
  });

  it('should show loading state during search', async () => {
    // Given I have a music service that delays search results
    (mockMusicService.searchTracks as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
    );

    renderSongSelector();

    // When I enter a search query
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Then it should show the loading state
    await waitFor(() => {
      expect(screen.getByText('Searching for songs...')).toBeInTheDocument();
    });
  });

  it('should display search results when songs are found', async () => {
    // Given I have a music service that returns search results
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderSongSelector();

    // When I search for songs
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Then it should display the track information
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument(); // Duration formatted
    });
  });

  it('should handle track selection and confirmation', async () => {
    // Given I have search results available
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderSongSelector();

    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    // When I select a track and confirm the selection
    const trackCard = screen.getByRole('button', { name: /test song/i });
    fireEvent.click(trackCard);

    const selectButton = screen.getByText('Select Song');
    fireEvent.click(selectButton);

    // Then it should show selected state and call the callback
    expect(trackCard).toHaveClass('selected');
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(mockOnSelectTrack).toHaveBeenCalledWith(mockTrack);
  });

  it('should handle keyboard navigation for track selection', async () => {
    // Given I have search results available
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderSongSelector();

    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    // When I use keyboard to select a track
    const trackCard = screen.getByRole('button', { name: /test song/i });
    fireEvent.keyDown(trackCard, { key: 'Enter' });

    // Then the track should be selected
    expect(trackCard).toHaveClass('selected');
  });

  it('should show no results message when search returns empty', async () => {
    // Given I have a music service that returns no results
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([]);

    renderSongSelector();

    // When I search for something that doesn't exist
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    // Then it should show a no results message
    await waitFor(() => {
      expect(
        screen.getByText(/no songs found for "nonexistent"/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle search errors gracefully', async () => {
    // Given I have a music service that will fail
    (mockMusicService.searchTracks as jest.Mock).mockRejectedValue(
      new Error('Search failed')
    );

    renderSongSelector();

    // When I search and the service fails
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'error test' } });

    // Then it should show an error message with retry option
    await waitFor(() => {
      expect(screen.getByText(/error: search failed/i)).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should handle cancel action', () => {
    // Given I have a song selector rendered
    renderSongSelector();

    // When I click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Then the cancel callback should be called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should handle close button action', () => {
    // Given I have a song selector rendered
    renderSongSelector();

    // When I click the close button
    const closeButton = screen.getByLabelText('Close song selector');
    fireEvent.click(closeButton);

    // Then the cancel callback should be called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable select button when no track is selected', () => {
    // Given I have a song selector without any selected tracks
    renderSongSelector();

    // When I check the select button state
    const selectButton = screen.getByText('Select Song');

    // Then the select button should be disabled
    expect(selectButton).toBeDisabled();
  });

  it('should use initial search query when provided', () => {
    // Given I provide an initial search query
    // When I render the song selector with the initial query
    renderSongSelector({ initialSearchQuery: 'initial query' });

    // Then the search input should contain the initial query
    const searchInput = screen.getByLabelText(
      /search for songs/i
    ) as HTMLInputElement;
    expect(searchInput.value).toBe('initial query');
  });

  it('should format duration correctly', async () => {
    // Given I have a track with a specific duration
    const longTrack = {
      ...mockTrack,
      durationMs: 245000, // 4:05
    };

    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([longTrack]);

    renderSongSelector();

    // When I search and get the track
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Then the duration should be formatted correctly
    await waitFor(() => {
      expect(screen.getByText('4:05')).toBeInTheDocument();
    });
  });

  it('should handle image load errors gracefully', async () => {
    // Given I have search results with album art
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderSongSelector();

    // When I search and the track image fails to load
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    // Then it should handle the image error gracefully
    const albumImage = screen.getByAltText(
      'Test Album album cover'
    ) as HTMLImageElement;

    // Simulate image load error
    fireEvent.error(albumImage);

    // Should have fallback image
    expect(albumImage.src).toContain('data:image/svg+xml');
  });
});
