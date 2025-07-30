import { useState } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { PlayerList } from './PlayerList';
import { PlayerForm } from './PlayerForm';
import { populateWithMockData } from '@/modules/game/utils/mockData';
import './PlayerManager.css';

interface PlayerManagerProps {
  playerService: PlayerService;
}

export function PlayerManager({ playerService }: PlayerManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();
  const [loadingMockData, setLoadingMockData] = useState(false);

  const handleAddPlayer = () => {
    setEditingPlayer(undefined);
    setShowForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    await playerService.deletePlayer(playerId);
  };

  const handleSavePlayer = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
    // PlayerList will automatically refresh via useEffect
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
  };

  const handleLoadMockData = async () => {
    try {
      setLoadingMockData(true);
      await populateWithMockData(playerService);
      // PlayerList will automatically refresh
    } catch (error) {
      console.error('Failed to load mock data:', error);
    } finally {
      setLoadingMockData(false);
    }
  };

  return (
    <div className="player-manager">
      <div className="player-manager-header">
        <h1>Player Management</h1>
        <div className="header-actions">
          <button
            onClick={handleLoadMockData}
            className="mock-data-button"
            disabled={loadingMockData}
          >
            {loadingMockData ? 'Loading...' : 'Load Test Data'}
          </button>
          <button onClick={handleAddPlayer} className="add-player-button">
            Add Player
          </button>
        </div>
      </div>

      <PlayerList
        playerService={playerService}
        onEditPlayer={handleEditPlayer}
        onDeletePlayer={handleDeletePlayer}
      />

      {showForm && (
        <PlayerForm
          playerService={playerService}
          player={editingPlayer}
          onSave={handleSavePlayer}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}
