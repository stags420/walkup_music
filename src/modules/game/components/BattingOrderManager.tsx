import { useState, useRef, useEffect, useCallback } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { LineupService } from '@/modules/game/services/LineupService';
import { PlayerForm } from './PlayerForm';
import { OrderBuilder } from './OrderBuilder';
import { SegmentSelector, SongSegment } from '@/modules/music';
import './BattingOrderManager.css';

interface BattingOrderManagerProps {
  playerService: PlayerService;
  musicService: MusicService;
  lineupService: LineupService;
  onStartGame: () => void;
}

export function BattingOrderManager({
  playerService,
  musicService,
  lineupService,
  onStartGame,
}: BattingOrderManagerProps) {
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
      const players = await playerService.getAllPlayers();
      setAllPlayers(players);

      // Check if there's an existing batting order
      const currentOrder = lineupService.getCurrentBattingOrder();
      if (currentOrder) {
        const lineupPlayers = currentOrder.playerIds
          .map((id) => players.find((p) => p.id === id))
          .filter(Boolean) as Player[];
        const available = players.filter(
          (p) => !currentOrder.playerIds.includes(p.id)
        );
        setLineup(lineupPlayers);
        setAvailablePlayers(available);
      } else {
        // No existing order, all players are available
        setLineup([]);
        setAvailablePlayers(players);
      }
    } catch (error) {
      console.error('Failed to load players and lineup:', error);
    }
  }, [playerService, lineupService]);

  // Load players and lineup on component mount
  useEffect(() => {
    loadPlayersAndLineup();
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
      await lineupService.createBattingOrder(playerIds);
    }
  };

  const handleStartGame = async () => {
    try {
      if (lineup.length === 0) {
        // If no lineup, use all players
        const playerIds = allPlayers.map((p) => p.id);
        await lineupService.createBattingOrder(playerIds);
      } else {
        // Use current lineup
        const playerIds = lineup.map((p) => p.id);
        await lineupService.createBattingOrder(playerIds);
      }
      lineupService.startGame();
      onStartGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const canStartGame = lineup.length > 0 || allPlayers.length > 0;

  return (
    <div className="batting-order-manager">
      {/* Start Game button - only show when there are players in lineup or available */}
      {canStartGame && (
        <div className="start-game-section">
          <button
            onClick={handleStartGame}
            className="start-game-button"
            data-testid="start-game-button"
          >
            Start Game
          </button>
        </div>
      )}

      <div className="batting-order-manager-header">
        <h1>Lineup</h1>
        <div className="header-actions">
          <button
            onClick={handleAddPlayer}
            className="add-player-button"
            data-testid="add-player-button"
          >
            Add Player
          </button>
        </div>
      </div>

      <div data-testid="player-list">
        <OrderBuilder
          ref={orderBuilderRef}
          lineup={lineup}
          availablePlayers={availablePlayers}
          onLineupChange={handleLineupChange}
          musicService={musicService}
          playerService={playerService}
        />
      </div>

      {showForm && (
        <div data-testid="player-form">
          <PlayerForm
            playerService={playerService}
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
          onConfirm={async (segment: SongSegment) => {
            try {
              await playerService.updatePlayer(editingPlayer.id, {
                song: segment,
              });
              handleSegmentSaved();
            } catch (error) {
              console.error('Failed to update timing:', error);
            }
          }}
          onCancel={handleSegmentCancelled}
        />
      )}
    </div>
  );
}
