import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/modules/game/models/Player';
import { LineupService } from '@/modules/game/services/LineupService';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { PlayerCard } from '@/modules/core/components';
import './CurrentBatterDisplay.css';

interface CurrentBatterDisplayProps {
  lineupService: LineupService;
  playerService: PlayerService;
  musicService: MusicService;
}

export function CurrentBatterDisplay({
  lineupService,
  playerService,
  musicService,
}: CurrentBatterDisplayProps) {
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
        <div className="current-batter-card">
          <h2>Current Batter</h2>
          <p className="no-player">No player assigned</p>
        </div>
      );
    }

    return (
      <PlayerCard
        player={{
          id: currentBatter.id,
          name: currentBatter.name,
          song: currentBatter.song
            ? {
                title: currentBatter.song.track.name,
                artist: currentBatter.song.track.artists.join(', '),
                albumArt: currentBatter.song.track.albumArt,
                timing: `${currentBatter.song.startTime}s - ${currentBatter.song.startTime + currentBatter.song.duration}s`,
              }
            : undefined,
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
        <div className={`secondary-batter-card ${position}`}>
          <h4>{positionLabels[position]}</h4>
          <p className="no-player">No player assigned</p>
        </div>
      );
    }

    return (
      <PlayerCard
        player={{
          id: batter.id,
          name: batter.name,
          song: batter.song
            ? {
                title: batter.song.track.name,
                artist: batter.song.track.artists.join(', '),
                timing: `${batter.song.startTime}s - ${batter.song.startTime + batter.song.duration}s`,
              }
            : undefined,
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
    );
  };

  return (
    <div className="current-batter-display">
      {/* Current batter - prominent display */}
      {renderCurrentBatter()}

      {/* Secondary batters - on deck and in the hole */}
      <div className="secondary-batters">
        {renderSecondaryBatter(onDeckBatter, 'on-deck')}
        {renderSecondaryBatter(inTheHoleBatter, 'in-the-hole')}
      </div>
    </div>
  );
}
