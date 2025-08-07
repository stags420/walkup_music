import { forwardRef, useImperativeHandle } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { PlayerCard } from '@/modules/core/components';
import { Button } from '@/modules/core/components/Button';
import { MusicService } from '@/modules/music/services/MusicService';
// Using Bootstrap classes instead of custom CSS

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
    <div
      className="card mb-2"
      data-testid={fromLineup ? 'lineup-player' : 'available-player'}
    >
      <div className="card-body p-2">
        <div className="row align-items-center">
          <div className="col-auto">
            <div className="d-flex flex-column align-items-center">
              <div className="fw-bold text-primary">
                {fromLineup ? `${index + 1}.` : ''}
              </div>
              {fromLineup && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onRemoveFromLineup?.(player)}
                  data-testid={`remove-${player.name}`}
                >
                  −
                </Button>
              )}
            </div>
          </div>
          <div className="col">
            <PlayerCard
              player={player}
              musicService={musicService}
              playerService={playerService}
              allowPlayMusic={false}
              displayAlbumArt={false}
              size="small"
              className="border-0 bg-transparent p-0"
            />
          </div>
          <div className="col-auto">
            {fromLineup ? (
              <div className="d-flex flex-column gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onMoveUp?.(player)}
                  disabled={index === 0}
                  data-testid={`move-up-${player.name}`}
                >
                  ↑
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => onMoveDown?.(player)}
                  disabled={index >= 8}
                  data-testid={`move-down-${player.name}`}
                >
                  ↓
                </Button>
              </div>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => onAddToLineup?.(player)}
                data-testid={`add-${player.name}`}
              >
                +
              </Button>
            )}
          </div>
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
      <div className="row">
        {/* Lineup Column */}
        <div className="col-12 col-lg-6 mb-4" data-testid="lineup-column">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Batting Lineup</h2>
                <span className="badge bg-primary">
                  {lineup.length} players
                </span>
              </div>
            </div>
            <div className="card-body">
              {lineup.length === 0 ? (
                <div className="text-center text-muted p-4">
                  <p className="mb-0">
                    Click the + button next to players to add them to the
                    batting lineup
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {lineup.map((player, index) => (
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bench Column */}
        <div
          className="col-12 col-lg-6 mb-4"
          data-testid="available-players-column"
        >
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Bench</h2>
                <span className="badge bg-secondary">
                  {availablePlayers.length} players
                </span>
              </div>
            </div>
            <div className="card-body">
              {availablePlayers.length === 0 ? (
                <div className="text-center text-muted p-4">
                  <p className="mb-0">All players are in the lineup</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {availablePlayers.map((player, index) => (
                    <PlayerCardComponent
                      key={player.id}
                      player={player}
                      index={index}
                      fromLineup={false}
                      musicService={musicService}
                      playerService={playerService}
                      onAddToLineup={handleAddToLineup}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OrderBuilder.displayName = 'OrderBuilder';
