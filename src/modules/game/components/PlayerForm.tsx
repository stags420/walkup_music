import { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Alert, Card } from 'react-bootstrap';
import { Button } from '@/modules/core/components/Button';
import type { FormEvent, MouseEvent } from 'react';
import type { Player } from '@/modules/game/models/Player';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService, SpotifyTrack, SongSegment } from '@/modules/music';
import { SongSelector, SegmentSelector } from '@/modules/music';
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
  const [hideMainModal, setHideMainModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSubmit = async (
    e?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();

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

  const handleDeletePlayer = async () => {
    if (!player) return;

    try {
      setLoading(true);
      setError(null);
      await playerService.deletePlayer(player.id);
      onSave({ ...player, id: '' }); // Signal deletion
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Failed to delete player'
      );
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSelectSong = () => {
    setHideMainModal(true);
    setShowSongSelector(true);
  };

  const handleTrackSelected = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setShowSongSelector(false);
    setShowSegmentSelector(true);
    // Keep main modal hidden while segment selector is open
  };

  const handleSegmentConfirmed = async (segment: SongSegment) => {
    setSong(segment);
    setShowSegmentSelector(false);
    setSelectedTrack(null);
    setHideMainModal(false);

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
    setHideMainModal(true);
    setShowSongSelector(true);
  };

  const handleCancelSongSelection = () => {
    setShowSongSelector(false);
    setSelectedTrack(null);
    setHideMainModal(false);
  };

  const handleCancelSegmentSelection = () => {
    setShowSegmentSelector(false);
    setSelectedTrack(null);
    setHideMainModal(false);
  };

  return (
    <>
      <Modal
        show={!hideMainModal}
        onHide={handleCancel}
        centered
        backdrop="static"
        style={{ backdropFilter: 'blur(4px)' }}
        data-testid="player-form"
      >
        <Modal.Header closeButton={!loading}>
          <Modal.Title>
            {isSegmentEdit
              ? 'Edit Song Timing'
              : isEditing
                ? 'Edit Player'
                : 'Add New Player'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            {!isSegmentEdit && (
              <Form.Group className="mb-3">
                <Form.Label htmlFor="player-name">Player Name *</Form.Label>
                <Form.Control
                  id="player-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter player name"
                  disabled={loading}
                  required
                  data-testid="player-name-input"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Walk-up Song</Form.Label>
              {song ? (
                <Card>
                  <Card.Body>
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <img
                        src={song.track.albumArt}
                        alt={`${song.track.album} album art`}
                        className="rounded"
                        style={{
                          width: '64px',
                          height: '64px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMkEyQTI5Ii8+CjxwYXRoIGQ9Ik0zMiAyMEM0Mi4yIDIwIDUwIDI3LjggNTAgMzhDNTAgNDguMiA0Mi4yIDU2IDMyIDU2QzIxLjggNTYgMTQgNDguMiAxNCAzOEMxNCAyNy44IDIxLjggMjAgMzIgMjBaIiBmaWxsPSIjMkEyQTI5Ii8+CjwvcmVnPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <h6 className="mb-1 fw-bold text-truncate song-title">
                          {song.track.name}
                        </h6>
                        <p className="mb-1 text-truncate artist-name">
                          by {song.track.artists.join(', ')}
                        </p>
                        <p className="mb-1 text-truncate album-name">
                          {song.track.album}
                        </p>
                        <p className="mb-0 timing-info">
                          Plays from {song.startTime}s for {song.duration}s
                        </p>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {!isSegmentEdit && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleChangeSong}
                          disabled={loading}
                          data-testid="select-song-button"
                        >
                          Change Song
                        </Button>
                      )}
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          if (song) {
                            setSelectedTrack(song.track);
                            setHideMainModal(true);
                            setShowSegmentSelector(true);
                          }
                        }}
                        disabled={loading}
                      >
                        {isSegmentEdit ? 'Adjust Timing' : 'Edit Timing'}
                      </Button>
                      {!isSegmentEdit && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemoveSong}
                          disabled={loading}
                        >
                          Remove Song
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ) : isSegmentEdit ? null : (
                <Card>
                  <Card.Body className="text-center p-4">
                    <p className="mb-3 no-song-text">
                      No walk-up song selected. Choose a song to play when this
                      player bats.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleSelectSong}
                      disabled={loading}
                      data-testid="select-song-button"
                    >
                      Select Song
                    </Button>
                  </Card.Body>
                </Card>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          {isEditing && !isSegmentEdit && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              style={{ marginRight: 'auto' }}
              data-testid="delete-player-button"
            >
              Delete Player
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
            data-testid="cancel-player-button"
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading || (!isSegmentEdit && !name.trim())}
            data-testid="save-player-button"
          >
            {loading
              ? 'Saving...'
              : isSegmentEdit
                ? 'Update Timing'
                : isEditing
                  ? 'Update Player'
                  : 'Add Player'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Player</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete "{player?.name}"? This action cannot
            be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeletePlayer}
            disabled={loading}
            data-testid="confirm-delete-button"
          >
            {loading ? 'Deleting...' : 'Delete Player'}
          </Button>
        </Modal.Footer>
      </Modal>

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
          musicService={musicService}
          initialSegment={song}
          onConfirm={handleSegmentConfirmed}
          onCancel={handleCancelSegmentSelection}
        />
      )}
    </>
  );
}
