import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService, SpotifyTrack, SongSegment } from '@/modules/music';
import { Player } from '@/modules/game/models/Player';

// Mock services
const mockPlayerService = {
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(),
  storageKey: 'players',
  storageService: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
} as unknown as PlayerService;

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

const mockSegment: SongSegment = {
  track: mockTrack,
  startTime: 30,
  duration: 10,
};

const mockPlayerWithSong: Player = {
  id: 'player1',
  name: 'Test Player',
  song: mockSegment,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PlayerForm with Song Selection', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPlayerForm = (props = {}) => {
    return render(
      <PlayerForm
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('should render form with song selection section for new player', () => {
    renderPlayerForm();

    expect(screen.getByText(/add new player/i)).toBeInTheDocument();
    expect(screen.getByText('Walk-up Song')).toBeInTheDocument();
    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();
    expect(screen.getByText('Select Song')).toBeInTheDocument();
  });

  it('should display existing song when editing player with song', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    expect(screen.getByText(/edit player/i)).toBeInTheDocument();
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('by Test Artist')).toBeInTheDocument();
    expect(screen.getByText('Test Album')).toBeInTheDocument();
    expect(screen.getByText(/plays from 30s for 10s/i)).toBeInTheDocument();
    expect(screen.getByText('Change Song')).toBeInTheDocument();
    expect(screen.getByText('Remove Song')).toBeInTheDocument();
  });

  it('should open song selector when clicking select song button', () => {
    renderPlayerForm();

    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
    expect(screen.getByLabelText(/search for songs/i)).toBeInTheDocument();
  });

  it('should open song selector when clicking change song button', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    const changeSongButton = screen.getByText('Change Song');
    fireEvent.click(changeSongButton);

    expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
  });

  it('should remove song when clicking remove song button', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    const removeSongButton = screen.getByText('Remove Song');
    fireEvent.click(removeSongButton);

    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();
    expect(screen.getByText('Select Song')).toBeInTheDocument();
  });

  it('should close song selector when clicking cancel', () => {
    renderPlayerForm();

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Cancel
    const cancelButton = screen
      .getAllByText('Cancel')
      .find((btn) => btn.closest('.song-selector-modal'));
    fireEvent.click(cancelButton!);

    expect(screen.queryByText('Select Walk-up Song')).not.toBeInTheDocument();
  });

  it('should open segment selector after selecting a track', async () => {
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderPlayerForm();

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Search for a song
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    // Select the track
    const trackCard = screen.getByRole('button', { name: /test song/i });
    fireEvent.click(trackCard);

    // Find the select button within the song selector actions
    const selectButtons = screen.getAllByText('Select Song');
    const selectButton = selectButtons.find((btn) =>
      btn.className.includes('select-button')
    );
    fireEvent.click(selectButton!);

    // Should open segment selector
    expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration')).toBeInTheDocument();
  });

  it('should complete song selection flow', async () => {
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);
    (mockPlayerService.createPlayer as jest.Mock).mockResolvedValue({
      id: 'new-player-id',
      name: 'New Player',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderPlayerForm();

    // Enter player name
    const nameInput = screen.getByLabelText(/player name/i);
    fireEvent.change(nameInput, { target: { value: 'New Player' } });

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Search and select track
    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    const trackCard = screen.getByRole('button', { name: /test song/i });
    fireEvent.click(trackCard);

    // Find the select button within the song selector actions
    const selectButtons = screen.getAllByText('Select Song');
    const selectTrackButton = selectButtons.find((btn) =>
      btn.className.includes('select-button')
    );
    fireEvent.click(selectTrackButton!);

    // Configure segment
    const confirmButton = screen.getByText('Confirm Selection');
    fireEvent.click(confirmButton);

    // Should show selected song in form
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('by Test Artist')).toBeInTheDocument();

    // Save player
    const saveButton = screen.getByText('Add Player');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPlayerService.createPlayer).toHaveBeenCalledWith('New Player');
    });
  });

  it('should handle song selection cancellation', () => {
    renderPlayerForm();

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Close with X button
    const closeButton = screen.getByLabelText('Close song selector');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Select Walk-up Song')).not.toBeInTheDocument();
    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();
  });

  it('should handle segment selection cancellation', async () => {
    (mockMusicService.searchTracks as jest.Mock).mockResolvedValue([mockTrack]);

    renderPlayerForm();

    // Complete track selection to reach segment selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    const searchInput = screen.getByLabelText(/search for songs/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    const trackCard = screen.getByRole('button', { name: /test song/i });
    fireEvent.click(trackCard);

    // Find the select button within the song selector actions
    const selectButtons = screen.getAllByText('Select Song');
    const selectTrackButton = selectButtons.find((btn) =>
      btn.className.includes('select-button')
    );
    fireEvent.click(selectTrackButton!);

    // Cancel segment selection
    const cancelButton = screen
      .getAllByText('Cancel')
      .find((btn) => btn.closest('.segment-selector-modal'));
    fireEvent.click(cancelButton!);

    expect(screen.queryByText('Select Song Segment')).not.toBeInTheDocument();
    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();
  });

  it('should preserve song state when form is cancelled and reopened', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    // Remove song
    const removeSongButton = screen.getByText('Remove Song');
    fireEvent.click(removeSongButton);

    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();

    // Cancel form
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();

    // Clean up first render
    cleanup();

    // Re-render with same player (simulating reopening form)
    renderPlayerForm({ player: mockPlayerWithSong });

    // Should show original song again
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });

  it('should handle image errors in song preview', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    const albumImage = screen.getByAltText(
      'Test Album album art'
    ) as HTMLImageElement;

    // Simulate image load error
    fireEvent.error(albumImage);

    // Should have fallback image
    expect(albumImage.src).toContain('data:image/svg+xml');
  });
});
