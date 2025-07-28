import {
  Player,
  BattingOrder,
  SpotifyTrack,
  AppConfig,
} from '../../src/types/index';

describe('Data Types', () => {
  test('Player interface has correct structure', () => {
    const player: Player = {
      id: '1',
      name: 'Test Player',
      song: {
        spotifyId: 'spotify123',
        title: 'Test Song',
        artist: 'Test Artist',
        albumArt: 'http://example.com/art.jpg',
        previewUrl: 'http://example.com/preview.mp3',
        startTime: 30,
        duration: 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(player.id).toBe('1');
    expect(player.name).toBe('Test Player');
    expect(player.song?.spotifyId).toBe('spotify123');
    expect(typeof player.createdAt).toBe('object');
    expect(typeof player.updatedAt).toBe('object');
  });

  test('BattingOrder interface has correct structure', () => {
    const order: BattingOrder = {
      id: '1',
      name: 'Game 1 Order',
      playerIds: ['player1', 'player2'],
      currentPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(order.id).toBe('1');
    expect(order.name).toBe('Game 1 Order');
    expect(Array.isArray(order.playerIds)).toBe(true);
    expect(typeof order.currentPosition).toBe('number');
  });

  test('SpotifyTrack interface has correct structure', () => {
    const track: SpotifyTrack = {
      id: 'track123',
      name: 'Test Track',
      artists: ['Artist 1', 'Artist 2'],
      album: 'Test Album',
      albumArt: 'http://example.com/album.jpg',
      previewUrl: 'http://example.com/preview.mp3',
      durationMs: 180000,
      uri: 'spotify:track:123',
    };

    expect(track.id).toBe('track123');
    expect(Array.isArray(track.artists)).toBe(true);
    expect(typeof track.durationMs).toBe('number');
  });

  test('AppConfig interface has correct structure', () => {
    const config: AppConfig = {
      maxSegmentDuration: 10,
      spotifyClientId: 'client123',
      redirectUri: 'http://localhost:3000/callback',
    };

    expect(typeof config.maxSegmentDuration).toBe('number');
    expect(typeof config.spotifyClientId).toBe('string');
    expect(typeof config.redirectUri).toBe('string');
  });
});
