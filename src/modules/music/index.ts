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
export type { SpotifyPlaybackService } from './services/SpotifyPlaybackService';
export { SongSelector } from './components/SongSelector';
export { SegmentSelector } from './components/SegmentSelector';
export { MusicProvider } from './providers/MusicProvider';
export type { MusicContextType } from './providers/MusicProvider';
// Service providers for stateless services
export { MusicServiceProvider } from './providers/MusicServiceProvider';
export { SpotifyApiServiceProvider } from './providers/SpotifyApiServiceProvider';
export { SpotifyPlaybackServiceProvider } from './providers/SpotifyPlaybackServiceProvider';
