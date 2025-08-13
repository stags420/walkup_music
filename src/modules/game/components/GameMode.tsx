import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Button } from '@/modules/core/components/Button';
import { useLineupActions } from '@/modules/game/hooks/useLineup';
import { CurrentBatterDisplay } from '@/modules/game/components/CurrentBatterDisplay';
// Using Bootstrap classes instead of custom CSS

export function GameMode() {
  const lineupActions = useLineupActions();
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
    lineupActions.setGameActive(false);
    setShowEndGameConfirmation(false);
  };

  const handleCancelEndGame = () => {
    setShowEndGameConfirmation(false);
  };

  const handleNextBatter = async () => {
    setIsLoading(true);
    try {
      lineupActions.next();
      handleBatterChanged();
    } catch (error) {
      console.error('Failed to advance to next batter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-3">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-center gap-3">
            <Button
              onClick={handleNextBatter}
              disabled={isLoading}
              variant="primary"
              size="lg"
              data-testid="next-batter-button"
            >
              {isLoading ? 'Advancing...' : 'Next Batter'}
            </Button>
            <Button
              onClick={handleEndGameClick}
              variant="outline-danger"
              size="lg"
              data-testid="end-game-button"
            >
              End Game
            </Button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div key={refreshKey}>
            <CurrentBatterDisplay />
          </div>
        </div>
      </div>

      <Modal
        show={showEndGameConfirmation}
        onHide={handleCancelEndGame}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>End Game</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>End the current game? This will clear all game progress.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelEndGame}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmEndGame}
            className="confirm-button"
          >
            End Game
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
