export interface AppConfig {
  maxSegmentDuration: number; // seconds, default 10
  spotifyClientId: string;
  redirectUri: string;
  tokenRefreshBufferMinutes: number; // minutes, default 15
  basePath: string; // base path for the app (e.g., '/walkup_music' for GitHub Pages)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const AppConfig = {
  fromExternalData(data: unknown): AppConfig {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid app config data: must be an object');
    }

    const obj = data as Record<string, unknown>;

    // Set defaults for missing values
    const maxSegmentDuration = obj.maxSegmentDuration ?? 10;
    const spotifyClientId = obj.spotifyClientId ?? '';
    const redirectUri = obj.redirectUri ?? 'http://127.0.0.1:8000/callback';
    const tokenRefreshBufferMinutes = obj.tokenRefreshBufferMinutes ?? 15;
    const basePath = obj.basePath ?? '';

    if (
      typeof maxSegmentDuration !== 'number' ||
      maxSegmentDuration <= 0 ||
      maxSegmentDuration > 30
    ) {
      throw new Error(
        'Invalid app config data: maxSegmentDuration must be a number between 1 and 30'
      );
    }

    if (typeof spotifyClientId !== 'string' || !spotifyClientId.trim()) {
      throw new Error(
        'Invalid app config data: spotifyClientId must be a non-empty string'
      );
    }

    if (typeof redirectUri !== 'string' || !redirectUri.trim()) {
      throw new Error(
        'Invalid app config data: redirectUri must be a non-empty string'
      );
    }

    if (!isValidUrl(redirectUri)) {
      throw new Error(
        'Invalid app config data: redirectUri must be a valid URL'
      );
    }

    if (
      typeof tokenRefreshBufferMinutes !== 'number' ||
      tokenRefreshBufferMinutes < 1 ||
      tokenRefreshBufferMinutes > 60
    ) {
      throw new Error(
        'Invalid app config data: tokenRefreshBufferMinutes must be a number between 1 and 60'
      );
    }

    if (typeof basePath !== 'string') {
      throw new Error('Invalid app config data: basePath must be a string');
    }

    return {
      maxSegmentDuration,
      spotifyClientId: spotifyClientId.trim(),
      redirectUri: redirectUri.trim(),
      tokenRefreshBufferMinutes,
      basePath: basePath.trim(),
    };
  },
};
