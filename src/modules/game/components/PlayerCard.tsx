import React, { useState } from 'react';
import type { Player } from '@/modules/game/models/Player';
import { useMusicService } from '@/modules/app/hooks/useServices';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import { Button } from '@/modules/core/components/Button';
import { PlayButton } from '@/modules/core/components/PlayButton';
import './PlayerCard.css';

export interface PlayerCardProps {
  player: Player;
  header?: string;
  displayAlbumArt?: boolean;
  size?: 'small' | 'medium' | 'large';
  allowPlayMusic?: boolean;
  borderColor?: string;
  onPlayerUpdated?: () => void;
  className?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = (props) => {
  const {
    player,
    header,
    displayAlbumArt = false,
    size = 'medium',
    allowPlayMusic = false,
    borderColor,
    onPlayerUpdated,
    className = '',
  } = props;
  const musicService = useMusicService();
  const [showEditForm, setShowEditForm] = useState(false);
  const [fullPlayer, setFullPlayer] = useState<Player | undefined>();

  const hasSong = player.song && player.song.track;
  const canPlayMusic = allowPlayMusic && hasSong;

  const handleEdit = async () => {
    // Get the full player object for editing
    setFullPlayer(player);
    setShowEditForm(true);
  };

  const handleSavePlayer = () => {
    setShowEditForm(false);
    setFullPlayer(undefined);
    onPlayerUpdated?.();
  };

  const handleCancelForm = () => {
    setShowEditForm(false);
    setFullPlayer(undefined);
  };

  return (
    <>
      <div
        className={`player-card player-card--${size} ${header ? '' : 'player-card--no-header'} ${className}`}
        style={borderColor ? { borderColor } : undefined}
        data-testid="player-card"
      >
        {/* Edit button - always show when musicService is available */}
        {musicService && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleEdit}
            className="player-card__edit-button"
            data-testid="edit-player-button"
            aria-label="Edit player"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </Button>
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
          <h4
            className="player-card__name-text player-name"
            data-testid="player-name"
          >
            {player.name}
          </h4>
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
        {canPlayMusic && player.song && (
          <div className="player-card__play-section">
            <PlayButton
              track={player.song.track}
              musicService={musicService}
              startTime={player.song.startTime}
              duration={player.song.duration}
              variant="success"
              className="player-card__play-button"
              playText="PLAY"
              pauseText="STOP"
              data-testid="play-button"
            />
          </div>
        )}
      </div>

      {/* Edit Player Modal */}
      {showEditForm && musicService && fullPlayer && (
        <PlayerForm
          player={fullPlayer}
          onSave={handleSavePlayer}
          onCancel={handleCancelForm}
        />
      )}
    </>
  );
};

export default PlayerCard;
