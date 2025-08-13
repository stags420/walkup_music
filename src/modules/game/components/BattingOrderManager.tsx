import { useState, useRef, useEffect, useCallback } from 'react';
import type { Player } from '@/modules/game/models/Player';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { OrderBuilder } from '@/modules/game/components/OrderBuilder';
import type { SongSegment } from '@/modules/music';
import { SegmentSelector } from '@/modules/music';
import { Button } from '@/modules/core/components/Button';
import { useMusicService } from '@/modules/app/hooks/useServices';
import { usePlayers } from '@/modules/game/hooks/usePlayers';
import {
  useBattingOrder,
  useLineupActions,
} from '@/modules/game/hooks/useLineup';
// Using Bootstrap classes instead of custom CSS

export function BattingOrderManager() {
  const musicService = useMusicService();
  const allPlayersState = usePlayers();
  const currentBattingOrder = useBattingOrder();
  const lineupActions = useLineupActions();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [editingSegmentOnly, setEditingSegmentOnly] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);

  const orderBuilderRef = useRef<{ refreshData: () => void } | null>(null);

  const loadPlayersAndLineup = useCallback(async () => {
    try {
      setAllPlayers(allPlayersState);

      // Check if there's an existing batting order
      const currentOrder = currentBattingOrder;
      if (currentOrder) {
        const lineupPlayers = currentOrder.playerIds
          .map((id) => allPlayersState.find((p) => p.id === id))
          .filter(Boolean) as Player[];
        const available = allPlayersState.filter(
          (p) => !currentOrder.playerIds.includes(p.id)
        );
        setLineup(lineupPlayers);
        setAvailablePlayers(available);
      } else {
        // No existing order, all players are available
        setLineup([]);
        setAvailablePlayers(allPlayersState);
      }
    } catch (error) {
      console.error('Failed to load players and lineup:', error);
    }
  }, [allPlayersState, currentBattingOrder]);

  // Load players and lineup on component mount
  useEffect(() => {
    void loadPlayersAndLineup();
  }, [loadPlayersAndLineup]);

  const handleAddPlayer = () => {
    setEditingPlayer(undefined);
    setShowForm(true);
  };

  const handleSavePlayer = async () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    setEditingSegmentOnly(false);
    await loadPlayersAndLineup();
    orderBuilderRef.current?.refreshData();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    setEditingSegmentOnly(false);
  };

  const handleSegmentSaved = async () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
    await loadPlayersAndLineup();
    orderBuilderRef.current?.refreshData();
  };

  const handleSegmentCancelled = () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
  };

  const handleLineupChange = async (
    newLineup: Player[],
    newAvailable: Player[]
  ) => {
    setLineup(newLineup);
    setAvailablePlayers(newAvailable);

    // Update the batting order in the service
    if (newLineup.length > 0) {
      const playerIds = newLineup.map((p) => p.id);
      lineupActions.createBattingOrder(playerIds);
    }
  };

  const handleStartGame = async () => {
    try {
      if (lineup.length === 0) {
        // If no lineup, use all players
        const playerIds = allPlayers.map((p) => p.id);
        lineupActions.createBattingOrder(playerIds);
      } else {
        // Use current lineup
        const playerIds = lineup.map((p) => p.id);
        lineupActions.createBattingOrder(playerIds);
      }
      lineupActions.setGameActive(true);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const canStartGame = lineup.length > 0 || allPlayers.length > 0;

  return (
    <div className="py-3">
      {/* Start Game button - only show when there are players in lineup or available */}
      {canStartGame && (
        <div className="row mb-4">
          <div className="col-12 text-center">
            <Button
              onClick={handleStartGame}
              variant="success"
              size="lg"
              className="px-4"
              data-testid="start-game-button"
            >
              Start Game
            </Button>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="mb-0">Lineup</h1>
            <Button
              onClick={handleAddPlayer}
              variant="primary"
              data-testid="add-player-button"
            >
              Add Player
            </Button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12" data-testid="player-list">
          <OrderBuilder
            ref={orderBuilderRef}
            lineup={lineup}
            availablePlayers={availablePlayers}
            onLineupChange={handleLineupChange}
            musicService={musicService}
          />
        </div>
      </div>

      {showForm && (
        <div data-testid="player-form">
          <PlayerForm
            musicService={musicService}
            player={editingPlayer}
            segmentEditOnly={editingSegmentOnly}
            onSave={handleSavePlayer}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {showSegmentSelector && editingPlayer?.song && (
        <SegmentSelector
          track={editingPlayer.song.track}
          musicService={musicService}
          initialSegment={editingPlayer.song}
          onConfirm={async (_segment: SongSegment) => {
            void handleSegmentSaved();
          }}
          onCancel={handleSegmentCancelled}
        />
      )}
    </div>
  );
}
