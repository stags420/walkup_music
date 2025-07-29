import { SpotifyTrack } from './SpotifyTrack';

export interface SongSegment {
  track: SpotifyTrack;
  startTime: number; // seconds
  duration: number; // seconds (max configurable, default 10)
}

export const SongSegment = {
  fromExternalData(data: unknown): SongSegment {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid song segment data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (!obj.track) {
      throw new Error('Invalid song segment data: track is required');
    }

    const track = SpotifyTrack.fromExternalData(obj.track);

    if (typeof obj.startTime !== 'number' || obj.startTime < 0) {
      throw new Error(
        'Invalid song segment data: startTime must be a non-negative number'
      );
    }

    if (
      typeof obj.duration !== 'number' ||
      obj.duration <= 0 ||
      obj.duration > 30
    ) {
      throw new Error(
        'Invalid song segment data: duration must be a positive number <= 30'
      );
    }

    return {
      track,
      startTime: obj.startTime,
      duration: obj.duration,
    };
  },
};
