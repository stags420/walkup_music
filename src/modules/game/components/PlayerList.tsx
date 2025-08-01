import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { PlayerCard } from '@/modules/core/components';
import './PlayerList.css';

interface PlayerListProps {
  playerService: PlayerService;
  musicService: MusicService;
}

export interface PlayerListRef {
  refreshPlayers: () => void;
}

export const PlayerList = forwardRef<PlayerListRef, PlayerListProps>(
  function PlayerList({ playerService, musicService }, ref) {
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

    // Expose refresh function to parent component
    useImperativeHandle(
      ref,
      () => ({
        refreshPlayers: loadPlayers,
      }),
      [loadPlayers]
    );

    useEffect(() => {
      loadPlayers();
    }, [loadPlayers]);

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
            <PlayerCard
              key={player.id}
              player={{
                id: player.id,
                name: player.name,
                song: player.song,
                createdAt: player.createdAt,
                updatedAt: player.updatedAt,
              }}
              size="medium"
              displayAlbumArt={false}
              allowPlayMusic={false}
              playerService={playerService}
              musicService={musicService}
              onPlayerUpdated={loadPlayers}
              className="player-management-card"
            />
          ))}
        </div>
      </div>
    );
  }
);
