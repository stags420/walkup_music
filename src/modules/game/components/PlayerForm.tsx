import { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Alert, Card } from 'react-bootstrap';
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
  const [hideMainModal, setHideMainModal] = useState(false);
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
                  style={{ color: 'black' }}
                  placeholder="Enter player name"
                  disabled={loading}
                  required
                  autoFocus
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
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEM0Mi4yIDIwIDUwIDI3LjggNTAgMzhDNTAgNDguMiA0Mi4yIDU2IDMyIDU2QzIxLjggNTYgMTQgNDguMiAxNCAzOEMxNCAyNy44IDIxLjggMjAgMzIgMjBaIiBmaWxsPSIjRTVFN0VCIi8+CjwvcmVnPgo8L3N2Zz4K';
                        }}
                      />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <h6
                          className="mb-1 fw-bold text-truncate"
                          style={{ color: 'black' }}
                        >
                          {song.track.name}
                        </h6>
                        <p
                          className="mb-1 text-muted text-truncate"
                          style={{ fontSize: '0.9rem' }}
                        >
                          by {song.track.artists.join(', ')}
                        </p>
                        <p
                          className="mb-1 text-muted text-truncate"
                          style={{ fontSize: '0.8rem' }}
                        >
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
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {!isSegmentEdit && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleChangeSong}
                          disabled={loading}
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
                    <p className="text-muted mb-3">
                      No walk-up song selected. Choose a song to play when this
                      player bats.
                    </p>
                    <Button
                      variant="primary"
                      onClick={handleSelectSong}
                      disabled={loading}
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
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={loading || (!isSegmentEdit && !name.trim())}
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
    </>
  );
}
