import { PlaybackControls } from './PlaybackControls';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import './TrackPreview.css';

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  preview_url?: string;
}

interface TrackPreviewProps {
  track: Track;
  variant?: 'full' | 'compact' | 'minimal';
  showPlayControls?: boolean;
  showAlbumArt?: boolean;
  onPlay?: () => void;
  onSelect?: () => void;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Convert Track to SpotifyTrack format
const convertToSpotifyTrack = (track: Track): SpotifyTrack => ({
  id: track.id,
  name: track.name,
  artists: track.artists.map((artist) => artist.name),
  album: track.album.name,
  albumArt: track.album.images[0]?.url || '',
  previewUrl: track.preview_url || '',
  durationMs: track.duration_ms,
  uri: `spotify:track:${track.id}`,
});

export function TrackPreview({
  track,
  variant = 'full',
  showPlayControls = false,
  showAlbumArt = true,
  onPlay,
  onSelect,
}: TrackPreviewProps) {
  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map((artist) => artist.name).join(', ');

  return (
    <div className={`track-preview track-preview--${variant}`}>
      <div className="track-info">
        {showAlbumArt && albumArt && (
          <img
            src={albumArt}
            alt={track.album.name}
            className="track-album-art"
          />
        )}
        <div className="track-details">
          <div className="track-name song-title">{track.name}</div>
          <div className="track-artist artist-name">{artistNames}</div>
          {variant === 'full' && (
            <div className="track-album">{track.album.name}</div>
          )}
          <div className="track-duration">
            {formatDuration(track.duration_ms)}
          </div>
        </div>
      </div>

      {(showPlayControls || onSelect) && (
        <div className="track-preview__actions">
          {showPlayControls && (
            <PlaybackControls
              track={convertToSpotifyTrack(track)}
              onPlay={onPlay}
            />
          )}

          {onSelect && (
            <button
              onClick={onSelect}
              className="button button--primary track-preview__select-button"
              data-testid="select-button"
            >
              Select
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default TrackPreview;
