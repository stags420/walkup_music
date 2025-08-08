import { useState, useRef, useEffect } from 'react';
import type { Player } from '@/modules/game/models/Player';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { LineupService } from '@/modules/game/services/LineupService';
import type { PlayerListRef } from '@/modules/game/components/PlayerList';
import { PlayerList } from '@/modules/game/components/PlayerList';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import type { SongSegment } from '@/modules/music';
import { SegmentSelector } from '@/modules/music';
import { Button } from '@/modules/core/components/Button';
import './PlayerManager.css';

interface PlayerManagerProps {
  playerService: PlayerService;
  musicService: MusicService;
  lineupService: LineupService;
  onStartGame: () => void;
}

export function PlayerManager({
  playerService,
  musicService,
  lineupService,
  onStartGame,
}: PlayerManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [editingSegmentOnly, setEditingSegmentOnly] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  const playerListRef = useRef<PlayerListRef>(null);

  // Load players on component mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const allPlayers = await playerService.getAllPlayers();
        setPlayers(allPlayers);
      } catch (error) {
        console.error('Failed to load players:', error);
      }
    };

    loadPlayers();
  }, [playerService]);

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
    // Reload players to update local state
    playerService.getAllPlayers().then(setPlayers);
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
    // Reload players to update local state
    playerService.getAllPlayers().then(setPlayers);
  };

  const handleSegmentCancelled = () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
  };

  const handleStartGame = async () => {
    try {
      const allPlayers = await playerService.getAllPlayers();
      const playerIds = allPlayers.map((player) => player.id);
      await lineupService.createBattingOrder(playerIds);
      lineupService.startGame();
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

      <PlayerList
        ref={playerListRef}
        playerService={playerService}
        musicService={musicService}
      />

      {showForm && (
        <PlayerForm
          playerService={playerService}
          musicService={musicService}
          player={editingPlayer}
          segmentEditOnly={editingSegmentOnly}
          onSave={handleSavePlayer}
          onCancel={handleCancelForm}
        />
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
