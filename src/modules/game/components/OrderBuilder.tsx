import { forwardRef, useImperativeHandle } from 'react';
import type { Player } from '@/modules/game/models/Player';
import { PlayerCard } from '@/modules/core/components';
import { Button } from '@/modules/core/components/Button';
// Music service is obtained within child components as needed
// Using Bootstrap classes instead of custom CSS

interface OrderBuilderProps {
  lineup: Player[];
  availablePlayers: Player[];
  onLineupChange: (lineup: Player[], available: Player[]) => void;
}

export interface OrderBuilderRef {
  refreshData: () => void;
}

interface PlayerCardProps {
  player: Player;
  index: number;
  fromLineup: boolean;
  onAddToLineup?: (player: Player) => void;
  onRemoveFromLineup?: (player: Player) => void;
  onMoveUp?: (player: Player) => void;
  onMoveDown?: (player: Player) => void;
}

const PlayerCardComponent = (props: PlayerCardProps) => {
  return (
    <div
      className="card mb-2"
      data-testid={props.fromLineup ? 'lineup-player' : 'available-player'}
    >
      <div className="card-body p-2">
        <div className="row align-items-center">
          <div className="col-auto">
            <div className="d-flex flex-column align-items-center">
              <div className="fw-bold text-primary">
                {props.fromLineup ? `${props.index + 1}.` : ''}
              </div>
              {props.fromLineup && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => props.onRemoveFromLineup?.(props.player)}
                  data-testid={`remove-${props.player.name}`}
                >
                  −
                </Button>
              )}
            </div>
          </div>
          <div className="col">
            <PlayerCard
              player={props.player}
              allowPlayMusic={false}
              displayAlbumArt={false}
              size="small"
              className="border-0 bg-transparent p-0"
            />
          </div>
          <div className="col-auto">
            {props.fromLineup ? (
              <div className="d-flex flex-column gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => props.onMoveUp?.(props.player)}
                  disabled={props.index === 0}
                  data-testid={`move-up-${props.player.name}`}
                >
                  ↑
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => props.onMoveDown?.(props.player)}
                  disabled={props.index >= 8}
                  data-testid={`move-down-${props.player.name}`}
                >
                  ↓
                </Button>
              </div>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => props.onAddToLineup?.(props.player)}
                data-testid={`add-${props.player.name}`}
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
  (props, ref) => {
    // Avoid destructuring per lint rules
    useImperativeHandle(ref, () => ({
      refreshData: () => {
        // This could trigger a re-render or data refresh if needed
        // For now, the parent handles data loading
      },
    }));

    const handleAddToLineup = (player: Player) => {
      const newLineup = [...props.lineup, player];
      const newAvailable = props.availablePlayers.filter(
        (p) => p.id !== player.id
      );
      props.onLineupChange(newLineup, newAvailable);
    };

    const handleRemoveFromLineup = (player: Player) => {
      const newLineup = props.lineup.filter((p) => p.id !== player.id);
      const newAvailable = [...props.availablePlayers, player];
      props.onLineupChange(newLineup, newAvailable);
    };

    const handleMoveUp = (player: Player) => {
      const currentIndex = props.lineup.findIndex((p) => p.id === player.id);
      if (currentIndex > 0) {
        const newLineup = [...props.lineup];
        [newLineup[currentIndex], newLineup[currentIndex - 1]] = [
          newLineup[currentIndex - 1],
          newLineup[currentIndex],
        ];
        props.onLineupChange(newLineup, props.availablePlayers);
      }
    };

    const handleMoveDown = (player: Player) => {
      const currentIndex = props.lineup.findIndex((p) => p.id === player.id);
      if (currentIndex < props.lineup.length - 1) {
        const newLineup = [...props.lineup];
        [newLineup[currentIndex], newLineup[currentIndex + 1]] = [
          newLineup[currentIndex + 1],
          newLineup[currentIndex],
        ];
        props.onLineupChange(newLineup, props.availablePlayers);
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
                  {props.lineup.length} players
                </span>
              </div>
            </div>
            <div className="card-body">
              {props.lineup.length === 0 ? (
                <div className="text-center text-muted p-4">
                  <p className="mb-0">
                    Click the + button next to players to add them to the
                    batting lineup
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {props.lineup.map((player, index) => (
                    <PlayerCardComponent
                      key={player.id}
                      player={player}
                      index={index}
                      fromLineup={true}
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
                  {props.availablePlayers.length} players
                </span>
              </div>
            </div>
            <div className="card-body">
              {props.availablePlayers.length === 0 ? (
                <div className="text-center text-muted p-4">
                  <p className="mb-0">All players are in the lineup</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {props.availablePlayers.map((player, index) => (
                    <PlayerCardComponent
                      key={player.id}
                      player={player}
                      index={index}
                      fromLineup={false}
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
