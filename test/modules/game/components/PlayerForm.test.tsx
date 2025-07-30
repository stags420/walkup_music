import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';

// Mock PlayerService
const mockPlayerService = {
  getAllPlayers: jest.fn(),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  getPlayer: jest.fn(),
} as unknown as jest.Mocked<PlayerService>;

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
      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Add New Player')).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name *')).toHaveValue('');
      expect(screen.getByText('Add Player')).toBeInTheDocument();
    });

    it('should create new player when form is submitted', async () => {
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
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');

      fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPlayerService.createPlayer).toHaveBeenCalledWith(
          'Jane Smith'
        );
      });

      expect(mockOnSave).toHaveBeenCalledWith(newPlayer);
    });

    it('should show error for empty name', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Player name is required')).toBeInTheDocument();
      });

      expect(mockPlayerService.createPlayer).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    it('should render form for editing existing player', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Player')).toBeInTheDocument();
      expect(screen.getByLabelText('Player Name *')).toHaveValue('John Doe');
      expect(screen.getByText('Update Player')).toBeInTheDocument();
    });

    it('should display current song information', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('by Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Plays from 30s for 10s')).toBeInTheDocument();
    });

    it('should update existing player when form is submitted', async () => {
      const updatedPlayer: Player = {
        ...mockPlayer,
        name: 'John Updated',
        updatedAt: new Date(),
      };

      mockPlayerService.updatePlayer.mockResolvedValue(updatedPlayer);

      render(
        <PlayerForm
          playerService={mockPlayerService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Update Player');

      fireEvent.change(nameInput, { target: { value: 'John Updated' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPlayerService.updatePlayer).toHaveBeenCalledWith('1', {
          name: 'John Updated',
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(updatedPlayer);
    });

    it('should show no song message for player without song', () => {
      const playerWithoutSong: Player = {
        ...mockPlayer,
        song: undefined,
      };

      render(
        <PlayerForm
          playerService={mockPlayerService}
          player={playerWithoutSong}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(
          'No song selected. Song selection will be available in a future update.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Common functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when close button is clicked', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByLabelText('Close form');
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable form during submission', async () => {
      mockPlayerService.createPlayer.mockImplementation(
        () => new Promise(() => {})
      ); // Never resolves

      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');
      const cancelButton = screen.getByText('Cancel');
      const closeButton = screen.getByLabelText('Close form');

      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(closeButton).toBeDisabled();
    });

    it('should show error when service call fails', async () => {
      mockPlayerService.createPlayer.mockRejectedValue(
        new Error('Service error')
      );

      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');

      fireEvent.change(nameInput, { target: { value: 'Test Player' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Service error')).toBeInTheDocument();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should trim whitespace from player name', async () => {
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
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      const submitButton = screen.getByText('Add Player');

      fireEvent.change(nameInput, { target: { value: '  Jane Smith  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPlayerService.createPlayer).toHaveBeenCalledWith(
          'Jane Smith'
        );
      });
    });

    it('should disable submit button when name is empty', () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByText('Add Player');
      expect(submitButton).toBeDisabled();

      const nameInput = screen.getByLabelText('Player Name *');
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      expect(submitButton).not.toBeDisabled();

      fireEvent.change(nameInput, { target: { value: '' } });
      expect(submitButton).toBeDisabled();
    });

    it('should reset form when player prop changes', () => {
      const { rerender } = render(
        <PlayerForm
          playerService={mockPlayerService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText('Player Name *');
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      expect(nameInput).toHaveValue('Changed Name');

      rerender(
        <PlayerForm
          playerService={mockPlayerService}
          player={mockPlayer}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(nameInput).toHaveValue('John Doe');
    });
  });
});
