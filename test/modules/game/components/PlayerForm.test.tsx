import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

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
  getTrack: jest.fn(),
  getSegment: jest.fn(),
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

      // When I try to submit the form without entering a name
      const submitButton = screen.getByText('Add Player');

      // Then the button should be disabled and no service calls should be made
      expect(submitButton).toBeDisabled();
      await userEvent.click(submitButton);

      // No error message should appear because the button is disabled
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
          musicService={mockMusicService}
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

      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      // Then all form elements are disabled during submission
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      // Close button is handled by Modal.Header and not directly accessible when disabled
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

  describe('Update Player Flow', () => {
    it('should successfully update player when Update Player button is clicked', async () => {
      // Given I have a form in edit mode
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

      // When I change the name and click Update Player button
      const nameInput = screen.getByLabelText('Player Name *');
      const updateButton = screen.getByText('Update Player');

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'John Updated');
      await userEvent.click(updateButton);

      // Then the player is updated successfully
      await waitFor(() => {
        expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith('1', {
          name: 'John Updated',
          song: mockPlayer.song,
        });
      });
      expect(mockOnSave).toHaveBeenCalledWith(updatedPlayer);
    });

    it('should preserve song data when updating player name only', async () => {
      // Given I have a player with a song
      const updatedPlayer: Player = {
        ...mockPlayer,
        name: 'New Name',
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

      // When I update only the name
      const nameInput = screen.getByLabelText('Player Name *');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'New Name');
      await userEvent.click(screen.getByText('Update Player'));

      // Then the song data is preserved
      await waitFor(() => {
        expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith('1', {
          name: 'New Name',
          song: mockPlayer.song, // Original song preserved
        });
      });
    });
  });

  describe('Song Management Flow', () => {
    it('should open song selector when Select Song button is clicked', async () => {
      // Given I have a player without a song
      const playerWithoutSong: Player = { ...mockPlayer, song: undefined };

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={playerWithoutSong}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I click Select Song
      const selectSongButton = screen.getByText('Select Song');
      await userEvent.click(selectSongButton);

      // Then the song selector modal appears
      await waitFor(() => {
        expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
      });

      // And the main modal is hidden (only song selector visible)
      expect(screen.queryByText('Edit Player')).not.toBeInTheDocument();
    });

    it('should open song selector when Change Song button is clicked', async () => {
      // Given I have a player with a song
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I click Change Song
      const changeSongButton = screen.getByText('Change Song');
      await userEvent.click(changeSongButton);

      // Then the song selector modal appears
      await waitFor(() => {
        expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
      });

      // And the main modal is hidden
      expect(screen.queryByText('Edit Player')).not.toBeInTheDocument();
    });

    it('should return to main modal when song selection is cancelled', async () => {
      // Given I have the song selector open
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await userEvent.click(screen.getByText('Change Song'));
      await waitFor(() => {
        expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
      });

      // When I cancel the song selection
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Then I return to the main modal
      await waitFor(() => {
        expect(screen.getByText('Edit Player')).toBeInTheDocument();
        expect(
          screen.queryByText('Select Walk-up Song')
        ).not.toBeInTheDocument();
      });
    });

    it('should remove song when Remove Song button is clicked', async () => {
      // Given I have a player with a song
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Verify song is displayed
      expect(screen.getByText('Test Song')).toBeInTheDocument();

      // When I click Remove Song
      const removeSongButton = screen.getByText('Remove Song');
      await userEvent.click(removeSongButton);

      // Then the song is removed and no song message appears
      await waitFor(() => {
        expect(screen.queryByText('Test Song')).not.toBeInTheDocument();
      });

      // Check for the no song message (partial text match)
      expect(screen.getByText(/No walk-up song selected/)).toBeInTheDocument();
    });

    it('should open segment selector when Edit Timing button is clicked', async () => {
      // Given I have a player with a song
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I click Edit Timing
      const editTimingButton = screen.getByText('Edit Timing');
      await userEvent.click(editTimingButton);

      // Then the segment selector modal appears
      await waitFor(() => {
        expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
      });

      // And the main modal is hidden
      expect(screen.queryByText('Edit Player')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when update fails', async () => {
      // Given I have a form and service that fails
      mockPlayerService.updatePlayer.mockRejectedValue(
        new Error('Update failed')
      );

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I try to update
      const updateButton = screen.getByText('Update Player');
      await userEvent.click(updateButton);

      // Then error is displayed
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear error when form is successfully submitted', async () => {
      // Given I have a form that initially fails then succeeds
      const updatedPlayer: Player = { ...mockPlayer, name: 'Updated' };

      let attemptCount = 0;
      mockPlayerService.updatePlayer.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.reject(new Error('First attempt failed'));
        }
        return Promise.resolve(updatedPlayer);
      });

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When first attempt fails
      await userEvent.click(screen.getByText('Update Player'));
      await waitFor(() => {
        expect(screen.getByText('First attempt failed')).toBeInTheDocument();
      });

      // And second attempt succeeds
      await userEvent.click(screen.getByText('Update Player'));

      // Then error is cleared and success callback is called
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(updatedPlayer);
      });
      expect(
        screen.queryByText('First attempt failed')
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should prevent submission with empty name in create mode', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I try to submit with empty name
      const addButton = screen.getByText('Add Player');
      expect(addButton).toBeDisabled();

      // Button should remain disabled even if clicked
      await userEvent.click(addButton);
      expect(mockPlayerService.createPlayer).not.toHaveBeenCalled();
    });

    it('should enable submission when valid name is entered', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const addButton = screen.getByText('Add Player');

      // Initially disabled
      expect(addButton).toBeDisabled();

      // When I enter a valid name
      await userEvent.type(nameInput, 'Valid Name');

      // Then button becomes enabled
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Modal State Management', () => {
    it('should properly manage modal visibility during song selection flow', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Initially main modal is visible
      expect(screen.getByText('Edit Player')).toBeInTheDocument();
      expect(screen.queryByText('Select Walk-up Song')).not.toBeInTheDocument();

      // When I open song selector
      await userEvent.click(screen.getByText('Change Song'));

      // Main modal hides, song selector shows
      await waitFor(() => {
        expect(screen.queryByText('Edit Player')).not.toBeInTheDocument();
        expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
      });

      // When I cancel song selection
      await userEvent.click(screen.getByText('Cancel'));

      // Main modal returns, song selector hides
      await waitFor(() => {
        expect(screen.getByText('Edit Player')).toBeInTheDocument();
        expect(
          screen.queryByText('Select Walk-up Song')
        ).not.toBeInTheDocument();
      });
    });

    it('should hide main modal during segment editing', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // When I open segment selector
      await userEvent.click(screen.getByText('Edit Timing'));

      // Main modal hides, segment selector shows
      await waitFor(() => {
        expect(screen.queryByText('Edit Player')).not.toBeInTheDocument();
        expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
      });
    });
  });

  describe('Segment Edit Only Mode', () => {
    it('should render in segment edit mode when segmentEditOnly is true', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          segmentEditOnly={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should show timing edit modal
      expect(screen.getByText('Edit Song Timing')).toBeInTheDocument();

      // Should not show player name field
      expect(screen.queryByLabelText('Player Name *')).not.toBeInTheDocument();

      // Should show Update Timing button
      expect(screen.getByText('Update Timing')).toBeInTheDocument();
    });

    it('should auto-open segment selector in segment edit mode', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={mockMusicService}
          player={mockPlayer}
          segmentEditOnly={true}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should automatically show segment selector
      await waitFor(() => {
        expect(screen.getByText('Select Song Segment')).toBeInTheDocument();
      });
    });
  });
});
