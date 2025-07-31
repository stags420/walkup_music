// Music module exports
export { SongSegment } from './models/SongSegment';
export { SpotifyTrack } from './models/SpotifyTrack';
export type { MusicService } from './services/MusicService';
export { MockMusicService } from './services/MusicService';
export { SongSelector } from './components/SongSelector';
export { SegmentSelector } from './components/SegmentSelector';
export { MusicProvider } from './providers/MusicProvider';
export type { MusicContextType } from './providers/MusicProvider';
export { useMusic } from './hooks/useMusic';
// Service provider for stateless MusicService
export { MusicServiceProvider } from './providers/MusicServiceProvider';
