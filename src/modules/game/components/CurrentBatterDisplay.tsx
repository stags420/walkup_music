import { useState, useEffect, useCallback } from 'react';
import { Player } from '@/modules/game/models/Player';
import { LineupService } from '@/modules/game/services/LineupService';
import './CurrentBatterDisplay.css';

interface CurrentBatterDisplayProps {
  lineupService: LineupService;
}

export function CurrentBatterDisplay({
  lineupService,
}: CurrentBatterDisplayProps) {
  const [currentBatter, setCurrentBatter] = useState<Player | null>(null);
  const [onDeckBatter, setOnDeckBatter] = useState<Player | null>(null);
  const [inTheHoleBatter, setInTheHoleBatter] = useState<Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handlePlayMusic = async () => {
    if (!currentBatter || !currentBatter.song) {
      return;
    }

    setIsLoading(true);
    try {
      await lineupService.playWalkUpMusic(currentBatter);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play walk-up music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMusic = async () => {
    setIsLoading(true);
    try {
      await lineupService.stopMusic();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop music:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="current-batter-card">
        <div className="current-batter-header">
          <h2>Current Batter</h2>
          <h3 className="player-name">{currentBatter.name}</h3>
        </div>

        {currentBatter.song ? (
          <div className="current-batter-content">
            <div className="album-art-section">
              <img
                src={currentBatter.song.track.albumArt}
                alt={`${currentBatter.song.track.album} album art`}
                className="album-art"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>

            <div className="song-info">
              <h4 className="song-title">{currentBatter.song.track.name}</h4>
              <p className="song-artist">
                {currentBatter.song.track.artists.join(', ')}
              </p>
              <p className="song-timing">
                {currentBatter.song.startTime}s -{' '}
                {currentBatter.song.startTime + currentBatter.song.duration}s
              </p>
            </div>

            <div className="playback-controls">
              <div className="control-buttons">
                {isPlaying ? (
                  <button
                    onClick={handleStopMusic}
                    disabled={isLoading}
                    className="stop-button"
                  >
                    {isLoading ? 'Stopping...' : 'Stop Music'}
                  </button>
                ) : (
                  <button
                    onClick={handlePlayMusic}
                    disabled={isLoading}
                    className="play-button"
                  >
                    {isLoading ? 'Loading...' : 'Play Walk-Up Music'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-song-warning">
            <p>⚠️ Current batter has no song selected</p>
          </div>
        )}
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

    const positionClass = `secondary-batter-card ${position}`;

    if (!batter) {
      return (
        <div className={positionClass}>
          <h4>{positionLabels[position]}</h4>
          <p className="no-player">No player assigned</p>
        </div>
      );
    }

    return (
      <div className={positionClass}>
        <h4>{positionLabels[position]}</h4>
        <div className="secondary-player-info">
          <h5>{batter.name}</h5>
          {batter.song ? (
            <div className="secondary-song-info">
              <p className="song-title">{batter.song.track.name}</p>
              <p className="song-artist">
                {batter.song.track.artists.join(', ')}
              </p>
            </div>
          ) : (
            <p className="no-song">No song selected</p>
          )}
        </div>
      </div>
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
