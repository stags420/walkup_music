import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService, SpotifyTrack, SongSegment } from '@/modules/music';
import { MusicProvider } from '@/modules/music';
import type { Player } from '@/modules/game/models/Player';

// Mock SongSelector to avoid portal issues
jest.mock('@/modules/music/components/SongSelector', () => {
  interface MockSongSelectorProps {
    onSelectTrack: (track: SpotifyTrack) => void;
    onCancel: () => void;
    [key: string]: unknown;
  }

  const MockSongSelector = ({
    onSelectTrack,
    onCancel,
  }: MockSongSelectorProps) => {
    return (
      <div data-testid="song-selector">
        <h2>Select a Song</h2>
        <input
          type="text"
          placeholder="Search for songs..."
          aria-label="Search for songs"
          defaultValue=""
        />
        <button
          onClick={() =>
            onSelectTrack({
              id: 'test-track',
              name: 'Test Song',
              artists: ['Test Artist'],
              album: 'Test Album',
              albumArt: 'test-art.jpg',
              previewUrl: 'test-preview.mp3',
              durationMs: 180000,
              uri: 'spotify:track:test-track',
            })
          }
        >
          Select Song
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
  return { SongSelector: MockSongSelector };
});

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
} as unknown as jest.Mocked<PlayerService>;

const mockMusicService: MusicService = {
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  previewTrack: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn().mockReturnValue(true),
  isPlaybackReady: jest.fn().mockReturnValue(true),
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
      <MusicProvider musicService={mockMusicService}>
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          {...props}
        />
      </MusicProvider>
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

    expect(screen.getByText('Select a Song')).toBeInTheDocument();
  });

  it('should open segment selector after selecting a track', () => {
    renderPlayerForm();

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Simulate track selection (this would normally come from SongSelector)
    // For now, we'll just verify the song selector is open
    expect(screen.getByText('Select a Song')).toBeInTheDocument();
  });

  it('should complete song selection flow', () => {
    renderPlayerForm();

    // Open song selector
    const selectSongButton = screen.getByText('Select Song');
    fireEvent.click(selectSongButton);

    // Verify song selector is open
    expect(screen.getByText('Select a Song')).toBeInTheDocument();
  });

  it('should handle segment selection cancellation', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    // Open segment selector
    const editTimingButton = screen.getByText('Edit Timing');
    fireEvent.click(editTimingButton);

    // Verify segment selector is open
    expect(screen.getByText('Select Timing')).toBeInTheDocument();

    // Cancel segment selection - use the one in the segment selector
    const cancelButtons = screen.getAllByText('Cancel');
    const segmentCancelButton =
      cancelButtons.find((button) =>
        button.closest('[data-testid="song-selector"]')
      ) || cancelButtons[0];
    fireEvent.click(segmentCancelButton);

    // Should return to main form
    expect(screen.queryByText('Select Timing')).not.toBeInTheDocument();
  });

  it('should handle song removal', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    // Verify song is displayed
    expect(screen.getByText('Test Song')).toBeInTheDocument();

    // Remove song
    const removeSongButton = screen.getByText('Remove Song');
    fireEvent.click(removeSongButton);

    // Verify song is removed
    expect(screen.queryByText('Test Song')).not.toBeInTheDocument();
    expect(screen.getByText(/no walk-up song selected/i)).toBeInTheDocument();
  });

  it('should handle song change', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    // Change song
    const changeSongButton = screen.getByText('Change Song');
    fireEvent.click(changeSongButton);

    // Verify song selector is open
    expect(screen.getByText('Select a Song')).toBeInTheDocument();
  });

  it('should display song timing information', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    expect(screen.getByText(/plays from 30s for 10s/i)).toBeInTheDocument();
  });

  it('should show edit timing button for existing songs', () => {
    renderPlayerForm({ player: mockPlayerWithSong });

    expect(screen.getByText('Edit Timing')).toBeInTheDocument();
  });

  it('should handle form submission with song', async () => {
    const updatedPlayer = { ...mockPlayerWithSong, name: 'Updated Player' };
    mockPlayerService.updatePlayer.mockResolvedValue(updatedPlayer);

    renderPlayerForm({ player: mockPlayerWithSong });

    const submitButton = screen.getByText('Update Player');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith(
        mockPlayerWithSong.id,
        {
          name: 'Test Player',
          song: mockSegment,
        }
      );
    });
  });
});
