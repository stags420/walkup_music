import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { MusicService } from '@/modules/music/services/MusicService';
import { usePlayers } from '@/modules/game/hooks/usePlayers';
import { PlayerCard } from '@/modules/core/components';
import { Button } from '@/modules/core/components/Button';
import './PlayerList.css';

interface PlayerListProps {
  musicService?: MusicService;
}

export interface PlayerListRef {
  refreshPlayers: () => void;
}

export const PlayerList = forwardRef<PlayerListRef, PlayerListProps>(
  function PlayerList(_props, ref) {
    const players = usePlayers();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const loadPlayers = useCallback(async () => {
      try {
        setLoading(false);
        setError(undefined);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : 'Failed to load players'
        );
      }
    }, []);

    // Expose refresh function to parent component
    useImperativeHandle(
      ref,
      () => ({
        refreshPlayers: loadPlayers,
      }),
      [loadPlayers]
    );

    useEffect(() => {
      void loadPlayers();
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
          <Button onClick={loadPlayers} variant="primary">
            Retry
          </Button>
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
              onPlayerUpdated={loadPlayers}
              className="player-management-card"
            />
          ))}
        </div>
      </div>
    );
  }
);
