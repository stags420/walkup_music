import { render, screen, fireEvent } from '@testing-library/react';
import { OrderBuilder } from '@/modules/game/components/OrderBuilder';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';

// Mock PlayerCard component
jest.mock('@/modules/core/components', () => ({
  PlayerCard: jest.fn(({ player }) => (
    <div data-testid={`player-card-${player.id}`}>
      <span>{player.name}</span>
    </div>
  )),
}));

describe('OrderBuilder', () => {
  let mockMusicService: jest.Mocked<MusicService>;
  let mockPlayerService: jest.Mocked<PlayerService>;
  let mockOnLineupChange: jest.Mock;

  const mockLineupPlayers: Player[] = [
    {
      id: '1',
      name: 'Batter 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Batter 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAvailablePlayers: Player[] = [
    {
      id: '3',
      name: 'Bench Player 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      name: 'Bench Player 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockMusicService = {
      searchTracks: jest.fn(),
      playTrack: jest.fn(),
      pausePlayback: jest.fn(),
      resumePlayback: jest.fn(),
      stopPlayback: jest.fn(),
      seekToPosition: jest.fn(),
      getCurrentTrack: jest.fn(),
      getPlaybackState: jest.fn(),
      isPlaybackReady: jest.fn(),
    } as unknown as jest.Mocked<MusicService>;

    mockPlayerService = {
      getAllPlayers: jest.fn(),
      createPlayer: jest.fn(),
      updatePlayer: jest.fn(),
      deletePlayer: jest.fn(),
      getPlayer: jest.fn(),
    } as unknown as jest.Mocked<PlayerService>;

    mockOnLineupChange = jest.fn();
  });

  const renderComponent = (
    lineup = mockLineupPlayers,
    available = mockAvailablePlayers
  ) => {
    return render(
      <OrderBuilder
        lineup={lineup}
        availablePlayers={available}
        onLineupChange={mockOnLineupChange}
        musicService={mockMusicService}
        playerService={mockPlayerService}
      />
    );
  };

  it('renders both column headers', () => {
    renderComponent();

    expect(screen.getByText('Batting Lineup')).toBeInTheDocument();
    expect(screen.getByText('Bench')).toBeInTheDocument();
  });

  it('displays correct player counts', () => {
    renderComponent();

    const playerCounts = screen.getAllByText('2 players');
    expect(playerCounts).toHaveLength(2); // One for lineup, one for bench
  });

  it('renders lineup players with batting positions', () => {
    renderComponent();

    expect(screen.getByTestId('player-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-2')).toBeInTheDocument();
    expect(screen.getByText('Batter 1')).toBeInTheDocument();
    expect(screen.getByText('Batter 2')).toBeInTheDocument();
  });

  it('renders bench players', () => {
    renderComponent();

    expect(screen.getByTestId('player-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-4')).toBeInTheDocument();
    expect(screen.getByText('Bench Player 1')).toBeInTheDocument();
    expect(screen.getByText('Bench Player 2')).toBeInTheDocument();
  });

  it('renders player cards with player names', () => {
    renderComponent();

    expect(screen.getByText('Batter 1')).toBeInTheDocument();
    expect(screen.getByText('Batter 2')).toBeInTheDocument();
    expect(screen.getByText('Bench Player 1')).toBeInTheDocument();
    expect(screen.getByText('Bench Player 2')).toBeInTheDocument();
  });

  it('shows empty message for empty lineup', () => {
    renderComponent([], mockAvailablePlayers);

    expect(
      screen.getByText(
        /Click the \+ button next to players to add them to the batting lineup/
      )
    ).toBeInTheDocument();
  });

  it('shows empty message for empty bench', () => {
    renderComponent(mockLineupPlayers, []);

    expect(
      screen.getByText(/All players are in the lineup/)
    ).toBeInTheDocument();
  });

  it('shows add buttons for bench players', () => {
    renderComponent();

    const addButtons = screen.getAllByText('+');
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('shows remove buttons for lineup players', () => {
    renderComponent();

    const removeButtons = screen.getAllByText('−');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('shows move buttons for lineup players', () => {
    renderComponent();

    const moveUpButtons = screen.getAllByText('↑');
    const moveDownButtons = screen.getAllByText('↓');
    expect(moveUpButtons.length).toBeGreaterThan(0);
    expect(moveDownButtons.length).toBeGreaterThan(0);
  });

  it('handles adding player to lineup', () => {
    renderComponent();

    const addButtons = screen.getAllByText('+');
    fireEvent.click(addButtons[0]);

    expect(mockOnLineupChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '3' })]),
      expect.arrayContaining([expect.objectContaining({ id: '4' })])
    );
  });

  it('handles removing player from lineup', () => {
    renderComponent();

    const removeButtons = screen.getAllByText('−');
    fireEvent.click(removeButtons[0]);

    expect(mockOnLineupChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '2' })]),
      expect.arrayContaining([expect.objectContaining({ id: '1' })])
    );
  });

  it('shows correct lineup count with empty lineup', () => {
    renderComponent([], mockAvailablePlayers);

    expect(screen.getByText('0 players')).toBeInTheDocument();
  });

  it('shows correct bench count with empty bench', () => {
    renderComponent(mockLineupPlayers, []);

    expect(screen.getByText('2 players')).toBeInTheDocument(); // Lineup
    expect(screen.getByText('0 players')).toBeInTheDocument(); // Bench
  });
});
