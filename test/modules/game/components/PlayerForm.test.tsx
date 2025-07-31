import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';

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
  search: jest.fn(),
  getTrack: jest.fn(),
  getSegment: jest.fn(),
} as unknown as jest.Mocked<MusicService>;

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

const mockPlayer: Player = {
  id: '1',
  name: 'John Doe',
  song: {
    track: {
      id: 'track1',
      name: 'Test Song',
      artists: ['Test Artist'],
      album: 'Test Album',
      albumArt: 'test-art.jpg',
      previewUrl: 'test-preview.mp3',
      durationMs: 180000,
      uri: 'spotify:track:track1',
    },
    startTime: 30,
    duration: 10,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('PlayerForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create mode', () => {
    it('should render form for creating new player', () => {
      // Given I have a PlayerForm component in create mode
      // When I render the form without a player prop
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

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

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

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
      });
      expect(mockOnSave).toHaveBeenCalledWith(newPlayer);
    });

    it('should show error for empty name', async () => {
      // Given I have a form in create mode
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I submit the form without entering a name
      fireEvent.submit(screen.getByRole('form'));

      // Then an error message is displayed and no service calls are made
      await waitFor(() => {
        expect(screen.getByText('Player name is required')).toBeInTheDocument();
      });
      expect(mockPlayerService.createPlayer).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('should render form for editing existing player', () => {
      // Given I have an existing player
      // When I render the form with a player prop
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Then the form displays edit mode elements with player data
      expect(screen.getByText('Edit Player')).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name *')).toHaveValue('John Doe');
      expect(screen.getByText('Update Player')).toBeInTheDocument();
    });

    it('should display current song information', () => {
      // Given I have a player with song information
      // When I render the form in edit mode
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Then the song details are displayed
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('by Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Plays from 30s for 10s')).toBeInTheDocument();
    });

    it('should update existing player when form is submitted', async () => {
      // Given I have a form in edit mode and a mock service that returns an updated player
      const updatedPlayer: Player = {
        ...mockPlayer,
        name: 'John Updated',
        updatedAt: new Date(),
      };
      mockPlayerService.updatePlayer.mockResolvedValue(updatedPlayer);

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I change the player name and submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Update Player');
      fireEvent.change(nameInput, { target: { value: 'John Updated' } });
      fireEvent.click(submitButton);

      // Then the service updates the player and calls onSave
      await waitFor(() => {
        expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith('1', {
          name: 'John Updated',
          song: mockPlayer.song, // Song is preserved in edit mode
        });
      });
      expect(mockOnSave).toHaveBeenCalledWith(updatedPlayer);
    });

    it('should show no song message for player without song', () => {
      // Given I have a player without a song
      const playerWithoutSong: Player = {
        ...mockPlayer,
        song: undefined,
      };

      // When I render the form in edit mode
      render(
        <PlayerForm
          playerService={mockPlayerService}
          player={playerWithoutSong}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Then a no song message is displayed
      expect(
        screen.getByText(
          'No walk-up song selected. Choose a song to play when this player bats.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Common functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      // Given I have a rendered form
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I click the cancel button
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Then the onCancel callback is called
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when close button is clicked', () => {
      // Given I have a rendered form
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I click the close button
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Then the onCancel callback is called
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable form during submission', async () => {
      // Given I have a form and a service that never resolves
      mockPlayerService.createPlayer.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      const cancelButton = screen.getByText('Cancel');
      const closeButton = screen.getByLabelText('Close');

      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      // Then all form elements are disabled during submission
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });

    it('should show error when service call fails', async () => {
      // Given I have a form and a service that throws an error
      mockPlayerService.createPlayer.mockRejectedValue(
        new Error('Service error')
      );

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I submit the form
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      // Then an error message is displayed and onSave is not called
      await waitFor(() => {
        expect(screen.getByText('Service error')).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should trim whitespace from player name', async () => {
      // Given I have a form and a service that returns a new player
      const newPlayer: Player = {
        id: '2',
        name: 'Jane Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPlayerService.createPlayer.mockResolvedValue(newPlayer);

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I enter a name with whitespace and submit
      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      fireEvent.change(nameInput, { target: { value: '  Jane Smith  ' } });
      fireEvent.click(submitButton);

      // Then the service is called with the trimmed name
      await waitFor(() => {
        expect(mockPlayerService.createPlayer).toHaveBeenCalledWith(
          'Jane Smith'
        );
      });
    });

    it('should disable submit button when name is empty', () => {
      // Given I have a rendered form
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When the form loads with no name
      const submitButton = screen.getByText('Add Player');
      // Then the submit button is disabled
      expect(submitButton).toBeDisabled();

      // When I enter a name
      const nameInput = screen.getByLabelText('Player Name *');
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      // Then the submit button is enabled
      expect(submitButton).not.toBeDisabled();

      // When I clear the name
      fireEvent.change(nameInput, { target: { value: '' } });
      // Then the submit button is disabled again
      expect(submitButton).toBeDisabled();
    });

    it('should reset form when player prop changes', () => {
      // Given I have a form in create mode with a changed name
      const { rerender } = render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      expect(nameInput).toHaveValue('Changed Name');

      // When I rerender with a player prop
      rerender(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Then the form resets to show the player's name
      expect(nameInput).toHaveValue('John Doe');
    });
  });
});
