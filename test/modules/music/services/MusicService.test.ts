import { MockMusicService } from '@/modules/music/services/MusicService';

describe('MockMusicService', () => {
  let musicService: MockMusicService;

  beforeEach(() => {
    musicService = new MockMusicService();
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
});
