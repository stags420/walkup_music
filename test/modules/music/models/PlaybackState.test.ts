import {
  PlaybackState,
  PlaybackConfig,
  DEFAULT_PLAYBACK_STATE,
} from '@/modules/music/models/PlaybackState';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';

describe('PlaybackState', () => {
  const mockTrack: SpotifyTrack = {
    id: 'track1',
    name: 'Test Track',
    artists: ['Test Artist'],
    album: 'Test Album',
    albumArt: 'https://example.com/art.jpg',
    previewUrl: 'https://example.com/preview.mp3',
    durationMs: 180000,
    uri: 'spotify:track:test',
  };

  describe('DEFAULT_PLAYBACK_STATE', () => {
    test('should have correct default values', () => {
      // Given the default playback state
      const defaultState = DEFAULT_PLAYBACK_STATE;

      // Then it should have idle state with no track
      expect(defaultState.currentTrack).toBeNull();
      expect(defaultState.state).toBe('idle');
      expect(defaultState.position).toBe(0);
      expect(defaultState.duration).toBe(0);
      expect(defaultState.error).toBeUndefined();
    });
  });

  describe('PlaybackState interface', () => {
    test('should support all required state values', () => {
      // Given a complete playback state
      const playbackState: PlaybackState = {
        currentTrack: mockTrack,
        state: 'playing',
        position: 30000,
        duration: 180000,
        error: undefined,
      };

      // Then all properties should be accessible
      expect(playbackState.currentTrack).toBe(mockTrack);
      expect(playbackState.state).toBe('playing');
      expect(playbackState.position).toBe(30000);
      expect(playbackState.duration).toBe(180000);
      expect(playbackState.error).toBeUndefined();
    });

    test('should support error state', () => {
      // Given a playback state with error
      const errorState: PlaybackState = {
        currentTrack: mockTrack,
        state: 'error',
        position: 0,
        duration: 180000,
        error: 'Playback failed',
      };

      // Then error should be accessible
      expect(errorState.state).toBe('error');
      expect(errorState.error).toBe('Playback failed');
    });

    test('should support all state values', () => {
      // Given different state values
      const states: PlaybackState['state'][] = [
        'idle',
        'loading',
        'playing',
        'paused',
        'error',
      ];

      // Then each state should be valid
      states.forEach((state) => {
        const playbackState: PlaybackState = {
          currentTrack: null,
          state,
          position: 0,
          duration: 0,
        };
        expect(playbackState.state).toBe(state);
      });
    });
  });

  describe('PlaybackConfig interface', () => {
    test('should support optional configuration properties', () => {
      // Given a playback configuration
      const onTrackEnd = jest.fn();
      const config: PlaybackConfig = {
        startTime: 30,
        duration: 10,
        onTrackEnd,
      };

      // Then all properties should be accessible
      expect(config.startTime).toBe(30);
      expect(config.duration).toBe(10);
      expect(config.onTrackEnd).toBe(onTrackEnd);
    });

    test('should support empty configuration', () => {
      // Given an empty configuration
      const config: PlaybackConfig = {};

      // Then it should be valid
      expect(config.startTime).toBeUndefined();
      expect(config.duration).toBeUndefined();
      expect(config.onTrackEnd).toBeUndefined();
    });

    test('should support partial configuration', () => {
      // Given a partial configuration
      const config: PlaybackConfig = {
        startTime: 15,
      };

      // Then only specified properties should be set
      expect(config.startTime).toBe(15);
      expect(config.duration).toBeUndefined();
      expect(config.onTrackEnd).toBeUndefined();
    });
  });
});
