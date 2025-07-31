import React from 'react';
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
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function TrackPreview({ track }: TrackPreviewProps) {
  const albumArt = track.album.images[0]?.url;
  const artistNames = track.artists.map((artist) => artist.name).join(', ');

  return (
    <div className="track-preview">
      <div className="track-info">
        {albumArt && (
          <img
            src={albumArt}
            alt={track.album.name}
            className="track-album-art"
          />
        )}
        <div className="track-details">
          <div className="track-name">{track.name}</div>
          <div className="track-artist">{artistNames}</div>
          <div className="track-duration">
            {formatDuration(track.duration_ms)}
          </div>
        </div>
      </div>
    </div>
  );
}
