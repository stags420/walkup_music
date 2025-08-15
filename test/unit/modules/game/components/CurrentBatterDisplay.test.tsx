import { render, screen, waitFor, act } from '@testing-library/react';
import { CurrentBatterDisplay } from '@/modules/game/components/CurrentBatterDisplay';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { Player } from '@/modules/game/models/Player';
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
        durationMs: 180_000,
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
    resetPlayersStore();
    resetLineupStore();
  });

  it('should render edit button for current batter', async () => {
    usePlayersStore.getState().actions.setPlayers([mockPlayer]);
    const { actions: lineupActions } = useLineupStore.getState();
    lineupActions.createBattingOrder(['1']);
    lineupActions.setGameActive(true);

    await act(async () => {
      render(<CurrentBatterDisplay />);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Edit player')).toBeInTheDocument();
  });

  it('should render edit buttons for secondary batters', async () => {
    const player2: Player = { ...mockPlayer, id: '2', name: 'Jane Doe' };
    usePlayersStore.getState().actions.setPlayers([mockPlayer, player2]);
    const { actions: lineupActions } = useLineupStore.getState();
    lineupActions.createBattingOrder(['2', '1']);
    lineupActions.setGameActive(true);

    await act(async () => {
      render(<CurrentBatterDisplay />);
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText('Edit player');
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
  });
});
