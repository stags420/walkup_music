import { useMemo } from 'react';
import type { Player } from '@/modules/game/models/Player';

import { usePlayers } from '@/modules/game/hooks/usePlayers';
import { useBattingOrder, useGameActive } from '@/modules/game/hooks/useLineup';
import { PlayerCard } from '@/modules/core/components';
// Using Bootstrap classes instead of custom CSS

export function CurrentBatterDisplay() {
  const currentBattingOrder = useBattingOrder();
  const isGameActive = useGameActive();
  const players = usePlayers();
  // No longer passing music service down; components fetch their own

  const playersById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const player of players) map.set(player.id, player);
    return map;
  }, [players]);

  const getBatterAtOffset = (offset: number): Player | undefined => {
    if (!currentBattingOrder || !isGameActive) return undefined;
    const { playerIds, currentPosition } = currentBattingOrder;
    if (playerIds.length === 0) return undefined;
    const pos = (currentPosition + offset) % playerIds.length;
    return playersById.get(playerIds[pos]);
  };

  const currentBatter = getBatterAtOffset(0);
  const lineupLength = currentBattingOrder?.playerIds.length ?? 0;
  const onDeckBatter = lineupLength >= 2 ? getBatterAtOffset(1) : undefined;
  const inTheHoleBatter = lineupLength >= 3 ? getBatterAtOffset(2) : undefined;

  const renderCurrentBatter = () => {
    if (!currentBatter) {
      return (
        <div className="card text-center">
          <div className="card-body">
            <h2 className="card-title">Current Batter</h2>
            <p className="card-text text-muted">No player assigned</p>
          </div>
        </div>
      );
    }

    return (
      <div data-testid="current-batter-name">
        <PlayerCard
          player={{
            id: currentBatter.id,
            name: currentBatter.name,
            song: currentBatter.song,
            createdAt: currentBatter.createdAt,
            updatedAt: currentBatter.updatedAt,
          }}
          header="BATTER UP"
          size="large"
          displayAlbumArt={true}
          allowPlayMusic={true}
          className="current-batter-card"
        />
      </div>
    );
  };

  const renderSecondaryBatter = (
    batter: Player | undefined,
    position: 'on-deck' | 'in-the-hole'
  ) => {
    const positionLabels = {
      'on-deck': 'On Deck',
      'in-the-hole': 'In The Hole',
    } as const;

    const borderColors = {
      'on-deck': '#1db954',
      'in-the-hole': '#666666',
    } as const;

    if (!batter) {
      return (
        <div className="card text-center">
          <div className="card-body">
            <h4 className="card-title h6">{positionLabels[position]}</h4>
            <p className="card-text text-muted small">No player assigned</p>
          </div>
        </div>
      );
    }

    return (
      <div
        data-testid={
          position === 'on-deck'
            ? 'on-deck-batter-name'
            : 'in-the-hole-batter-name'
        }
      >
        <PlayerCard
          player={{
            id: batter.id,
            name: batter.name,
            song: batter.song,
            createdAt: batter.createdAt,
            updatedAt: batter.updatedAt,
          }}
          header={positionLabels[position]}
          size="medium"
          displayAlbumArt={false}
          allowPlayMusic={false}
          borderColor={borderColors[position]}
          className={`secondary-batter-card ${position}`}
        />
      </div>
    );
  };

  return (
    <div data-testid="current-batter-display">
      <div className="row mb-4">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          {renderCurrentBatter()}
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-md-6 mb-3">
          {renderSecondaryBatter(onDeckBatter, 'on-deck')}
        </div>
        <div className="col-12 col-md-6 mb-3">
          {renderSecondaryBatter(inTheHoleBatter, 'in-the-hole')}
        </div>
      </div>
    </div>
  );
}
