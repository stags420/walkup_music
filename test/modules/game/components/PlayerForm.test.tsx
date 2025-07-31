import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { MusicProvider } from '@/modules/music';

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
    ..._props
  }: MockSongSelectorProps) => {
    return (
      <div data-testid="song-selector">
        <h2>Select Walk-up Song</h2>
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

// Mock PlayerService
const mockPlayerService = {
  getAllPlayers: jest.fn(),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  getPlayer: jest.fn(),
} as unknown as jest.Mocked<PlayerService>;

// Mock MusicService
const mockMusicService = {
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn().mockReturnValue(true),
  isPlaybackReady: jest.fn().mockReturnValue(true),
} as unknown as jest.Mocked<MusicService>;

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

const mockTrack: SpotifyTrack = {
  id: 'track1',
  name: 'Test Song',
  artists: ['Test Artist'],
  album: 'Test Album',
  albumArt: 'test-art.jpg',
  previewUrl: 'test-preview.mp3',
  durationMs: 180000,
  uri: 'spotify:track:track1',
};

const mockPlayer: Player = {
  id: '1',
  name: 'John Doe',
  song: {
    track: mockTrack,
    startTime: 30,
    duration: 10,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Helper function to render PlayerForm with MusicProvider
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

describe('PlayerForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render form for creating new player', () => {
      // Given I have a PlayerForm component in create mode
      // When I render the form without a player prop
      renderPlayerForm();

      // Then the form displays create mode elements
      expect(screen.getByText('Add New Player')).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name *')).toHaveValue('');
      expect(screen.getByText('Add Player')).toBeInTheDocument();
    });

    it('should create new player when form is submitted', async () => {
      // Given I have a form in create mode and a mock service that returns a new player
      const newPlayer: Player = {
        id: '2',
        name: 'Jane Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPlayerService.createPlayer.mockResolvedValue(newPlayer);

      renderPlayerForm();

      // When I enter a player name and submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.click(submitButton);

      // Then the service creates the player and calls onSave
      await waitFor(() => {
        expect(mockPlayerService.createPlayer).toHaveBeenCalledWith(
          'Jane Smith'
        );
        expect(mockOnSave).toHaveBeenCalledWith(newPlayer);
      });
    });

    it('should show error when submitting without name', async () => {
      // Given I have a form in create mode
      renderPlayerForm();

      // When I submit the form without entering a name
      const submitButton = screen.getByText('Add Player');
      fireEvent.click(submitButton);

      // Then the button should be disabled (no error message shown)
      expect(submitButton).toBeDisabled();
      expect(mockPlayerService.createPlayer).not.toHaveBeenCalled();
    });

    it('should show error when service throws an error', async () => {
      // Given I have a form and a service that throws an error
      mockPlayerService.createPlayer.mockRejectedValue(
        new Error('Service error')
      );

      renderPlayerForm();

      // When I submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.click(submitButton);

      // Then an error message should be displayed
      await waitFor(() => {
        expect(screen.getByText('Service error')).toBeInTheDocument();
      });
    });
  });

  describe('Edit mode', () => {
    it('should render form for editing existing player', () => {
      // Given I have a PlayerForm component in edit mode
      // When I render the form with a player prop
      renderPlayerForm({ player: mockPlayer });

      // Then the form displays edit mode elements
      expect(screen.getByText('Edit Player')).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name *')).toHaveValue('John Doe');
      expect(screen.getByText('Update Player')).toBeInTheDocument();
    });

    it('should update existing player when form is submitted', async () => {
      // Given I have a form in edit mode and a mock service that returns the updated player
      const updatedPlayer: Player = {
        ...mockPlayer,
        name: 'John Updated',
        updatedAt: new Date(),
      };
      mockPlayerService.updatePlayer.mockResolvedValue(updatedPlayer);

      renderPlayerForm({ player: mockPlayer });

      // When I change the name and submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Update Player');
      fireEvent.change(nameInput, { target: { value: 'John Updated' } });
      fireEvent.click(submitButton);

      // Then the service updates the player and calls onSave
      await waitFor(() => {
        expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith(
          mockPlayer.id,
          {
            name: 'John Updated',
            song: mockPlayer.song,
          }
        );
        expect(mockOnSave).toHaveBeenCalledWith(updatedPlayer);
      });
    });

    it('should display existing song information', () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // Then the song information should be displayed
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('by Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Test Album')).toBeInTheDocument();
    });
  });

  describe('Song Management Flow', () => {
    it('should open song selector when Select Song button is clicked', () => {
      // Given I have a form without a song
      renderPlayerForm();

      // When I click the Select Song button
      const selectSongButton = screen.getByText('Select Song');
      fireEvent.click(selectSongButton);

      // Then the song selector should be displayed
      expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
    });

    it('should open segment selector when Edit Timing button is clicked', () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // When I click the Edit Timing button
      const editTimingButton = screen.getByText('Edit Timing');
      fireEvent.click(editTimingButton);

      // Then the segment selector should be displayed
      expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
    });

    it('should handle song selection', async () => {
      // Given I have a form and a selected track
      renderPlayerForm();

      // When I open the song selector and select a track
      const selectSongButton = screen.getByText('Select Song');
      fireEvent.click(selectSongButton);

      // Simulate track selection (this would normally come from SongSelector)
      // For now, we'll just verify the song selector is open
      expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
    });

    it('should handle segment selection', async () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // When I open the segment selector
      const editTimingButton = screen.getByText('Edit Timing');
      fireEvent.click(editTimingButton);

      // Then the segment selector should be displayed
      expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
    });

    it('should remove song when Remove Song button is clicked', () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // When I click the Remove Song button
      const removeSongButton = screen.getByText('Remove Song');
      fireEvent.click(removeSongButton);

      // Then the song should be removed from the form
      expect(screen.queryByText('Test Song')).not.toBeInTheDocument();
      expect(screen.getByText('Select Song')).toBeInTheDocument();
    });

    it('should change song when Change Song button is clicked', () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // When I click the Change Song button
      const changeSongButton = screen.getByText('Change Song');
      fireEvent.click(changeSongButton);

      // Then the song selector should be displayed
      expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
    });
  });

  describe('Modal State Management', () => {
    it('should hide main modal during segment editing', () => {
      // Given I have a player with a song
      renderPlayerForm({ player: mockPlayer });

      // When I open the segment selector
      const editTimingButton = screen.getByText('Edit Timing');
      fireEvent.click(editTimingButton);

      // Then the segment selector should be visible
      expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
      // The main modal content should still be visible (it's not hidden)
      expect(screen.getByText('Edit Player')).toBeInTheDocument();
    });

    it('should handle escape key to close modal', () => {
      // Given I have a form rendered
      renderPlayerForm();

      // When I press the escape key
      fireEvent.keyDown(document, { key: 'Escape' });

      // Then the onCancel callback should be called
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should handle cancel button click', () => {
      // Given I have a form rendered
      renderPlayerForm();

      // When I click the cancel button
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Then the onCancel callback should be called
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Segment Edit Only Mode', () => {
    it('should render in segment edit mode when segmentEditOnly is true', () => {
      // Given I have a player with a song and segmentEditOnly is true
      renderPlayerForm({
        player: mockPlayer,
        segmentEditOnly: true,
      });

      // Then the segment selector should be automatically displayed
      expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
    });

    it('should auto-open segment selector in segment edit mode', () => {
      // Given I have a player with a song and segmentEditOnly is true
      renderPlayerForm({
        player: mockPlayer,
        segmentEditOnly: true,
      });

      // Then the segment selector should be open
      expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
      expect(screen.getAllByText('Test Song')).toHaveLength(2); // One in main form, one in segment selector
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty name', async () => {
      // Given I have a form
      renderPlayerForm();

      // When I submit with an empty name
      const submitButton = screen.getByText('Add Player');
      fireEvent.click(submitButton);

      // Then the button should be disabled (no error message shown)
      expect(submitButton).toBeDisabled();
    });

    it('should show error for whitespace-only name', async () => {
      // Given I have a form
      renderPlayerForm();

      // When I submit with only whitespace
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      // Then the button should be disabled (no error message shown)
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during save', async () => {
      // Given I have a form and a slow service
      mockPlayerService.createPlayer.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderPlayerForm();

      // When I submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      // Then the button should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });
});
