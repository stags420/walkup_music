import { useState } from 'react';
import { LineupService } from '@/modules/game/services/LineupService';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { Modal } from '@/modules/core/components';
import { CurrentBatterDisplay } from './CurrentBatterDisplay';
import './GameMode.css';

interface GameModeProps {
  lineupService: LineupService;
  playerService: PlayerService;
  musicService: MusicService;
  onEndGame: () => void;
}

export function GameMode({
  lineupService,
  playerService,
  musicService,
  onEndGame,
}: GameModeProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false);

  const handleBatterChanged = () => {
    // Force refresh of the batter display
    setRefreshKey((prev) => prev + 1);
  };

  const handleEndGameClick = () => {
    setShowEndGameConfirmation(true);
  };

  const handleConfirmEndGame = () => {
    lineupService.endGame();
    onEndGame();
    setShowEndGameConfirmation(false);
  };

  const handleCancelEndGame = () => {
    setShowEndGameConfirmation(false);
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
      <div className="game-controls">
        <button
          onClick={handleNextBatter}
          disabled={isLoading}
          className="next-batter-button"
          data-testid="next-batter-button"
        >
          {isLoading ? 'Advancing...' : 'Next Batter'}
        </button>
        <button
          onClick={handleEndGameClick}
          className="end-game-button"
          data-testid="end-game-button"
        >
          End Game
        </button>
      </div>

      <div key={refreshKey}>
        <CurrentBatterDisplay
          lineupService={lineupService}
          playerService={playerService}
          musicService={musicService}
        />
      </div>

      <Modal
        isOpen={showEndGameConfirmation}
        onClose={handleCancelEndGame}
        title="End Game"
        actions={
          <div className="modal-actions">
            <button onClick={handleCancelEndGame} className="cancel-button">
              Cancel
            </button>
            <button onClick={handleConfirmEndGame} className="confirm-button">
              End Game
            </button>
          </div>
        }
      >
        <p>End the current game? This will clear all game progress.</p>
      </Modal>
    </div>
  );
}
