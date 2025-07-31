import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { FormEvent, MouseEvent } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import {
  MusicService,
  SongSelector,
  SegmentSelector,
  SpotifyTrack,
  SongSegment,
} from '@/modules/music';
// import './PlayerForm.css'; // Using Bootstrap classes instead

interface PlayerFormProps {
  playerService: PlayerService;
  musicService: MusicService;
  player?: Player; // If provided, we're editing; otherwise creating
  segmentEditOnly?: boolean; // If true, only allow editing the song segment
  onSave: (player: Player) => void;
  onCancel: () => void;
}

export function PlayerForm({
  playerService,
  musicService,
  player,
  segmentEditOnly = false,
  onSave,
  onCancel,
}: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '');
  const [song, setSong] = useState<SongSegment | undefined>(player?.song);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

  const isEditing = !!player;
  const isSegmentEdit = segmentEditOnly && !!player?.song;

  useEffect(() => {
    setName(player?.name || '');
    setSong(player?.song);
    setError(null);
    // If this is a segment-only edit, auto-show the segment selector
    if (segmentEditOnly && player?.song) {
      setSelectedTrack(player.song.track);
      setShowSegmentSelector(true);
    }
  }, [player, segmentEditOnly]);

  const handleCancel = useCallback(() => {
    setName(player?.name || '');
    setSong(player?.song);
    setError(null);
    setShowSongSelector(false);
    setShowSegmentSelector(false);
    setSelectedTrack(null);
    onCancel();
  }, [player?.name, player?.song, onCancel]);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleCancel]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Player name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedPlayer: Player;
      const playerData = { name: trimmedName, song };
      savedPlayer = await (isEditing
        ? playerService.updatePlayer(player.id, playerData)
        : playerService.createPlayer(trimmedName));

      // Update the song if it was selected
      if (song && savedPlayer.id) {
        savedPlayer = await playerService.updatePlayer(savedPlayer.id, {
          song,
        });
      }

      onSave(savedPlayer);
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Failed to save player'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = () => {
    setShowSongSelector(true);
  };

  const handleTrackSelected = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setShowSongSelector(false);
    setShowSegmentSelector(true);
  };

  const handleSegmentConfirmed = async (segment: SongSegment) => {
    setSong(segment);
    setShowSegmentSelector(false);
    setSelectedTrack(null);

    // If we're in segment-only edit mode, save immediately
    if (isSegmentEdit && player) {
      try {
        setLoading(true);
        setError(null);

        const updatedPlayer = await playerService.updatePlayer(player.id, {
          song: segment,
        });

        onSave(updatedPlayer);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : 'Failed to update timing'
        );
        setLoading(false);
      }
    }
  };

  const handleRemoveSong = () => {
    setSong(undefined);
  };

  const handleChangeSong = () => {
    setShowSongSelector(true);
  };

  const handleCancelSongSelection = () => {
    setShowSongSelector(false);
    setSelectedTrack(null);
  };

  const handleCancelSegmentSelection = () => {
    setShowSegmentSelector(false);
    setSelectedTrack(null);
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return createPortal(
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      onClick={handleOverlayClick}
      style={{
        zIndex: 1055,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{
          margin: '0 auto',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: 0,
          }}
        >
          <div className="modal-header">
            <h5 className="modal-title">
              {isSegmentEdit
                ? 'Edit Song Timing'
                : isEditing
                  ? 'Edit Player'
                  : 'Add New Player'}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={handleCancel}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit} role="form">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {!isSegmentEdit && (
                <div className="mb-3">
                  <label htmlFor="player-name" className="form-label">
                    Player Name *
                  </label>
                  <input
                    id="player-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    style={{ color: 'black' }}
                    placeholder="Enter player name"
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>
              )}

              <div className="mb-3">
                <h6 className="mb-2">
                  {isSegmentEdit ? 'Adjust Song Timing' : 'Walk-up Song'}
                </h6>
                {song ? (
                  <div className="card">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          src={song.track.albumArt}
                          alt={`${song.track.album} album cover`}
                          className="rounded me-3"
                          style={{
                            width: '64px',
                            height: '64px',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEM0Mi4yIDIwIDUwIDI3LjggNTAgMzhDNTAgNDguMiA0Mi4yIDU2IDMyIDU2QzIxLjggNTYgMTQgNDguMiAxNCAzOEMxNCAyNy44IDIxLjggMjAgMzIgMjBaIiBmaWxsPSIjRTVFN0VCIi8+CjwvcmVnPgo8L3N2Zz4K';
                          }}
                        />
                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="mb-1 text-truncate">
                            {song.track.name}
                          </h6>
                          <p className="mb-1 text-muted small">
                            by {song.track.artists.join(', ')}
                          </p>
                          <p className="mb-1 text-muted small">
                            {song.track.album}
                          </p>
                          <p
                            className="mb-0 text-muted"
                            style={{
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            Plays from {song.startTime}s for {song.duration}s
                          </p>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap justify-content-center">
                        {!isSegmentEdit && (
                          <button
                            type="button"
                            onClick={handleChangeSong}
                            className="btn btn-primary btn-sm me-2"
                            disabled={loading}
                          >
                            Change Song
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (song) {
                              setSelectedTrack(song.track);
                              setShowSegmentSelector(true);
                            }
                          }}
                          className="btn btn-success btn-sm me-2"
                          disabled={loading}
                        >
                          {isSegmentEdit ? 'Adjust Timing' : 'Edit Timing'}
                        </button>
                        {!isSegmentEdit && (
                          <button
                            type="button"
                            onClick={handleRemoveSong}
                            className="btn btn-outline-danger btn-sm"
                            disabled={loading}
                          >
                            Remove Song
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isSegmentEdit ? null : (
                  <div className="card">
                    <div className="card-body text-center p-4">
                      <p className="text-muted mb-3">
                        No walk-up song selected. Choose a song to play when
                        this player bats.
                      </p>
                      <button
                        type="button"
                        onClick={handleSelectSong}
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        Select Song
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary me-2"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || (!isSegmentEdit && !name.trim())}
                >
                  {loading
                    ? 'Saving...'
                    : isSegmentEdit
                      ? 'Update Timing'
                      : isEditing
                        ? 'Update Player'
                        : 'Add Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showSongSelector && (
        <SongSelector
          musicService={musicService}
          onSelectTrack={handleTrackSelected}
          onCancel={handleCancelSongSelection}
        />
      )}

      {showSegmentSelector && selectedTrack && (
        <SegmentSelector
          track={selectedTrack}
          initialSegment={song}
          onConfirm={handleSegmentConfirmed}
          onCancel={handleCancelSegmentSelection}
        />
      )}
    </div>,
    document.body
  );
}
