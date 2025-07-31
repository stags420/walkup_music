import React from 'react';
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
}: TrackCardProps) {
  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map((artist) => artist.name).join(', ');

  return (
    <div
      className={`track-card track-card-${variant} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {albumArt && (
        <div className="track-album-art">
          <img src={albumArt} alt={track.album.name} />
        </div>
      )}

      <div className="track-info">
        <div className="track-details">
          <div className="track-name">{track.name}</div>
          <div className="track-artist">{artistNames}</div>
          {variant === 'detailed' && (
            <div className="track-album">{track.album.name}</div>
          )}
        </div>
      </div>

      <div className="track-duration">{formatDuration(track.duration_ms)}</div>

      <div className="track-actions">
        {track.preview_url && (
          <button
            className={`preview-button ${isPlaying ? 'playing' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onPreview?.();
            }}
            aria-label={isPlaying ? 'Stop preview' : 'Play preview'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}

        {isSelected && <div className="selected-indicator">✓</div>}
      </div>
    </div>
  );
}
