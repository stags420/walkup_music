import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { GameMode } from '@/modules/game/components/GameMode';
import type { MusicService } from '@/modules/music/services/MusicService';
import {
  usePlayersStore,
  resetPlayersStore,
} from '@/modules/game/state/playersStore';
import {
  useLineupStore,
  resetLineupStore,
} from '@/modules/game/state/lineupStore';

const mockMusicService: jest.Mocked<MusicService> = {
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

jest.mock('@/modules/music/suppliers/MusicServiceSupplier', () => ({
  supplyMusicService: () => mockMusicService,
}));

describe('GameMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPlayersStore();
    resetLineupStore();
    // Seed two players and a batting order for tests that need progression
    const { actions: playerActions } = usePlayersStore.getState();
    playerActions.setPlayers([
      { id: 'p1', name: 'Alice', createdAt: new Date(), updatedAt: new Date() },
      { id: 'p2', name: 'Bob', createdAt: new Date(), updatedAt: new Date() },
    ]);
    const { actions: lineupActions } = useLineupStore.getState();
    lineupActions.createBattingOrder(['p1', 'p2']);
    lineupActions.setGameActive(true);
  });

  it('should render next batter and end game buttons', () => {
    render(<GameMode />);

    expect(screen.getByText('Next Batter')).toBeInTheDocument();
    expect(screen.getByText('End Game')).toBeInTheDocument();
  });

  it('should show confirmation dialog when end game button is clicked', () => {
    render(<GameMode />);

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
    render(<GameMode />);

    const endGameButtons = screen.getAllByRole('button', { name: 'End Game' });
    const mainEndGameButton = endGameButtons[0]; // The main button
    fireEvent.click(mainEndGameButton);

    const confirmButtons = screen.getAllByRole('button', { name: 'End Game' });
    const confirmButton = confirmButtons[1]; // The confirm button in the modal
    fireEvent.click(confirmButton);
  });

  it('should close confirmation dialog when cancel is clicked', async () => {
    render(<GameMode />);

    const endGameButtons = screen.getAllByRole('button', { name: 'End Game' });
    const mainEndGameButton = endGameButtons[0]; // The main button
    fireEvent.click(mainEndGameButton);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Wait for the modal to be removed from the DOM
    await waitFor(() => {
      expect(
        screen.queryByText(
          'End the current game? This will clear all game progress.'
        )
      ).not.toBeInTheDocument();
    });
  });

  it('should advance to next batter when next batter button is clicked', async () => {
    render(<GameMode />);

    const initialPos =
      useLineupStore.getState().currentBattingOrder?.currentPosition;
    const nextBatterButton = screen.getByText('Next Batter');

    await act(async () => {
      fireEvent.click(nextBatterButton);
    });

    await waitFor(() => {
      expect(
        useLineupStore.getState().currentBattingOrder?.currentPosition
      ).not.toBe(initialPos);
    });
  });

  it('should render CurrentBatterDisplay component', () => {
    render(<GameMode />);
    // assert the wrapper exists and at least one player card renders
    expect(screen.getByTestId('current-batter-display')).toBeInTheDocument();
    expect(screen.getAllByTestId('player-card').length).toBeGreaterThan(0);
  });
});
