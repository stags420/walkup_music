// Music module exports
export { SongSegment } from './models/SongSegment';
export { SpotifyTrack } from './models/SpotifyTrack';
export type { PlaybackState, PlaybackConfig } from './models/PlaybackState';
export { DEFAULT_PLAYBACK_STATE } from './models/PlaybackState';
export type { MusicService } from './services/MusicService';
export { MockMusicService, SpotifyMusicService } from './services/MusicService';
export { SpotifyApiService } from './services/SpotifyApiService';
export {
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from './services/SpotifyPlaybackService';
export type { SpotifyPlaybackService } from './services/SpotifyPlaybackService';
export { SongSelector } from './components/SongSelector';
export { SegmentSelector } from './components/SegmentSelector';
export { MusicProvider } from './providers/MusicProvider';
export type { MusicContextType } from './providers/MusicProvider';
export { PlaybackProvider } from './providers/PlaybackProvider';
export type { PlaybackProviderProps } from './providers/PlaybackProvider';
export type { PlaybackContextType } from './contexts/PlaybackContext';
export { usePlayback } from './hooks/usePlayback';
// Service providers for stateless services
export { MusicServiceProvider } from './providers/MusicServiceProvider';
export { SpotifyApiServiceProvider } from './providers/SpotifyApiServiceProvider';
export { SpotifyPlaybackServiceProvider } from './providers/SpotifyPlaybackServiceProvider';
