import { useState } from 'react';
import { LineupService } from '@/modules/game/services/LineupService';
import { CurrentBatterDisplay } from './CurrentBatterDisplay';
import './GameMode.css';

interface GameModeProps {
  lineupService: LineupService;
  onEndGame: () => void;
}

export function GameMode({ lineupService, onEndGame }: GameModeProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleBatterChanged = () => {
    // Force refresh of the batter display
    setRefreshKey((prev) => prev + 1);
  };

  const handleEndGame = () => {
    lineupService.endGame();
    onEndGame();
  };

  const handleNextBatter = async () => {
    setIsLoading(true);
    try {
      await lineupService.nextBatter();
      handleBatterChanged();
    } catch (error) {
      console.error('Failed to advance to next batter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="game-mode">
      <div className="game-mode-header">
        <h1>Game Mode</h1>
        <div className="header-controls">
          <button
            onClick={handleNextBatter}
            disabled={isLoading}
            className="next-batter-button"
          >
            {isLoading ? 'Advancing...' : 'Next Batter'}
          </button>
          <button onClick={handleEndGame} className="end-game-button">
            End Game
          </button>
        </div>
      </div>

      <div key={refreshKey}>
        <CurrentBatterDisplay lineupService={lineupService} />
      </div>
    </div>
  );
}
