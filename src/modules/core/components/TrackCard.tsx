import { Button } from '@/modules/core/components/Button';
import './TrackCard.css';

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

interface TrackCardProps {
  track: Track;
  isSelected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  isPlaying?: boolean;
  variant?: 'compact' | 'detailed';
  'data-testid'?: string;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function TrackCard({
  track,
  isSelected = false,
  onSelect,
  onPreview,
  isPlaying = false,
  variant = 'compact',
  'data-testid': dataTestId,
}: TrackCardProps) {
  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map((artist) => artist.name).join(', ');

  return (
    <div
      className={`track-card track-card-${variant} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      data-testid={dataTestId}
    >
      {albumArt && (
        <div className="track-album-art">
          <img src={albumArt} alt={track.album.name} />
        </div>
      )}

      <div className="track-info">
        <div className="track-details">
          <div className="track-name song-title">{track.name}</div>
          <div className="track-artist artist-name">{artistNames}</div>
          {variant === 'detailed' && (
            <div className="track-album album-name">{track.album.name}</div>
          )}
        </div>
      </div>

      <div className="track-duration">{formatDuration(track.duration_ms)}</div>

      <div className="track-actions">
        {track.preview_url && (
          <Button
            variant={isPlaying ? 'danger' : 'success'}
            size="sm"
            className={`preview-button ${isPlaying ? 'playing' : ''}`}
            onClick={(e) => {
              e?.stopPropagation();
              onPreview?.();
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </Button>
        )}

        {isSelected && <div className="selected-indicator">✓</div>}
      </div>
    </div>
  );
}

export default TrackCard;
