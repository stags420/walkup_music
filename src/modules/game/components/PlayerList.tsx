import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import './PlayerList.css';

interface PlayerListProps {
  playerService: PlayerService;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
}

export function PlayerList({
  playerService,
  onEditPlayer,
  onDeletePlayer,
}: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedPlayers = await playerService.getAllPlayers();
      setPlayers(loadedPlayers);
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Failed to load players'
      );
    } finally {
      setLoading(false);
    }
  }, [playerService]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleDelete = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await onDeletePlayer(playerId);
      await loadPlayers(); // Refresh the list
    } catch (error_) {
      setError(
        error_ instanceof Error ? error_.message : 'Failed to delete player'
      );
    }
  };

  if (loading) {
    return (
      <div className="player-list-loading">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-list-error">
        <p>Error: {error}</p>
        <button onClick={loadPlayers} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="player-list-empty">
        <p>No players found. Add your first player to get started!</p>
      </div>
    );
  }

  return (
    <div className="player-list">
      <h2>Players ({players.length})</h2>
      <div className="player-grid">
        {players.map((player) => (
          <div key={player.id} className="player-card">
            <div className="player-info">
              <h3 className="player-name">{player.name}</h3>
              {player.song ? (
                <div className="player-song">
                  <p className="song-title">{player.song.track.name}</p>
                  <p className="song-artist">
                    by {player.song.track.artists.join(', ')}
                  </p>
                  <p className="song-timing">
                    {player.song.startTime}s -{' '}
                    {player.song.startTime + player.song.duration}s
                  </p>
                </div>
              ) : (
                <p className="no-song">No walk-up song selected</p>
              )}
            </div>
            <div className="player-actions">
              <button
                onClick={() => onEditPlayer(player)}
                className="edit-button"
                aria-label={`Edit ${player.name}`}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(player.id)}
                className="delete-button"
                aria-label={`Delete ${player.name}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
