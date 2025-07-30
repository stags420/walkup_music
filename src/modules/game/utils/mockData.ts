import { Player } from '@/modules/game/models/Player';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

/**
 * Mock Spotify tracks for testing
 */
const mockTracks: SpotifyTrack[] = [
  {
    id: 'track1',
    name: 'Eye of the Tiger',
    artists: ['Survivor'],
    album: 'Eye of the Tiger',
    albumArt: 'https://via.placeholder.com/300x300?text=Eye+of+the+Tiger',
    previewUrl: 'https://example.com/preview1.mp3',
    durationMs: 246000,
    uri: 'spotify:track:track1',
  },
  {
    id: 'track2',
    name: 'We Will Rock You',
    artists: ['Queen'],
    album: 'News of the World',
    albumArt: 'https://via.placeholder.com/300x300?text=We+Will+Rock+You',
    previewUrl: 'https://example.com/preview2.mp3',
    durationMs: 122000,
    uri: 'spotify:track:track2',
  },
  {
    id: 'track3',
    name: 'Thunderstruck',
    artists: ['AC/DC'],
    album: 'The Razors Edge',
    albumArt: 'https://via.placeholder.com/300x300?text=Thunderstruck',
    previewUrl: 'https://example.com/preview3.mp3',
    durationMs: 292000,
    uri: 'spotify:track:track3',
  },
];

/**
 * Generate mock players with songs for testing
 */
export function generateMockPlayers(): Player[] {
  const baseTime = new Date('2024-01-01T00:00:00Z');

  return [
    {
      id: 'player1',
      name: 'Mike Johnson',
      song: {
        track: mockTracks[0],
        startTime: 30,
        duration: 8,
      },
      createdAt: new Date(baseTime.getTime() + 1000),
      updatedAt: new Date(baseTime.getTime() + 2000),
    },
    {
      id: 'player2',
      name: 'Sarah Williams',
      song: {
        track: mockTracks[1],
        startTime: 15,
        duration: 10,
      },
      createdAt: new Date(baseTime.getTime() + 3000),
      updatedAt: new Date(baseTime.getTime() + 4000),
    },
    {
      id: 'player3',
      name: 'David Rodriguez',
      song: {
        track: mockTracks[2],
        startTime: 45,
        duration: 7,
      },
      createdAt: new Date(baseTime.getTime() + 5000),
      updatedAt: new Date(baseTime.getTime() + 6000),
    },
    {
      id: 'player4',
      name: 'Emily Chen',
      createdAt: new Date(baseTime.getTime() + 7000),
      updatedAt: new Date(baseTime.getTime() + 8000),
    },
    {
      id: 'player5',
      name: 'Alex Thompson',
      createdAt: new Date(baseTime.getTime() + 9000),
      updatedAt: new Date(baseTime.getTime() + 10000),
    },
  ];
}

/**
 * Populate storage with mock data for testing
 */
export async function populateWithMockData(playerService: {
  getAllPlayers(): Promise<Player[]>;
  createPlayer(name: string): Promise<Player>;
}): Promise<void> {
  try {
    // Check if we already have players
    const existingPlayers = await playerService.getAllPlayers();
    if (existingPlayers.length > 0) {
      return; // Don't overwrite existing data
    }

    // Add mock players one by one to simulate real usage
    const mockPlayers = generateMockPlayers();
    for (const mockPlayer of mockPlayers) {
      // For now, just create players without songs since Spotify integration isn't ready
      await playerService.createPlayer(mockPlayer.name);
    }
  } catch (error) {
    console.error('Failed to populate mock data:', error);
  }
}
