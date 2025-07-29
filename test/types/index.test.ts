import {
  Player,
  SongSegment,
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
        track: {
          id: 'track123',
          name: 'Test Song',
          artists: ['Test Artist'],
          album: 'Test Album',
          albumArt: 'http://example.com/art.jpg',
          previewUrl: 'http://example.com/preview.mp3',
          durationMs: 180000,
          uri: 'spotify:track:123',
        },
        startTime: 30,
        duration: 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(player.id).toBe('1');
    expect(player.name).toBe('Test Player');
    expect(player.song?.track.id).toBe('track123');
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
      redirectUri: 'http://127.0.0.1:8000/callback',
    };

    expect(typeof config.maxSegmentDuration).toBe('number');
    expect(typeof config.spotifyClientId).toBe('string');
    expect(typeof config.redirectUri).toBe('string');
  });

  test('SongSegment interface has correct structure', () => {
    const segment: SongSegment = {
      track: {
        id: 'track123',
        name: 'Test Song',
        artists: ['Test Artist'],
        album: 'Test Album',
        albumArt: 'http://example.com/art.jpg',
        previewUrl: 'http://example.com/preview.mp3',
        durationMs: 180000,
        uri: 'spotify:track:123',
      },
      startTime: 30,
      duration: 10,
    };

    expect(segment.track.id).toBe('track123');
    expect(segment.track.name).toBe('Test Song');
    expect(segment.track.artists).toEqual(['Test Artist']);
    expect(typeof segment.startTime).toBe('number');
    expect(typeof segment.duration).toBe('number');
  });
});

describe('Player Validation', () => {
  test('validates valid player without song', () => {
    const player = {
      id: 'player1',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => Player.fromExternalData(player)).not.toThrow();
  });

  test('validates valid player with song', () => {
    const player = {
      id: 'player1',
      name: 'John Doe',
      song: {
        track: {
          id: 'track123',
          name: 'Test Song',
          artists: ['Test Artist'],
          album: 'Test Album',
          albumArt: 'http://example.com/art.jpg',
          previewUrl: 'http://example.com/preview.mp3',
          durationMs: 180000,
          uri: 'spotify:track:123',
        },
        startTime: 30,
        duration: 10,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => Player.fromExternalData(player)).not.toThrow();
  });

  test('rejects player with missing required fields', () => {
    expect(() => Player.fromExternalData({})).toThrow(
      'Invalid player data: id must be a non-empty string'
    );
    expect(() => Player.fromExternalData({ id: 'player1' })).toThrow(
      'Invalid player data: name must be a non-empty string'
    );
    expect(() =>
      Player.fromExternalData({
        id: '',
        name: 'John',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).toThrow('Invalid player data: id must be a non-empty string');
    expect(() =>
      Player.fromExternalData({
        id: 'player1',
        name: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).toThrow('Invalid player data: name must be a non-empty string');
  });

  test('rejects player with invalid dates', () => {
    expect(() =>
      Player.fromExternalData({
        id: 'player1',
        name: 'John',
        createdAt: 'invalid',
        updatedAt: new Date(),
      })
    ).toThrow('Invalid player data: createdAt must be a valid date');

    expect(() =>
      Player.fromExternalData({
        id: 'player1',
        name: 'John',
        createdAt: new Date(),
        updatedAt: 'invalid',
      })
    ).toThrow('Invalid player data: updatedAt must be a valid date');
  });

  test('rejects player with invalid song data', () => {
    const basePlayer = {
      id: 'player1',
      name: 'John',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() =>
      Player.fromExternalData({
        ...basePlayer,
        song: { track: { id: '' }, startTime: 0, duration: 10 },
      })
    ).toThrow('Invalid Spotify track data: id must be a non-empty string');

    expect(() =>
      Player.fromExternalData({
        ...basePlayer,
        song: {
          track: {
            id: 'track123',
            name: 'Test Song',
            artists: ['Test Artist'],
            album: 'Test Album',
            albumArt: 'http://example.com/art.jpg',
            previewUrl: 'http://example.com/preview.mp3',
            durationMs: 180000,
            uri: 'spotify:track:123',
          },
          startTime: -1,
          duration: 10,
        },
      })
    ).toThrow(
      'Invalid song segment data: startTime must be a non-negative number'
    );

    expect(() =>
      Player.fromExternalData({
        ...basePlayer,
        song: {
          track: {
            id: 'track123',
            name: 'Test Song',
            artists: ['Test Artist'],
            album: 'Test Album',
            albumArt: 'http://example.com/art.jpg',
            previewUrl: 'http://example.com/preview.mp3',
            durationMs: 180000,
            uri: 'spotify:track:123',
          },
          startTime: 0,
          duration: 0,
        },
      })
    ).toThrow(
      'Invalid song segment data: duration must be a positive number <= 30'
    );

    expect(() =>
      Player.fromExternalData({
        ...basePlayer,
        song: {
          track: {
            id: 'track123',
            name: 'Test Song',
            artists: ['Test Artist'],
            album: 'Test Album',
            albumArt: 'http://example.com/art.jpg',
            previewUrl: 'http://example.com/preview.mp3',
            durationMs: 180000,
            uri: 'spotify:track:123',
          },
          startTime: 0,
          duration: 35,
        },
      })
    ).toThrow(
      'Invalid song segment data: duration must be a positive number <= 30'
    );
  });

  test('rejects non-object input', () => {
    expect(() => Player.fromExternalData(null)).toThrow(
      'Invalid player data: must be an object'
    );
    expect(() => Player.fromExternalData(undefined)).toThrow(
      'Invalid player data: must be an object'
    );
    expect(() => Player.fromExternalData('string')).toThrow(
      'Invalid player data: must be an object'
    );
    expect(() => Player.fromExternalData(123)).toThrow(
      'Invalid player data: must be an object'
    );
  });
});

describe('SongSegment Validation', () => {
  const validTrack = {
    id: 'track123',
    name: 'Test Song',
    artists: ['Test Artist'],
    album: 'Test Album',
    albumArt: 'http://example.com/art.jpg',
    previewUrl: 'http://example.com/preview.mp3',
    durationMs: 180000,
    uri: 'spotify:track:123',
  };

  test('validates valid song segment', () => {
    const segment = {
      track: validTrack,
      startTime: 30,
      duration: 10,
    };

    expect(() => SongSegment.fromExternalData(segment)).not.toThrow();
  });

  test('rejects segment with missing required fields', () => {
    expect(() => SongSegment.fromExternalData({})).toThrow(
      'Invalid song segment data: track is required'
    );
    expect(() => SongSegment.fromExternalData({ track: validTrack })).toThrow(
      'Invalid song segment data: startTime must be a non-negative number'
    );
    expect(() =>
      SongSegment.fromExternalData({ track: validTrack, startTime: 30 })
    ).toThrow(
      'Invalid song segment data: duration must be a positive number <= 30'
    );
  });

  test('rejects segment with invalid track', () => {
    expect(() =>
      SongSegment.fromExternalData({
        track: { id: '' }, // invalid track
        startTime: 30,
        duration: 10,
      })
    ).toThrow('Invalid Spotify track data: id must be a non-empty string');
  });

  test('rejects segment with invalid duration', () => {
    const baseSegment = {
      track: validTrack,
      startTime: 30,
    };

    expect(() =>
      SongSegment.fromExternalData({
        ...baseSegment,
        duration: 0,
      })
    ).toThrow(
      'Invalid song segment data: duration must be a positive number <= 30'
    );

    expect(() =>
      SongSegment.fromExternalData({
        ...baseSegment,
        duration: 35,
      })
    ).toThrow(
      'Invalid song segment data: duration must be a positive number <= 30'
    );
  });

  test('rejects segment with invalid start time', () => {
    const baseSegment = {
      track: validTrack,
      duration: 10,
    };

    expect(() =>
      SongSegment.fromExternalData({
        ...baseSegment,
        startTime: -1,
      })
    ).toThrow(
      'Invalid song segment data: startTime must be a non-negative number'
    );
  });

  test('rejects non-object input', () => {
    expect(() => SongSegment.fromExternalData(null)).toThrow(
      'Invalid song segment data: must be an object'
    );
    expect(() => SongSegment.fromExternalData(undefined)).toThrow(
      'Invalid song segment data: must be an object'
    );
    expect(() => SongSegment.fromExternalData('string')).toThrow(
      'Invalid song segment data: must be an object'
    );
    expect(() => SongSegment.fromExternalData(123)).toThrow(
      'Invalid song segment data: must be an object'
    );
  });
});

describe('BattingOrder Validation', () => {
  test('validates valid batting order', () => {
    const order = {
      id: 'order1',
      name: 'Game 1',
      playerIds: ['player1', 'player2', 'player3'],
      currentPosition: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => BattingOrder.fromExternalData(order)).not.toThrow();
  });

  test('validates empty batting order', () => {
    const order = {
      id: 'order1',
      name: 'Game 1',
      playerIds: [],
      currentPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() => BattingOrder.fromExternalData(order)).not.toThrow();
  });

  test('rejects batting order with missing required fields', () => {
    expect(() => BattingOrder.fromExternalData({})).toThrow(
      'Invalid batting order data: id must be a non-empty string'
    );
    expect(() => BattingOrder.fromExternalData({ id: 'order1' })).toThrow(
      'Invalid batting order data: name must be a non-empty string'
    );
    expect(() =>
      BattingOrder.fromExternalData({
        id: '',
        name: 'Game',
        playerIds: [],
        currentPosition: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).toThrow('Invalid batting order data: id must be a non-empty string');
  });

  test('rejects batting order with invalid player IDs', () => {
    const baseOrder = {
      id: 'order1',
      name: 'Game 1',
      currentPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() =>
      BattingOrder.fromExternalData({
        ...baseOrder,
        playerIds: ['player1', '', 'player3'],
      })
    ).toThrow(
      'Invalid batting order data: all player IDs must be non-empty strings'
    );

    expect(() =>
      BattingOrder.fromExternalData({
        ...baseOrder,
        playerIds: 'not-array',
      })
    ).toThrow('Invalid batting order data: playerIds must be an array');
  });

  test('rejects batting order with invalid current position', () => {
    const baseOrder = {
      id: 'order1',
      name: 'Game 1',
      playerIds: ['player1', 'player2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(() =>
      BattingOrder.fromExternalData({
        ...baseOrder,
        currentPosition: -1,
      })
    ).toThrow(
      'Invalid batting order data: currentPosition must be a non-negative number'
    );

    expect(() =>
      BattingOrder.fromExternalData({
        ...baseOrder,
        currentPosition: 2, // >= playerIds.length
      })
    ).toThrow(
      'Invalid batting order data: currentPosition must be less than playerIds length'
    );
  });
});

describe('SpotifyTrack Validation', () => {
  test('validates valid Spotify track', () => {
    const track = {
      id: 'track123',
      name: 'Test Song',
      artists: ['Artist 1', 'Artist 2'],
      album: 'Test Album',
      albumArt: 'http://example.com/art.jpg',
      previewUrl: 'http://example.com/preview.mp3',
      durationMs: 180000,
      uri: 'spotify:track:123',
    };

    expect(() => SpotifyTrack.fromExternalData(track)).not.toThrow();
  });

  test('rejects track with missing required fields', () => {
    expect(() => SpotifyTrack.fromExternalData({})).toThrow(
      'Invalid Spotify track data: id must be a non-empty string'
    );
    expect(() => SpotifyTrack.fromExternalData({ id: '' })).toThrow(
      'Invalid Spotify track data: id must be a non-empty string'
    );
    expect(() =>
      SpotifyTrack.fromExternalData({ id: 'track1', name: '' })
    ).toThrow('Invalid Spotify track data: name must be a non-empty string');
  });

  test('rejects track with invalid artists', () => {
    const baseTrack = {
      id: 'track1',
      name: 'Test Song',
      album: 'Album',
      albumArt: '',
      previewUrl: '',
      durationMs: 180000,
      uri: 'spotify:track:123',
    };

    expect(() =>
      SpotifyTrack.fromExternalData({
        ...baseTrack,
        artists: [],
      })
    ).toThrow('Invalid Spotify track data: artists must be a non-empty array');

    expect(() =>
      SpotifyTrack.fromExternalData({
        ...baseTrack,
        artists: ['Artist 1', ''],
      })
    ).toThrow(
      'Invalid Spotify track data: all artist names must be non-empty strings'
    );

    expect(() =>
      SpotifyTrack.fromExternalData({
        ...baseTrack,
        artists: 'not-array',
      })
    ).toThrow('Invalid Spotify track data: artists must be a non-empty array');
  });

  test('rejects track with invalid duration', () => {
    const baseTrack = {
      id: 'track1',
      name: 'Test Song',
      artists: ['Artist'],
      album: 'Album',
      albumArt: '',
      previewUrl: '',
      uri: 'spotify:track:123',
    };

    expect(() =>
      SpotifyTrack.fromExternalData({
        ...baseTrack,
        durationMs: 0,
      })
    ).toThrow(
      'Invalid Spotify track data: durationMs must be a positive number'
    );

    expect(() =>
      SpotifyTrack.fromExternalData({
        ...baseTrack,
        durationMs: -1000,
      })
    ).toThrow(
      'Invalid Spotify track data: durationMs must be a positive number'
    );
  });
});

describe('AppConfig Validation', () => {
  test('validates valid app config', () => {
    const config = {
      maxSegmentDuration: 10,
      spotifyClientId: 'client123',
      redirectUri: 'http://127.0.0.1:8000/callback',
    };

    expect(() => AppConfig.fromExternalData(config)).not.toThrow();
  });

  test('rejects config with invalid segment duration', () => {
    const baseConfig = {
      spotifyClientId: 'client123',
      redirectUri: 'http://127.0.0.1:8000/callback',
    };

    expect(() =>
      AppConfig.fromExternalData({
        ...baseConfig,
        maxSegmentDuration: 0,
      })
    ).toThrow(
      'Invalid app config data: maxSegmentDuration must be a number between 1 and 30'
    );

    expect(() =>
      AppConfig.fromExternalData({
        ...baseConfig,
        maxSegmentDuration: 35,
      })
    ).toThrow(
      'Invalid app config data: maxSegmentDuration must be a number between 1 and 30'
    );
  });

  test('rejects config with empty client ID', () => {
    expect(() =>
      AppConfig.fromExternalData({
        maxSegmentDuration: 10,
        spotifyClientId: '',
        redirectUri: 'http://127.0.0.1:8000/callback',
      })
    ).toThrow(
      'Invalid app config data: spotifyClientId must be a non-empty string'
    );
  });

  test('rejects config with invalid redirect URI', () => {
    expect(() =>
      AppConfig.fromExternalData({
        maxSegmentDuration: 10,
        spotifyClientId: 'client123',
        redirectUri: 'invalid-url',
      })
    ).toThrow('Invalid app config data: redirectUri must be a valid URL');

    expect(() =>
      AppConfig.fromExternalData({
        maxSegmentDuration: 10,
        spotifyClientId: 'client123',
        redirectUri: '',
      })
    ).toThrow(
      'Invalid app config data: redirectUri must be a non-empty string'
    );
  });
});

describe('Object Creation Examples', () => {
  test('creates objects using object literals', () => {
    // For internal data, just use object literals
    const player: Player = {
      id: 'player-123',
      name: 'John Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(player.name).toBe('John Doe');
    expect(typeof player.id).toBe('string');
    expect(player.createdAt).toBeInstanceOf(Date);
    expect(player.updatedAt).toBeInstanceOf(Date);
    expect(player.song).toBeUndefined();
  });

  test('creates batting order using object literals', () => {
    const order: BattingOrder = {
      id: 'order-123',
      name: 'Game 1',
      playerIds: ['player1', 'player2'],
      currentPosition: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(order.name).toBe('Game 1');
    expect(order.playerIds).toEqual(['player1', 'player2']);
    expect(order.currentPosition).toBe(0);
  });

  test('creates Spotify track using object literals', () => {
    const track: SpotifyTrack = {
      id: 'track123',
      name: 'Test Song',
      artists: ['Artist 1', 'Artist 2'],
      album: 'Test Album',
      albumArt: 'http://example.com/art.jpg',
      previewUrl: 'http://example.com/preview.mp3',
      durationMs: 180000,
      uri: 'spotify:track:123',
    };

    expect(track.id).toBe('track123');
    expect(track.name).toBe('Test Song');
    expect(track.artists).toEqual(['Artist 1', 'Artist 2']);
  });

  test('creates app config using object literals', () => {
    const config: AppConfig = {
      maxSegmentDuration: 15,
      spotifyClientId: 'client123',
      redirectUri: 'https://example.com/callback',
    };

    expect(config.maxSegmentDuration).toBe(15);
    expect(config.spotifyClientId).toBe('client123');
    expect(config.redirectUri).toBe('https://example.com/callback');
  });

  test('creates song segment using object literals', () => {
    const segment: SongSegment = {
      track: {
        id: 'track123',
        name: 'Test Song',
        artists: ['Test Artist'],
        album: 'Test Album',
        albumArt: 'http://example.com/art.jpg',
        previewUrl: 'http://example.com/preview.mp3',
        durationMs: 180000,
        uri: 'spotify:track:123',
      },
      startTime: 30,
      duration: 10,
    };

    expect(segment.track.id).toBe('track123');
    expect(segment.track.name).toBe('Test Song');
    expect(segment.track.artists).toEqual(['Test Artist']);
    expect(segment.startTime).toBe(30);
    expect(segment.duration).toBe(10);
  });
});
