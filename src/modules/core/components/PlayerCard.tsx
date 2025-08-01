import React, { useState } from 'react';
import { Player } from '@/modules/game/models/Player';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { MusicService } from '@/modules/music/services/MusicService';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Button } from '@/modules/core/components/Button';
import './PlayerCard.css';

export interface PlayerCardProps {
  player: Player;
  header?: string;
  displayAlbumArt?: boolean;
  size?: 'small' | 'medium' | 'large';
  allowPlayMusic?: boolean;
  borderColor?: string;
  playerService: PlayerService;
  musicService?: MusicService;
  onPlayerUpdated?: () => void;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  header,
  displayAlbumArt = false,
  size = 'medium',
  allowPlayMusic = false,
  borderColor,
  playerService,
  musicService,
  onPlayerUpdated,
  className = '',
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullPlayer, setFullPlayer] = useState<Player | null>(null);

  const hasSong = player.song && player.song.track;
  const canPlayMusic = allowPlayMusic && hasSong;

  const handleEdit = async () => {
    // Get the full player object for editing
    const playerData = await playerService.getPlayer(player.id);
    if (playerData) {
      setFullPlayer(playerData);
      setShowEditForm(true);
    }
  };

  const handleSavePlayer = () => {
    setShowEditForm(false);
    setFullPlayer(null);
    onPlayerUpdated?.();
  };

  const handleCancelForm = () => {
    setShowEditForm(false);
    setFullPlayer(null);
  };

  const handlePlayMusic = async () => {
    if (!hasSong || !musicService) {
      return;
    }

    setIsLoading(true);
    try {
      // Get the full player object from the service
      const playerData = await playerService.getPlayer(player.id);
      if (playerData && playerData.song) {
        // Convert start time to milliseconds
        const startTimeMs = playerData.song.startTime * 1000;
        // Convert duration to milliseconds for automatic stopping
        const durationMs = playerData.song.duration * 1000;

        // Use previewTrack with duration for automatic stopping and callback to reset button state
        await musicService.previewTrack(
          playerData.song.track.uri,
          startTimeMs,
          durationMs,
          () => {
            // Reset the playing state when the track ends
            setIsPlaying(false);
          }
        );
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play walk-up music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMusic = async () => {
    if (!musicService) {
      return;
    }

    setIsLoading(true);
    try {
      await musicService.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`player-card player-card--${size} ${header ? '' : 'player-card--no-header'} ${className}`}
        style={borderColor ? { borderColor } : undefined}
      >
        {/* Edit button - always show when musicService is available */}
        {musicService && (
          <button
            className="player-card__edit-button"
            onClick={handleEdit}
            aria-label="Edit player"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
        )}

        {/* Header */}
        {header && (
          <div className="player-card__header">
            <h3 className="player-card__header-text position-header">
              {header}
            </h3>
          </div>
        )}

        {/* Player Name */}
        <div className="player-card__name">
          <h4 className="player-card__name-text player-name">{player.name}</h4>
        </div>

        {/* Album Art */}
        {displayAlbumArt && player.song?.track.albumArt && (
          <div className="player-card__album-art">
            <img
              src={player.song.track.albumArt}
              alt={`Album art for ${player.song.track.name}`}
              className="player-card__album-art-img"
            />
          </div>
        )}

        {/* Song Information */}
        {hasSong && player.song ? (
          <div className="player-card__song-info">
            <h5 className="player-card__song-title song-title">
              {player.song.track.name}
            </h5>
            <p className="player-card__song-artist artist-name">
              by {player.song.track.artists.join(', ')}
            </p>
            <p className="player-card__song-timing timing-info">
              {player.song.startTime}s -{' '}
              {player.song.startTime + player.song.duration}s
            </p>
          </div>
        ) : (
          <div className="player-card__no-song">
            <p className="player-card__no-song-text no-song-text">
              No walk-up song selected
            </p>
          </div>
        )}

        {/* Play Music Button */}
        {canPlayMusic && (
          <div className="player-card__play-section">
            <Button
              variant={isPlaying ? 'danger' : 'success'}
              onClick={isPlaying ? handleStopMusic : handlePlayMusic}
              disabled={isLoading}
              className="player-card__play-button"
            >
              {isLoading
                ? isPlaying
                  ? 'Stopping...'
                  : 'Loading...'
                : isPlaying
                  ? 'STOP'
                  : 'PLAY'}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Player Modal */}
      {showEditForm && musicService && fullPlayer && (
        <PlayerForm
          playerService={playerService}
          musicService={musicService}
          player={fullPlayer}
          onSave={handleSavePlayer}
          onCancel={handleCancelForm}
        />
      )}
    </>
  );
};

export default PlayerCard;
