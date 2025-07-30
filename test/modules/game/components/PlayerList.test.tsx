import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerList } from '@/modules/game/components/PlayerList';
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

const mockOnEditPlayer = jest.fn();
const mockOnDeletePlayer = jest.fn();

// Mock players data
const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'John Doe',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Jane Smith',
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
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('PlayerList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', async () => {
    mockPlayerService.getAllPlayers.mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    expect(screen.getByText('Loading players...')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should display players when loaded successfully', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display empty state when no players exist', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'No players found. Add your first player to get started!'
        )
      ).toBeInTheDocument();
    });
  });

  it('should display error state when loading fails', async () => {
    mockPlayerService.getAllPlayers.mockRejectedValue(
      new Error('Failed to load')
    );

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display player without song correctly', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('No walk-up song selected')).toBeInTheDocument();
  });

  it('should display player with song correctly', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[1]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('by Test Artist')).toBeInTheDocument();
    expect(screen.getByText('30s - 40s')).toBeInTheDocument();
  });

  it('should call onEditPlayer when edit button is clicked', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit John Doe');
    fireEvent.click(editButton);

    expect(mockOnEditPlayer).toHaveBeenCalledWith(mockPlayers[0]);
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    // Mock window.confirm
    const mockConfirm = jest.spyOn(globalThis, 'confirm').mockReturnValue(true);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete John Doe');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this player?'
    );

    mockConfirm.mockRestore();
  });

  it('should call onDeletePlayer when deletion is confirmed', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);
    mockOnDeletePlayer.mockResolvedValue(undefined);

    const mockConfirm = jest.spyOn(globalThis, 'confirm').mockReturnValue(true);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete John Doe');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDeletePlayer).toHaveBeenCalledWith('1');
    });

    mockConfirm.mockRestore();
  });

  it('should not call onDeletePlayer when deletion is cancelled', async () => {
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    const mockConfirm = jest
      .spyOn(globalThis, 'confirm')
      .mockReturnValue(false);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete John Doe');
    fireEvent.click(deleteButton);

    expect(mockOnDeletePlayer).not.toHaveBeenCalled();

    mockConfirm.mockRestore();
  });

  it('should retry loading when retry button is clicked', async () => {
    mockPlayerService.getAllPlayers
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockPlayers);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    expect(mockPlayerService.getAllPlayers).toHaveBeenCalledTimes(2);
  });
});
