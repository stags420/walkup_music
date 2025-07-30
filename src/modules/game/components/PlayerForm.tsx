import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import './PlayerForm.css';

interface PlayerFormProps {
  playerService: PlayerService;
  player?: Player; // If provided, we're editing; otherwise creating
  onSave: (player: Player) => void;
  onCancel: () => void;
}

export function PlayerForm({
  playerService,
  player,
  onSave,
  onCancel,
}: PlayerFormProps) {
  const [name, setName] = useState(player?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!player;

  useEffect(() => {
    setName(player?.name || '');
    setError(null);
  }, [player]);

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
      savedPlayer = await (isEditing
        ? playerService.updatePlayer(player.id, { name: trimmedName })
        : playerService.createPlayer(trimmedName));

      onSave(savedPlayer);
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Failed to save player'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(player?.name || '');
    setError(null);
    onCancel();
  };

  return (
    <div className="player-form-overlay">
      <div className="player-form-modal">
        <div className="player-form-header">
          <h2>{isEditing ? 'Edit Player' : 'Add New Player'}</h2>
          <button
            onClick={handleCancel}
            className="close-button"
            aria-label="Close form"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="player-form" role="form">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="player-name" className="form-label">
              Player Name *
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="Enter player name"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div className="song-section">
            <h3>Walk-up Song</h3>
            {player?.song ? (
              <div className="current-song">
                <p className="song-title">{player.song.track.name}</p>
                <p className="song-artist">
                  by {player.song.track.artists.join(', ')}
                </p>
                <p className="song-timing">
                  Plays from {player.song.startTime}s for {player.song.duration}
                  s
                </p>
              </div>
            ) : (
              <p className="no-song-message">
                No song selected. Song selection will be available in a future
                update.
              </p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={loading || !name.trim()}
            >
              {loading
                ? 'Saving...'
                : isEditing
                  ? 'Update Player'
                  : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
