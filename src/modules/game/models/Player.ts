import { SongSegment } from '@/modules/music';

export interface Player {
  id: string;
  name: string;
  song?: SongSegment;
  createdAt: Date;
  updatedAt: Date;
}

export const Player = {
  fromExternalData(data: unknown): Player {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid player data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error('Invalid player data: id must be a non-empty string');
    }

    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      throw new Error('Invalid player data: name must be a non-empty string');
    }

    const createdAt = obj.createdAt
      ? new Date(obj.createdAt as string)
      : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      throw new TypeError(
        'Invalid player data: createdAt must be a valid date'
      );
    }

    const updatedAt = obj.updatedAt
      ? new Date(obj.updatedAt as string)
      : new Date();
    if (Number.isNaN(updatedAt.getTime())) {
      throw new TypeError(
        'Invalid player data: updatedAt must be a valid date'
      );
    }

    let song: SongSegment | undefined;
    if (obj.song !== undefined) {
      song = SongSegment.fromExternalData(obj.song);
    }

    return {
      id: obj.id.trim(),
      name: obj.name.trim(),
      song,
      createdAt,
      updatedAt,
    };
  },
};
