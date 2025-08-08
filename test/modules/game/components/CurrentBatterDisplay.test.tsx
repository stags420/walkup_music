import { render, screen, waitFor, act } from '@testing-library/react';
import { CurrentBatterDisplay } from '@/modules/game/components/CurrentBatterDisplay';
import type { LineupService } from '@/modules/game/services/LineupService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { Player } from '@/modules/game/models/Player';

// Mock the services
const mockLineupService = {
  getCurrentBatter: jest.fn(),
  getOnDeckBatter: jest.fn(),
  getInTheHoleBatter: jest.fn(),
  playWalkUpMusic: jest.fn(),
  stopMusic: jest.fn(),
  createBattingOrder: jest.fn(),
  updateBattingOrder: jest.fn(),
  nextBatter: jest.fn(),
  startGame: jest.fn(),
  getGameState: jest.fn(),
  loadGameState: jest.fn(),
  endGame: jest.fn(),
  isGameInProgress: jest.fn(),
  getCurrentBattingOrder: jest.fn(),
} as unknown as jest.Mocked<LineupService>;

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

// Mock the PlayerForm and SegmentSelector components
jest.mock('@/modules/game/components/PlayerForm', () => ({
  PlayerForm: ({
    onSave,
    onCancel,
  }: {
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div data-testid="player-form">
      <button onClick={onSave}>Save Player</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('@/modules/music', () => ({
  SegmentSelector: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (segment: unknown) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="segment-selector">
      <button onClick={() => onConfirm({ startTime: 10, duration: 30 })}>
        Confirm Segment
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('CurrentBatterDisplay', () => {
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
        previewUrl: 'https://example.com/preview.mp3',
        durationMs: 180000,
        uri: 'spotify:track:track1',
      },
      startTime: 10,
      duration: 30,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getPlayer to return the mock player
    mockPlayerService.getPlayer.mockResolvedValue(mockPlayer);
  });

  it('should render edit button for current batter', async () => {
    mockLineupService.getCurrentBatter.mockResolvedValue(mockPlayer);
    mockLineupService.getOnDeckBatter.mockResolvedValue(null);
    mockLineupService.getInTheHoleBatter.mockResolvedValue(null);

    await act(async () => {
      render(
        <CurrentBatterDisplay
          lineupService={mockLineupService}
          playerService={mockPlayerService}
          musicService={mockMusicService}
        />
      );
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that edit button is present
    expect(screen.getByLabelText('Edit player')).toBeInTheDocument();
  });

  it('should have edit button for current batter', async () => {
    mockLineupService.getCurrentBatter.mockResolvedValue(mockPlayer);
    mockLineupService.getOnDeckBatter.mockResolvedValue(null);
    mockLineupService.getInTheHoleBatter.mockResolvedValue(null);

    await act(async () => {
      render(
        <CurrentBatterDisplay
          lineupService={mockLineupService}
          playerService={mockPlayerService}
          musicService={mockMusicService}
        />
      );
    });

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that edit button is present
    expect(screen.getByLabelText('Edit player')).toBeInTheDocument();
  });

  it('should render edit buttons for secondary batters', async () => {
    mockLineupService.getCurrentBatter.mockResolvedValue(null);
    mockLineupService.getOnDeckBatter.mockResolvedValue(mockPlayer);
    mockLineupService.getInTheHoleBatter.mockResolvedValue(mockPlayer);

    await act(async () => {
      render(
        <CurrentBatterDisplay
          lineupService={mockLineupService}
          playerService={mockPlayerService}
          musicService={mockMusicService}
        />
      );
    });

    // Wait for the component to load
    await waitFor(() => {
      const playerNames = screen.getAllByText('John Doe');
      expect(playerNames).toHaveLength(2);
    });

    // Check that edit buttons are present for both secondary batters
    const editButtons = screen.getAllByLabelText('Edit player');
    expect(editButtons).toHaveLength(2);
  });
});
