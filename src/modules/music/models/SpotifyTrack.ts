export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  albumArt: string;
  previewUrl: string;
  durationMs: number;
  uri: string;
}

export const SpotifyTrack = {
  fromExternalData(data: unknown): SpotifyTrack {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Spotify track data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error(
        'Invalid Spotify track data: id must be a non-empty string'
      );
    }

    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      throw new Error(
        'Invalid Spotify track data: name must be a non-empty string'
      );
    }

    if (!Array.isArray(obj.artists) || obj.artists.length === 0) {
      throw new Error(
        'Invalid Spotify track data: artists must be a non-empty array'
      );
    }

    if (
      obj.artists.some((artist) => typeof artist !== 'string' || !artist.trim())
    ) {
      throw new Error(
        'Invalid Spotify track data: all artist names must be non-empty strings'
      );
    }

    if (typeof obj.album !== 'string' || !obj.album.trim()) {
      throw new Error(
        'Invalid Spotify track data: album must be a non-empty string'
      );
    }

    if (typeof obj.albumArt !== 'string') {
      throw new TypeError(
        'Invalid Spotify track data: albumArt must be a string'
      );
    }

    if (typeof obj.previewUrl !== 'string') {
      throw new TypeError(
        'Invalid Spotify track data: previewUrl must be a string'
      );
    }

    if (typeof obj.durationMs !== 'number' || obj.durationMs <= 0) {
      throw new Error(
        'Invalid Spotify track data: durationMs must be a positive number'
      );
    }

    if (typeof obj.uri !== 'string' || !obj.uri.trim()) {
      throw new Error(
        'Invalid Spotify track data: uri must be a non-empty string'
      );
    }

    return {
      id: obj.id.trim(),
      name: obj.name.trim(),
      artists: obj.artists.map((artist) => (artist as string).trim()),
      album: obj.album.trim(),
      albumArt: obj.albumArt,
      previewUrl: obj.previewUrl,
      durationMs: obj.durationMs,
      uri: obj.uri.trim(),
    };
  },
};
