import { forwardRef, useImperativeHandle } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { PlayerCard } from '@/modules/core/components';
import { MusicService } from '@/modules/music/services/MusicService';
import './OrderBuilder.css';

interface OrderBuilderProps {
  lineup: Player[];
  availablePlayers: Player[];
  onLineupChange: (lineup: Player[], available: Player[]) => void;
  musicService: MusicService;
  playerService: PlayerService;
}

export interface OrderBuilderRef {
  refreshData: () => void;
}

interface PlayerCardProps {
  player: Player;
  index: number;
  fromLineup: boolean;
  musicService: MusicService;
  playerService: PlayerService;
  onAddToLineup?: (player: Player) => void;
  onRemoveFromLineup?: (player: Player) => void;
  onMoveUp?: (player: Player) => void;
  onMoveDown?: (player: Player) => void;
}

const PlayerCardComponent = ({
  player,
  index,
  fromLineup,
  musicService,
  playerService,
  onAddToLineup,
  onRemoveFromLineup,
  onMoveUp,
  onMoveDown,
}: PlayerCardProps) => {
  return (
    <div className="order-builder-player-wrapper">
      <div className="left-actions">
        <div className="batting-position">
          {fromLineup ? `${index + 1}.` : ''}
        </div>
        {fromLineup && (
          <button
            className="action-button remove-button"
            onClick={() => onRemoveFromLineup?.(player)}
            title="Remove from lineup"
            aria-label={`Remove ${player.name} from lineup`}
          >
            <span>−</span>
          </button>
        )}
      </div>
      <div className="player-card-content">
        <PlayerCard
          player={player}
          musicService={musicService}
          playerService={playerService}
          allowPlayMusic={false}
          displayAlbumArt={false}
          size="small"
          className="order-builder-player-card"
        />
        <div className="player-actions">
          {fromLineup ? (
            <div className="move-buttons">
              <button
                className="action-button move-button"
                onClick={() => onMoveUp?.(player)}
                disabled={index === 0}
                title={index === 0 ? 'Already at top' : 'Move up'}
                aria-label={`Move ${player.name} up in lineup`}
              >
                ↑
              </button>
              <button
                className="action-button move-button"
                onClick={() => onMoveDown?.(player)}
                disabled={index >= 8}
                title={index >= 8 ? 'Already at bottom' : 'Move down'}
                aria-label={`Move ${player.name} down in lineup`}
              >
                ↓
              </button>
            </div>
          ) : (
            <button
              className="action-button add-button"
              onClick={() => onAddToLineup?.(player)}
              title="Add to lineup"
              aria-label={`Add ${player.name} to lineup`}
            >
              <span>+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrderBuilder = forwardRef<OrderBuilderRef, OrderBuilderProps>(
  (
    { lineup, availablePlayers, onLineupChange, musicService, playerService },
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      refreshData: () => {
        // This could trigger a re-render or data refresh if needed
        // For now, the parent handles data loading
      },
    }));

    const handleAddToLineup = (player: Player) => {
      const newLineup = [...lineup, player];
      const newAvailable = availablePlayers.filter((p) => p.id !== player.id);
      onLineupChange(newLineup, newAvailable);
    };

    const handleRemoveFromLineup = (player: Player) => {
      const newLineup = lineup.filter((p) => p.id !== player.id);
      const newAvailable = [...availablePlayers, player];
      onLineupChange(newLineup, newAvailable);
    };

    const handleMoveUp = (player: Player) => {
      const currentIndex = lineup.findIndex((p) => p.id === player.id);
      if (currentIndex > 0) {
        const newLineup = [...lineup];
        [newLineup[currentIndex], newLineup[currentIndex - 1]] = [
          newLineup[currentIndex - 1],
          newLineup[currentIndex],
        ];
        onLineupChange(newLineup, availablePlayers);
      }
    };

    const handleMoveDown = (player: Player) => {
      const currentIndex = lineup.findIndex((p) => p.id === player.id);
      if (currentIndex < lineup.length - 1) {
        const newLineup = [...lineup];
        [newLineup[currentIndex], newLineup[currentIndex + 1]] = [
          newLineup[currentIndex + 1],
          newLineup[currentIndex],
        ];
        onLineupChange(newLineup, availablePlayers);
      }
    };

    return (
      <div className="order-builder">
        <div className="order-builder-columns">
          {/* Lineup Column */}
          <div className="order-builder-column lineup-column">
            <div className="column-header">
              <h2>Batting Lineup</h2>
              <span className="player-count">{lineup.length} players</span>
            </div>
            <div className="column-content">
              {lineup.length === 0 ? (
                <div className="empty-message">
                  Click the + button next to players to add them to the batting
                  lineup
                </div>
              ) : (
                lineup.map((player, index) => (
                  <PlayerCardComponent
                    key={player.id}
                    player={player}
                    index={index}
                    fromLineup={true}
                    musicService={musicService}
                    playerService={playerService}
                    onRemoveFromLineup={handleRemoveFromLineup}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))
              )}
            </div>
          </div>

          {/* Bench Column */}
          <div className="order-builder-column available-column">
            <div className="column-header">
              <h2>Bench</h2>
              <span className="player-count">
                {availablePlayers.length} players
              </span>
            </div>
            <div className="column-content">
              {availablePlayers.length === 0 ? (
                <div className="empty-message">
                  All players are in the lineup
                </div>
              ) : (
                availablePlayers.map((player, index) => (
                  <PlayerCardComponent
                    key={player.id}
                    player={player}
                    index={index}
                    fromLineup={false}
                    musicService={musicService}
                    playerService={playerService}
                    onAddToLineup={handleAddToLineup}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OrderBuilder.displayName = 'OrderBuilder';
