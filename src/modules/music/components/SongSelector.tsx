import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { MusicService } from '@/modules/music/services/MusicService';
import './SongSelector.css';

interface SongSelectorProps {
  musicService: MusicService;
  onSelectTrack: (track: SpotifyTrack) => void;
  onCancel: () => void;
  initialSearchQuery?: string;
}

const formatDuration = (durationMs: number) => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function SongSelector({
  musicService,
  onSelectTrack,
  onCancel,
  initialSearchQuery = '',
}: SongSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    const searchTracks = async () => {
      if (!searchQuery.trim()) {
        setTracks([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await musicService.searchTracks(searchQuery.trim());
        setTracks(results);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Search failed');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchTracks, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, musicService]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedTrackId(null);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    setSelectedTrackId(track.id);
  };

  const handleConfirmSelection = () => {
    const selectedTrack = tracks.find((track) => track.id === selectedTrackId);
    if (selectedTrack) {
      onSelectTrack(selectedTrack);
    }
  };

  return createPortal(
    <div className="song-selector-overlay">
      <div className="song-selector-modal">
        <div className="song-selector-header">
          <h2>Select Walk-up Song</h2>
          <button
            onClick={onCancel}
            className="close-button"
            aria-label="Close song selector"
          >
            ×
          </button>
        </div>

        <div className="song-selector-content">
          <div className="search-section">
            <label htmlFor="song-search" className="search-label">
              Search for songs, artists, or albums
            </label>
            <input
              id="song-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
              placeholder="e.g., Eye of the Tiger, Queen, Metallica..."
              autoFocus
            />
          </div>

          <div className="results-section">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner" aria-hidden="true"></div>
                <p>Searching for songs...</p>
              </div>
            )}

            {error && (
              <div className="error-state">
                <p className="error-message">Error: {error}</p>
                <button
                  onClick={() => setSearchQuery(searchQuery + ' ')}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              searchQuery.trim() &&
              tracks.length === 0 && (
                <div className="no-results-state">
                  <p>
                    No songs found for "{searchQuery}". Try a different search
                    term.
                  </p>
                </div>
              )}

            {!loading && !error && tracks.length > 0 && (
              <div className="tracks-grid">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`track-card ${selectedTrackId === track.id ? 'selected' : ''}`}
                    onClick={() => handleTrackSelect(track)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTrackSelect(track);
                      }
                    }}
                  >
                    <div className="track-album-art">
                      <img
                        src={track.albumArt}
                        alt={`${track.album} album cover`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEM0Mi4yIDIwIDUwIDI3LjggNTAgMzhDNTAgNDguMiA0Mi4yIDU2IDMyIDU2QzIxLjggNTYgMTQgNDguMiAxNCAzOEMxNCAyNy44IDIxLjggMjAgMzIgMjBaIiBmaWxsPSIjRTVFN0VCIi8+CjwvcmVnPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <div className="track-info">
                      <h3 className="track-name">{track.name}</h3>
                      <p className="track-artist">{track.artists.join(', ')}</p>
                      <p className="track-album">{track.album}</p>
                      <p className="track-duration">
                        {formatDuration(track.durationMs)}
                      </p>
                    </div>
                    {selectedTrackId === track.id && (
                      <div className="selected-indicator" aria-hidden="true">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="empty-state">
                <p>Start typing to search for songs...</p>
              </div>
            )}
          </div>
        </div>

        <div className="song-selector-actions">
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            className="select-button"
            disabled={!selectedTrackId}
          >
            Select Song
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
