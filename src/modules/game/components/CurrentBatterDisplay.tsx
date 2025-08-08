import { useState, useEffect, useCallback } from 'react';
import type { Player } from '@/modules/game/models/Player';
import type { LineupService } from '@/modules/game/services/LineupService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import {
  useLineupService,
  useMusicService,
  usePlayerService,
} from '@/modules/app/hooks/useServices';
import { PlayerCard } from '@/modules/core/components';
// Using Bootstrap classes instead of custom CSS

interface CurrentBatterDisplayProps {
  lineupService?: LineupService;
  playerService?: PlayerService;
  musicService?: MusicService;
}

export function CurrentBatterDisplay({
  lineupService: injectedLineupService,
  playerService: injectedPlayerService,
  musicService: injectedMusicService,
}: CurrentBatterDisplayProps) {
  const defaultLineupService = useLineupService();
  const defaultPlayerService = usePlayerService();
  const defaultMusicService = useMusicService();
  const lineupService = injectedLineupService ?? defaultLineupService;
  const playerService = injectedPlayerService ?? defaultPlayerService;
  const musicService = injectedMusicService ?? defaultMusicService;
  const [currentBatter, setCurrentBatter] = useState<Player | null>(null);
  const [onDeckBatter, setOnDeckBatter] = useState<Player | null>(null);
  const [inTheHoleBatter, setInTheHoleBatter] = useState<Player | null>(null);

  // Refresh batter information
  const refreshBatters = useCallback(async () => {
    try {
      const [current, onDeck, inTheHole] = await Promise.all([
        lineupService.getCurrentBatter(),
        lineupService.getOnDeckBatter(),
        lineupService.getInTheHoleBatter(),
      ]);

      setCurrentBatter(current);
      setOnDeckBatter(onDeck);
      setInTheHoleBatter(inTheHole);
    } catch (error) {
      console.error('Failed to refresh batters:', error);
    }
  }, [lineupService]);

  // Refresh batters when component mounts or lineup service changes
  useEffect(() => {
    refreshBatters();
  }, [refreshBatters]);

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
          playerService={playerService}
          musicService={musicService}
          onPlayerUpdated={refreshBatters}
          className="current-batter-card"
        />
      </div>
    );
  };

  const renderSecondaryBatter = (
    batter: Player | null,
    position: 'on-deck' | 'in-the-hole'
  ) => {
    const positionLabels = {
      'on-deck': 'On Deck',
      'in-the-hole': 'In The Hole',
    };

    const borderColors = {
      'on-deck': '#1db954',
      'in-the-hole': '#666666',
    };

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
          playerService={playerService}
          musicService={musicService}
          onPlayerUpdated={refreshBatters}
          className={`secondary-batter-card ${position}`}
        />
      </div>
    );
  };

  return (
    <div data-testid="current-batter-display">
      {/* Current batter - prominent display */}
      <div className="row mb-4">
        <div className="col-12 col-md-8 col-lg-6 mx-auto">
          {renderCurrentBatter()}
        </div>
      </div>

      {/* Secondary batters - on deck and in the hole */}
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
