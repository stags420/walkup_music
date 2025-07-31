import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
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
const mockOnEditSegment = jest.fn();
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
    // Given I have a player service that never resolves
    mockPlayerService.getAllPlayers.mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should show a loading state
    expect(screen.getByText('Loading players...')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should display players when loaded successfully', async () => {
    // Given I have a player service that returns players
    mockPlayerService.getAllPlayers.mockResolvedValue(mockPlayers);

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should display the players
    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display empty state when no players exist', async () => {
    // Given I have a player service that returns no players
    mockPlayerService.getAllPlayers.mockResolvedValue([]);

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should display an empty state message
    await waitFor(() => {
      expect(
        screen.getByText(
          'No players found. Add your first player to get started!'
        )
      ).toBeInTheDocument();
    });
  });

  it('should display error state when loading fails', async () => {
    // Given I have a player service that will fail to load
    mockPlayerService.getAllPlayers.mockRejectedValue(
      new Error('Failed to load')
    );

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should display an error message
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display player without song correctly', async () => {
    // Given I have a player without a song
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should display the player with a no song message
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('No walk-up song selected')).toBeInTheDocument();
  });

  it('should display player with song correctly', async () => {
    // Given I have a player with a song
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[1]]);

    // When I render the player list
    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    // Then it should display the player with song information
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('by Test Artist')).toBeInTheDocument();
    expect(screen.getByText('30s - 40s')).toBeInTheDocument();
  });

  it('should call onEditPlayer when edit button is clicked', async () => {
    // Given I have a player list with a player
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // When I click the edit button
    const editButton = screen.getByLabelText('Edit John Doe');
    fireEvent.click(editButton);

    // Then the onEditPlayer callback should be called with the player
    expect(mockOnEditPlayer).toHaveBeenCalledWith(mockPlayers[0]);
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    // Given I have a player list with a player
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // When I click the delete button
    const deleteButton = screen.getByLabelText('Delete John Doe');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Then a confirmation dialog should be shown
    expect(screen.getByText('Delete Player')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete John Doe?')
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should call onDeletePlayer when deletion is confirmed', async () => {
    // Given I have a player list with a player and confirmed deletion
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);
    mockOnDeletePlayer.mockResolvedValue(undefined);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // When I click the delete button and confirm
    const deleteButton = screen.getByLabelText('Delete John Doe');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Then the confirmation dialog should appear
    expect(screen.getByText('Delete Player')).toBeInTheDocument();

    // When I click the confirm button
    const confirmButton = screen.getByText('Confirm');
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    // Then the onDeletePlayer callback should be called
    await waitFor(() => {
      expect(mockOnDeletePlayer).toHaveBeenCalledWith('1');
    });
  });

  it('should not call onDeletePlayer when deletion is cancelled', async () => {
    // Given I have a player list with a player and cancelled deletion
    mockPlayerService.getAllPlayers.mockResolvedValue([mockPlayers[0]]);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // When I click the delete button but cancel
    const deleteButton = screen.getByLabelText('Delete John Doe');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Then the confirmation dialog should appear
    expect(screen.getByText('Delete Player')).toBeInTheDocument();

    // When I click the cancel button
    const cancelButton = screen.getByText('Cancel');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    // Then the onDeletePlayer callback should not be called
    expect(mockOnDeletePlayer).not.toHaveBeenCalled();

    // And the dialog should be closed
    expect(screen.queryByText('Delete Player')).not.toBeInTheDocument();
  });

  it('should retry loading when retry button is clicked', async () => {
    // Given I have a player service that fails first then succeeds
    mockPlayerService.getAllPlayers
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockPlayers);

    render(
      <PlayerList
        playerService={mockPlayerService}
        onEditPlayer={mockOnEditPlayer}
        onEditSegment={mockOnEditSegment}
        onDeletePlayer={mockOnDeletePlayer}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load')).toBeInTheDocument();
    });

    // When I click the retry button
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Then it should retry loading and display the players
    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    expect(mockPlayerService.getAllPlayers).toHaveBeenCalledTimes(2);
  });
});
