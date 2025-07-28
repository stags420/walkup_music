// Core data models
export interface Player {
  id: string;
  name: string;
  song?: {
    spotifyId: string;
    title: string;
    artist: string;
    albumArt: string;
    previewUrl: string;
    startTime: number; // seconds
    duration: number; // seconds (max configurable, default 10)
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BattingOrder {
  id: string;
  name: string;
  playerIds: string[];
  currentPosition: number;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface AppConfig {
  maxSegmentDuration: number; // seconds, default 10
  spotifyClientId: string;
  redirectUri: string;
}
