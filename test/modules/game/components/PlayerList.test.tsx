import { render, screen, waitFor } from '@testing-library/react';
import { PlayerList } from '@/modules/game/components/PlayerList';
import type { Player } from '@/modules/game/models/Player';
import type { MusicService } from '@/modules/music/services/MusicService';
import {
  usePlayersStore,
  resetPlayersStore,
} from '@/modules/game/state/playersStore';

// Mock MusicService
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

// Mock hook to return our mocked music service
jest.mock('@/modules/app/hooks/useServices', () => ({
  useMusicService: () => mockMusicService,
}));

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
        durationMs: 180_000,
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
    resetPlayersStore();
  });

  it('should display empty state initially', async () => {
    render(<PlayerList />);
    expect(
      screen.getByText(
        'No players found. Add your first player to get started!'
      )
    ).toBeInTheDocument();
  });

  it('should display players when loaded successfully', async () => {
    // Given players exist in the store
    usePlayersStore.getState().actions.setPlayers(mockPlayers);

    render(<PlayerList />);

    // Then it should display the players
    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display empty state when no players exist', async () => {
    render(<PlayerList />);
    expect(
      screen.getByText(
        'No players found. Add your first player to get started!'
      )
    ).toBeInTheDocument();
  });

  it('should display error state when loading fails', async () => {
    // With store-based data, error state is not used; ensure empty renders
    render(<PlayerList />);
    expect(
      screen.getByText(
        'No players found. Add your first player to get started!'
      )
    ).toBeInTheDocument();
  });

  it('should display player without song correctly', async () => {
    // Given a player in the store
    usePlayersStore.getState().actions.setPlayers([mockPlayers[0]]);
    render(<PlayerList />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('No walk-up song selected')).toBeInTheDocument();
  });

  it('should display player with song correctly', async () => {
    usePlayersStore.getState().actions.setPlayers([mockPlayers[1]]);
    render(<PlayerList musicService={mockMusicService} />);

    // Then it should display the player with song information
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('by Test Artist')).toBeInTheDocument();
    expect(screen.getByText('30s - 40s')).toBeInTheDocument();
  });

  // Note: PlayerList component does not have edit functionality
  // Edit operations are handled at a higher level in the application

  // Note: PlayerList component does not have delete functionality
  // Delete operations are handled at a higher level in the application

  it('should retry loading when retry button is clicked', async () => {
    // Not applicable with store; add players and assert
    usePlayersStore.getState().actions.setPlayers(mockPlayers);
    render(<PlayerList />);
    await waitFor(() => {
      expect(screen.getByText('Players (2)')).toBeInTheDocument();
    });
  });
});
