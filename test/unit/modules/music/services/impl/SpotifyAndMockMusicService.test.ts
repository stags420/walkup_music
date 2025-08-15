import type { SpotifyPlaybackService } from '@/modules/music';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

// Mock SpotifyApiService before importing SpotifyMusicService
const mockSpotifyApiService = {
  searchTracks: jest.fn(),
  lastRequestTime: 0,
  requestQueue: [],
  isProcessingQueue: false,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authService: {} as any,
  getAccessToken: jest.fn(),
  isAuthenticated: jest.fn(),
  refreshToken: jest.fn(),
  handleCallback: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getUserInfo: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

jest.mock('@/modules/music/services/impl/SpotifyApiService', () => ({
  SpotifyApiService: jest.fn().mockImplementation(() => mockSpotifyApiService),
}));

// Mock SpotifyPlaybackService
const mockPlaybackService = {
  play: jest.fn(),
  pause: jest.fn(),
  isReady: jest.fn(),
} as jest.Mocked<SpotifyPlaybackService>;

jest.mock('@/modules/music/services/impl/SpotifyPlaybackService', () => ({
  SpotifyPlaybackServiceImpl: jest
    .fn()
    .mockImplementation(() => mockPlaybackService),
  MockSpotifyPlaybackService: jest
    .fn()
    .mockImplementation(() => mockPlaybackService),
}));

import { MockMusicService } from '@/modules/music/services/MusicService';
import { SpotifyMusicService } from '@/modules/music/services/impl/SpotifyMusicService';

describe('MockMusicService', () => {
  let musicService: MockMusicService;

  beforeEach(() => {
    musicService = new MockMusicService(mockPlaybackService);
    jest.clearAllMocks();
  });

  describe('searchTracks', () => {
    it('should return empty array for empty query', async () => {
      // Given I have a music service
      // When I search with an empty query
      const results = await musicService.searchTracks('');

      // Then it should return an empty array
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', async () => {
      // Given I have a music service
      // When I search with a whitespace-only query
      const results = await musicService.searchTracks('   ');

      // Then it should return an empty array
      expect(results).toEqual([]);
    });

    it('should return tracks matching song name', async () => {
      // Given I have a music service with mock tracks
      // When I search for tracks by song name
      const results = await musicService.searchTracks('Tiger');

      // Then it should return tracks that include the song name
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((track) => track.name.includes('Tiger'))).toBe(true);
    });

    it('should return tracks matching artist name', async () => {
      // Given I have a music service with mock tracks
      // When I search for tracks by artist name
      const results = await musicService.searchTracks('Queen');

      // Then it should return tracks by that artist
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((track) => track.artists.includes('Queen'))).toBe(
        true
      );
    });

    it('should return tracks matching album name', async () => {
      // Given I have a music service with mock tracks
      // When I search for tracks by album or artist name
      const results = await musicService.searchTracks('Metallica');

      // Then it should return tracks from that album or artist
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(
          (track) =>
            track.album.includes('Metallica') ||
            track.artists.includes('Metallica')
        )
      ).toBe(true);
    });

    it('should perform case insensitive searches', async () => {
      // Given I have a music service with mock tracks
      // When I search with different casing
      const lowerResults = await musicService.searchTracks('queen');
      const upperResults = await musicService.searchTracks('QUEEN');

      // Then both searches should return the same number of results
      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults.length).toBeGreaterThan(0);
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should limit results to maximum of 8 tracks', async () => {
      // Given I have a music service with many potential matches
      // When I search with a very broad query
      const results = await musicService.searchTracks('a');

      // Then it should return at most 8 results
      expect(results.length).toBeLessThanOrEqual(8);
    });

    it('should return valid SpotifyTrack objects with all required properties', async () => {
      // Given I have a music service
      // When I search for tracks
      const results = await musicService.searchTracks('Tiger');

      // Then each track should have all required SpotifyTrack properties
      if (results.length > 0) {
        const track = results[0];
        expect(track).toHaveProperty('id');
        expect(track).toHaveProperty('name');
        expect(track).toHaveProperty('artists');
        expect(track).toHaveProperty('album');
        expect(track).toHaveProperty('albumArt');
        expect(track).toHaveProperty('previewUrl');
        expect(track).toHaveProperty('durationMs');
        expect(track).toHaveProperty('uri');

        expect(typeof track.id).toBe('string');
        expect(typeof track.name).toBe('string');
        expect(Array.isArray(track.artists)).toBe(true);
        expect(typeof track.album).toBe('string');
        expect(typeof track.albumArt).toBe('string');
        expect(typeof track.previewUrl).toBe('string');
        expect(typeof track.durationMs).toBe('number');
        expect(typeof track.uri).toBe('string');
      }
    });

    it('should simulate realistic network delay', async () => {
      // Given I have a music service that simulates network delays
      const startTime = Date.now();

      // When I search for tracks
      await musicService.searchTracks('Tiger');
      const endTime = Date.now();

      // Then it should take at least the minimum delay but not too long
      expect(endTime - startTime).toBeGreaterThan(250);
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('should return different results for different search queries', async () => {
      // Given I have a music service with diverse mock tracks
      // When I search for different terms
      const tigerResults = await musicService.searchTracks('Tiger');
      const queenResults = await musicService.searchTracks('Queen');

      // Then the results should be different
      if (tigerResults.length > 0 && queenResults.length > 0) {
        expect(tigerResults[0].id).not.toBe(queenResults[0].id);
      }
    });
  });

  describe('playback functionality', () => {
    it('should delegate playTrack to playback service', async () => {
      // Given a track URI and start position
      const uri = 'spotify:track:test123';
      const startPositionMs = 30_000;

      // When playing a track
      await musicService.playTrack(uri, startPositionMs);

      // Then should delegate to playback service
      expect(mockPlaybackService.play).toHaveBeenCalledWith(
        uri,
        startPositionMs
      );
    });

    it('should delegate pause to playback service', async () => {
      // When pausing playback
      await musicService.pause();

      // Then should delegate to playback service
      expect(mockPlaybackService.pause).toHaveBeenCalled();
    });

    it('should throw error for resume (not implemented)', async () => {
      // When trying to resume playback
      const resumePromise = musicService.resume();

      // Then should throw an error
      await expect(resumePromise).rejects.toThrow('Resume not implemented');
    });

    it('should throw error for seek (not implemented)', async () => {
      // Given a position in milliseconds
      const positionMs = 60_000;

      // When trying to seek to position
      const seekPromise = musicService.seek(positionMs);

      // Then should throw an error
      await expect(seekPromise).rejects.toThrow('Seek not implemented');
    });

    it('should throw error for getCurrentState (not implemented)', async () => {
      // When trying to get current state
      const statePromise = musicService.getCurrentState();

      // Then should throw an error
      await expect(statePromise).rejects.toThrow(
        'getCurrentState not implemented'
      );
    });

    it('should delegate isPlaybackConnected to playback service', () => {
      // Given playback service returns ready state
      mockPlaybackService.isReady.mockReturnValue(true);

      // When checking if connected
      const result = musicService.isPlaybackConnected();

      // Then should delegate to playback service and return result
      expect(mockPlaybackService.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delegate isPlaybackReady to playback service', () => {
      // Given playback service returns ready state
      mockPlaybackService.isReady.mockReturnValue(true);

      // When checking if ready
      const result = musicService.isPlaybackReady();

      // Then should delegate to playback service and return result
      expect(mockPlaybackService.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});

describe('SpotifyMusicService', () => {
  let musicService: SpotifyMusicService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    musicService = new SpotifyMusicService(
      mockSpotifyApiService,
      mockPlaybackService
    );
  });

  describe('searchTracks', () => {
    test('should delegate search to SpotifyApiService', async () => {
      // Given a search query and expected results
      const query = 'test query';
      const expectedTracks: SpotifyTrack[] = [
        {
          id: 'track1',
          name: 'Test Song',
          artists: ['Test Artist'],
          album: 'Test Album',
          albumArt: 'https://example.com/art.jpg',
          previewUrl: 'https://example.com/preview.mp3',
          durationMs: 180_000,
          uri: 'spotify:track:track1',
        },
      ];

      mockSpotifyApiService.searchTracks.mockResolvedValue(expectedTracks);

      // When searching for tracks
      const result = await musicService.searchTracks(query);

      // Then should delegate to SpotifyApiService and return results
      expect(mockSpotifyApiService.searchTracks).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedTracks);
    });

    test('should pass through errors from SpotifyApiService', async () => {
      // Given SpotifyApiService throws an error
      const error = new Error('API error');
      mockSpotifyApiService.searchTracks.mockRejectedValue(error);

      // When searching for tracks
      const searchPromise = musicService.searchTracks('test query');

      // Then should propagate the error
      await expect(searchPromise).rejects.toThrow('API error');
    });

    test('should create SpotifyApiService with auth service', async () => {
      // Given a search query
      const query = 'test';
      const expectedTracks: SpotifyTrack[] = [];
      mockSpotifyApiService.searchTracks.mockResolvedValue(expectedTracks);

      // When we use the service
      await musicService.searchTracks(query);

      // Then should have used the SpotifyApiService
      expect(mockSpotifyApiService.searchTracks).toHaveBeenCalledWith(query);
    });
  });

  describe('playback functionality', () => {
    it('should delegate playTrack to playback service', async () => {
      // Given a track URI and start position
      const uri = 'spotify:track:test123';
      const startPositionMs = 30_000;

      // When playing a track
      await musicService.playTrack(uri, startPositionMs);

      // Then should delegate to playback service
      expect(mockPlaybackService.play).toHaveBeenCalledWith(
        uri,
        startPositionMs
      );
    });

    it('should delegate pause to playback service', async () => {
      // When pausing playback
      await musicService.pause();

      // Then should delegate to playback service
      expect(mockPlaybackService.pause).toHaveBeenCalled();
    });

    it('should throw error for resume (not implemented)', async () => {
      // When trying to resume playback
      const resumePromise = musicService.resume();

      // Then should throw an error
      await expect(resumePromise).rejects.toThrow('Resume not implemented');
    });

    it('should throw error for seek (not implemented)', async () => {
      // Given a position in milliseconds
      const positionMs = 60_000;

      // When trying to seek to position
      const seekPromise = musicService.seek(positionMs);

      // Then should throw an error
      await expect(seekPromise).rejects.toThrow('Seek not implemented');
    });

    it('should throw error for getCurrentState (not implemented)', async () => {
      // When trying to get current state
      const statePromise = musicService.getCurrentState();

      // Then should throw an error
      await expect(statePromise).rejects.toThrow(
        'getCurrentState not implemented'
      );
    });

    it('should delegate isPlaybackConnected to playback service', () => {
      // Given playback service returns ready state
      mockPlaybackService.isReady.mockReturnValue(true);

      // When checking if connected
      const result = musicService.isPlaybackConnected();

      // Then should delegate to playback service and return result
      expect(mockPlaybackService.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should delegate isPlaybackReady to playback service', () => {
      // Given playback service returns ready state
      mockPlaybackService.isReady.mockReturnValue(true);

      // When checking if ready
      const result = musicService.isPlaybackReady();

      // Then should delegate to playback service and return result
      expect(mockPlaybackService.isReady).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
