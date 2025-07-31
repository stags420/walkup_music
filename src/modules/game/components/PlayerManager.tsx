import { useState, useRef } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { PlayerList, PlayerListRef } from './PlayerList';
import { PlayerForm } from './PlayerForm';
import { SegmentSelector, SongSegment } from '@/modules/music';
import './PlayerManager.css';

interface PlayerManagerProps {
  playerService: PlayerService;
  musicService: MusicService;
}

export function PlayerManager({
  playerService,
  musicService,
}: PlayerManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [editingSegmentOnly, setEditingSegmentOnly] = useState(false);
  const [showSegmentSelector, setShowSegmentSelector] = useState(false);

  const playerListRef = useRef<PlayerListRef>(null);

  const handleAddPlayer = () => {
    setEditingPlayer(undefined);
    setShowForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setEditingSegmentOnly(false);
    setShowForm(true);
  };

  const handleEditSegment = (player: Player) => {
    setEditingPlayer(player);
    setShowSegmentSelector(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    await playerService.deletePlayer(playerId);
    // Refresh the player list after deletion
    playerListRef.current?.refreshPlayers();
  };

  const handleSavePlayer = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    setEditingSegmentOnly(false);
    // Refresh the player list after save
    playerListRef.current?.refreshPlayers();
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
  };

  const handleSegmentCancelled = () => {
    setShowSegmentSelector(false);
    setEditingPlayer(undefined);
  };

  return (
    <div className="player-manager">
      <div className="player-manager-header">
        <h1>Player Management</h1>
        <div className="header-actions">
          <button onClick={handleAddPlayer} className="add-player-button">
            Add Player
          </button>
        </div>
      </div>

      <PlayerList
        ref={playerListRef}
        playerService={playerService}
        onEditPlayer={handleEditPlayer}
        onEditSegment={handleEditSegment}
        onDeletePlayer={handleDeletePlayer}
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
