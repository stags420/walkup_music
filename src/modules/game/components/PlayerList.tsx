import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import './PlayerList.css';

interface PlayerListProps {
  playerService: PlayerService;
  onEditPlayer: (player: Player) => void;
  onEditSegment: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
}

export interface PlayerListRef {
  refreshPlayers: () => void;
}

export const PlayerList = forwardRef<PlayerListRef, PlayerListProps>(
  function PlayerList(
    { playerService, onEditPlayer, onEditSegment, onDeletePlayer },
    ref
  ) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
      playerId: string;
      playerName: string;
    } | null>(null);

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

    // Expose refresh function to parent component
    useImperativeHandle(
      ref,
      () => ({
        refreshPlayers: loadPlayers,
      }),
      [loadPlayers]
    );

    // Auto-load test data if no players exist
    const loadPlayersWithAutoInit = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedPlayers = await playerService.getAllPlayers();

        // If no players exist, auto-load some test data for better UX
        if (loadedPlayers.length === 0) {
          const testPlayers = [
            'Mike Johnson',
            'Sarah Williams',
            'David Rodriguez',
            'Emily Chen',
            'Alex Thompson',
          ];

          for (const name of testPlayers) {
            await playerService.createPlayer(name);
          }

          // Load the newly created players
          const playersAfterInit = await playerService.getAllPlayers();
          setPlayers(playersAfterInit);
        } else {
          setPlayers(loadedPlayers);
        }
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : 'Failed to load players'
        );
      } finally {
        setLoading(false);
      }
    }, [playerService]);

    useEffect(() => {
      loadPlayersWithAutoInit();
    }, [loadPlayersWithAutoInit]);

    const handleDelete = (playerId: string, playerName: string) => {
      setDeleteConfirmation({ playerId, playerName });
    };

    const handleConfirmDelete = async () => {
      if (!deleteConfirmation) return;

      try {
        await onDeletePlayer(deleteConfirmation.playerId);
        await loadPlayers(); // Refresh the list
        setDeleteConfirmation(null);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : 'Failed to delete player'
        );
        setDeleteConfirmation(null);
      }
    };

    const handleCancelDelete = () => {
      setDeleteConfirmation(null);
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
                  Edit Player
                </button>
                {player.song && (
                  <button
                    onClick={() => onEditSegment(player)}
                    className="edit-segment-button"
                    aria-label={`Edit song timing for ${player.name}`}
                  >
                    Edit Timing
                  </button>
                )}
                <button
                  onClick={() => handleDelete(player.id, player.name)}
                  className="delete-button"
                  aria-label={`Delete ${player.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {deleteConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-dialog">
              <h3>Delete Player</h3>
              <p>
                Are you sure you want to delete {deleteConfirmation.playerName}?
              </p>
              <div className="confirmation-actions">
                <button onClick={handleCancelDelete} className="cancel-button">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
