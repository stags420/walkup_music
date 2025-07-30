export interface BattingOrder {
  id: string;
  name: string;
  playerIds: string[];
  currentPosition: number;
  createdAt: Date;
  updatedAt: Date;
}

export const BattingOrder = {
  fromExternalData(data: unknown): BattingOrder {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid batting order data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.id !== 'string' || !obj.id.trim()) {
      throw new Error(
        'Invalid batting order data: id must be a non-empty string'
      );
    }

    if (typeof obj.name !== 'string' || !obj.name.trim()) {
      throw new Error(
        'Invalid batting order data: name must be a non-empty string'
      );
    }

    if (!Array.isArray(obj.playerIds)) {
      throw new Error('Invalid batting order data: playerIds must be an array');
    }

    if (obj.playerIds.some((id) => typeof id !== 'string' || !id.trim())) {
      throw new Error(
        'Invalid batting order data: all player IDs must be non-empty strings'
      );
    }

    if (typeof obj.currentPosition !== 'number' || obj.currentPosition < 0) {
      throw new Error(
        'Invalid batting order data: currentPosition must be a non-negative number'
      );
    }

    if (
      obj.playerIds.length > 0 &&
      obj.currentPosition >= obj.playerIds.length
    ) {
      throw new Error(
        'Invalid batting order data: currentPosition must be less than playerIds length'
      );
    }

    const createdAt = obj.createdAt
      ? new Date(obj.createdAt as string)
      : new Date();
    if (isNaN(createdAt.getTime())) {
      throw new Error(
        'Invalid batting order data: createdAt must be a valid date'
      );
    }

    const updatedAt = obj.updatedAt
      ? new Date(obj.updatedAt as string)
      : new Date();
    if (isNaN(updatedAt.getTime())) {
      throw new Error(
        'Invalid batting order data: updatedAt must be a valid date'
      );
    }

    return {
      id: obj.id.trim(),
      name: obj.name.trim(),
      playerIds: obj.playerIds.map((id) => (id as string).trim()),
      currentPosition: obj.currentPosition,
      createdAt,
      updatedAt,
    };
  },
};
