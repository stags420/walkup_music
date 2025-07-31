// Music module exports
export { SongSegment } from './models/SongSegment';
export { SpotifyTrack } from './models/SpotifyTrack';
export type { MusicService } from './services/MusicService';
export { MockMusicService, SpotifyMusicService } from './services/MusicService';
export { SpotifyApiService } from './services/SpotifyApiService';
export {
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from './services/SpotifyPlaybackService';
export type {
  SpotifyPlaybackService,
  WebPlaybackState,
  WebPlaybackTrack,
  SpotifyPlayer,
  SpotifyWebPlaybackSDK,
} from './services/SpotifyPlaybackService';
export { SongSelector } from './components/SongSelector';
export { SegmentSelector } from './components/SegmentSelector';
export { MusicProvider } from './providers/MusicProvider';
export type { MusicContextType } from './providers/MusicProvider';
export { useMusic } from './hooks/useMusic';
// Service provider for stateless MusicService
export { MusicServiceProvider } from './providers/MusicServiceProvider';
