import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { GameMode } from '@/modules/game/components/GameMode';
import { LineupService } from '@/modules/game/services/LineupService';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';

// Mock the LineupService
const mockLineupService = {
  getCurrentBatter: jest.fn().mockResolvedValue(null),
  getOnDeckBatter: jest.fn().mockResolvedValue(null),
  getInTheHoleBatter: jest.fn().mockResolvedValue(null),
  nextBatter: jest.fn(),
  playWalkUpMusic: jest.fn(),
  stopMusic: jest.fn(),
  startGame: jest.fn(),
  endGame: jest.fn(),
  isGameInProgress: jest.fn(),
  getCurrentBattingOrder: jest.fn(),
  createBattingOrder: jest.fn(),
  updateBattingOrder: jest.fn(),
  loadGameState: jest.fn(),
} as jest.Mocked<LineupService>;

// Mock the PlayerService
const mockPlayerService = {
  getAllPlayers: jest.fn(),
  getPlayer: jest.fn(),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  storageKey: 'players',
  storageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
} as unknown as jest.Mocked<PlayerService>;

// Mock the MusicService
const mockMusicService = {
  searchTracks: jest.fn(),
  playTrack: jest.fn(),
  previewTrack: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  getCurrentTrack: jest.fn(),
  isPlaybackReady: jest.fn(),
  getCurrentState: jest.fn(),
  isPlaybackConnected: jest.fn(),
} as unknown as jest.Mocked<MusicService>;

describe('GameMode', () => {
  const mockOnEndGame = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render next batter and end game buttons', () => {
    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    expect(screen.getByText('Next Batter')).toBeInTheDocument();
    expect(screen.getByText('End Game')).toBeInTheDocument();
  });

  it('should show confirmation dialog when end game button is clicked', () => {
    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    const endGameButtons = screen.getAllByRole('button', { name: 'End Game' });
    const mainEndGameButton = endGameButtons[0]; // The main button
    fireEvent.click(mainEndGameButton);

    expect(
      screen.getByText(
        'End the current game? This will clear all game progress.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'End Game' })).toHaveLength(2); // Main button + confirm button
  });

  it('should call onEndGame when end game is confirmed', () => {
    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    const endGameButtons = screen.getAllByRole('button', { name: 'End Game' });
    const mainEndGameButton = endGameButtons[0]; // The main button
    fireEvent.click(mainEndGameButton);

    const confirmButtons = screen.getAllByRole('button', { name: 'End Game' });
    const confirmButton = confirmButtons[1]; // The confirm button in the modal
    fireEvent.click(confirmButton);

    expect(mockLineupService.endGame).toHaveBeenCalled();
    expect(mockOnEndGame).toHaveBeenCalled();
  });

  it('should close confirmation dialog when cancel is clicked', () => {
    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    const endGameButtons = screen.getAllByRole('button', { name: 'End Game' });
    const mainEndGameButton = endGameButtons[0]; // The main button
    fireEvent.click(mainEndGameButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(
      screen.queryByText(
        'End the current game? This will clear all game progress.'
      )
    ).not.toBeInTheDocument();
    expect(mockLineupService.endGame).not.toHaveBeenCalled();
    expect(mockOnEndGame).not.toHaveBeenCalled();
  });

  it('should call nextBatter when next batter button is clicked', async () => {
    // Mock nextBatter to return a resolved promise
    mockLineupService.nextBatter.mockResolvedValue(undefined);

    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    const nextBatterButton = screen.getByText('Next Batter');

    await act(async () => {
      fireEvent.click(nextBatterButton);
    });

    await waitFor(() => {
      expect(mockLineupService.nextBatter).toHaveBeenCalled();
    });
  });

  it('should render CurrentBatterDisplay component', () => {
    render(
      <GameMode
        lineupService={mockLineupService}
        playerService={mockPlayerService}
        musicService={mockMusicService}
        onEndGame={mockOnEndGame}
      />
    );

    // Check that CurrentBatterDisplay is rendered by looking for its content
    expect(screen.getByText('Current Batter')).toBeInTheDocument();
  });
});
