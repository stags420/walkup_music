// Music module exports
export { SongSegment } from '@/modules/music/models/SongSegment';
export { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
export type { MusicService } from '@/modules/music/services/MusicService';
export { MockMusicService } from '@/modules/music/services/MusicService';
export { SpotifyMusicService } from '@/modules/music/services/impl/SpotifyMusicService';
export { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
export {
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from '@/modules/music/services/impl/SpotifyPlaybackService';
export type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
export { SongSelector } from '@/modules/music/components/SongSelector';
export { SegmentSelector } from '@/modules/music/components/SegmentSelector';
