import { useState, useRef, useEffect } from 'react';
import type { Player } from '@/modules/game/models/Player';

import type { PlayerListRef } from '@/modules/game/components/PlayerList';
import { PlayerList } from '@/modules/game/components/PlayerList';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import type { SongSegment } from '@/modules/music';
import { SegmentSelector } from '@/modules/music';
import { Button } from '@/modules/core/components/Button';
import { usePlayers } from '@/modules/game/hooks/usePlayers';
import { useLineupActions } from '@/modules/game/hooks/useLineup';
import './PlayerManager.css';

interface PlayerManagerProps {
  onStartGame: () => void;
}

export function PlayerManager(props: PlayerManagerProps) {
  const { onStartGame } = props;
  const players = usePlayers();
  const lineupActions = useLineupActions();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [editingSegmentOnly, setEditingSegmentOnly] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);
  const [, setPlayersState] = useState<Player[]>([]);

  const playerListRef = useRef<PlayerListRef | null>(null);

  // Load players on component mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setPlayersState(players);
      } catch (error) {
        console.error('Failed to load players:', error);
      }
    };

    void loadPlayers();
  }, [players]);

  const handleAddPlayer = () => {
    setEditingPlayer(undefined);
    setShowForm(true);
  };

  const handleSavePlayer = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    setEditingSegmentOnly(false);
    // Refresh the player list after save
    playerListRef.current?.refreshPlayers();
    setPlayersState(players);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    setEditingSegmentOnly(false);
  };

  const handleSegmentSaved = () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
    // Refresh the player list after save
    playerListRef.current?.refreshPlayers();
    setPlayersState(players);
  };

  const handleSegmentCancelled = () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
  };

  const handleStartGame = async () => {
    try {
      const playerIds = players.map((player) => player.id);
      lineupActions.createBattingOrder(playerIds);
      lineupActions.setGameActive(true);
      onStartGame();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="player-manager">
      {/* Start Game button - only show when there are players */}
      {players.length > 0 && (
        <div className="start-game-section">
          <Button onClick={handleStartGame} variant="success" size="lg">
            Start Game
          </Button>
        </div>
      )}

      <div className="player-manager-header">
        <h1>Player Management</h1>
        <div className="header-actions">
          <Button onClick={handleAddPlayer} variant="primary">
            Add Player
          </Button>
        </div>
      </div>

      <PlayerList ref={playerListRef} />

      {showForm && (
        <PlayerForm
          player={editingPlayer}
          segmentEditOnly={editingSegmentOnly}
          onSave={handleSavePlayer}
          onCancel={handleCancelForm}
        />
      )}

      {showSegmentSelector && editingPlayer?.song && (
        <SegmentSelector
          track={editingPlayer.song.track}
          initialSegment={editingPlayer.song}
          onConfirm={async (_segment: SongSegment) => {
            // Segment-only editing handled by PlayerForm where applicable
            void handleSegmentSaved();
          }}
          onCancel={handleSegmentCancelled}
        />
      )}
    </div>
  );
}
