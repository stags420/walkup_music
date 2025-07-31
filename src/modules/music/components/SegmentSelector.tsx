import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal as defaultCreatePortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SongSegment } from '@/modules/music/models/SongSegment';
import { Button, TrackPreview } from '@/modules/core';
import { MusicService } from '@/modules/music/services/MusicService';
import './SegmentSelector.css';

interface SegmentSelectorProps {
  track: SpotifyTrack;
  musicService?: MusicService;
  initialSegment?: SongSegment;
  onConfirm: (segment: SongSegment) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds, default 10
  createPortal?: typeof defaultCreatePortal;
}

export function SegmentSelector({
  track,
  musicService,
  initialSegment,
  onConfirm,
  onCancel,
  maxDuration = 10,
  createPortal = defaultCreatePortal,
}: SegmentSelectorProps) {
  const [startTime, setStartTime] = useState(initialSegment?.startTime || 0);
  const [duration, setDuration] = useState(
    initialSegment?.duration || Math.min(maxDuration, 10)
  );
  const [isPlayingSelection, setIsPlayingSelection] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);

  const trackDurationSeconds = Math.floor(track.durationMs / 1000);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = globalThis.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Cleanup function to stop playback
  const stopPlayback = useCallback(async () => {
    if (isPlayingRef.current && musicService) {
      try {
        await musicService.pause();
      } catch (error) {
        console.debug('Playback pause failed:', error);
      }
      setIsPlayingSelection(false);
      isPlayingRef.current = false;
    }
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
  }, [musicService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  // Cleanup when modal is closed
  const handleCancel = () => {
    stopPlayback()
      .then(() => {
        onCancel();
      })
      .catch((error) => {
        console.error('Failed to stop playback on cancel:', error);
        onCancel();
      });
  };

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStartTime = Math.max(
      0,
      Math.min(trackDurationSeconds - 1, parseInt(e.target.value) || 0)
    );
    setStartTime(newStartTime);
  };

  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(
      1,
      Math.min(maxDuration, parseInt(e.target.value) || 1)
    );
    setDuration(newDuration);
  };

  const handlePlaySelection = async () => {
    if (!musicService) {
      console.warn('MusicService not available for playback');
      setPlaybackError('MusicService not available for playback');
      return;
    }

    if (isPlayingRef.current) {
      // Stop selection playback
      await stopPlayback();
    } else {
      // Start playback from selected segment
      try {
        const startPositionMs = startTime * 1000;

        // Clear any existing timeout first
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }

        await musicService.playTrack(track.uri, startPositionMs);
        setIsPlayingSelection(true);
        isPlayingRef.current = true;
        setPlaybackError(null);

        // Stop after the selected duration
        playbackTimeoutRef.current = setTimeout(async () => {
          if (isPlayingRef.current && musicService) {
            try {
              await musicService.pause();
            } catch (error) {
              console.error('Failed to stop playback after timeout:', error);
            }
            setIsPlayingSelection(false);
            isPlayingRef.current = false;
          }
          playbackTimeoutRef.current = null;
        }, duration * 1000);
      } catch (error) {
        console.error('Playback failed:', error);
        setPlaybackError(
          'Failed to play track. Please check your Spotify Premium subscription.'
        );
        setIsPlayingSelection(false);
        isPlayingRef.current = false;
        // Clear timeout if playback fails
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }
      }
    }
  };

  const handleConfirm = () => {
    stopPlayback()
      .then(() => {
        const segment: SongSegment = {
          track,
          startTime,
          duration,
        };
        onConfirm(segment);
      })
      .catch((error) => {
        console.error('Failed to stop playback on confirm:', error);
        const segment: SongSegment = {
          track,
          startTime,
          duration,
        };
        onConfirm(segment);
      });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const maxStartTime = Math.max(0, trackDurationSeconds - duration);

  return createPortal(
    <div className="segment-selector-overlay">
      <div className="segment-selector-modal">
        <div className="segment-selector-header">
          <h2>Select Timing</h2>
          <button
            onClick={handleCancel}
            className="close-button"
            aria-label="Close segment selector"
          >
            ×
          </button>
        </div>

        <div className="segment-selector-content">
          <TrackPreview
            track={{
              id: track.id,
              name: track.name,
              artists: track.artists.map((name) => ({ name })),
              album: {
                name: track.album,
                images: [{ url: track.albumArt }],
              },
              duration_ms: track.durationMs,
              preview_url: track.previewUrl,
            }}
          />

          {playbackError && (
            <div className="playback-error">
              <p className="error-message">{playbackError}</p>
              <p className="error-hint">
                Note: Spotify Premium is required for full playback control.
              </p>
            </div>
          )}

          <div className="segment-controls">
            <div className="timing-section">
              <div className="timing-controls">
                <div className="control-group">
                  <label htmlFor="start-time" className="control-label">
                    Start Time
                  </label>
                  <div className="input-with-unit">
                    <input
                      id="start-time"
                      type="number"
                      min="0"
                      max={maxStartTime}
                      value={startTime}
                      onChange={handleStartTimeChange}
                      className="timing-input"
                    />
                    <span className="input-unit">seconds</span>
                  </div>
                  <div className="control-hint">
                    Range: 0 - {formatTime(maxStartTime)}
                  </div>
                </div>

                <div className="control-group">
                  <label htmlFor="duration" className="control-label">
                    Duration
                  </label>
                  <div className="input-with-unit">
                    <input
                      id="duration"
                      type="number"
                      min="1"
                      max={Math.min(
                        maxDuration,
                        trackDurationSeconds - startTime
                      )}
                      value={duration}
                      onChange={handleDurationChange}
                      className="timing-input"
                    />
                    <span className="input-unit">seconds</span>
                  </div>
                  <div className="control-hint">
                    Max:{' '}
                    {Math.min(maxDuration, trackDurationSeconds - startTime)}{' '}
                    seconds
                  </div>
                </div>
              </div>

              <div className="segment-preview">
                <div className="segment-timeline">
                  <div className="timeline-track">
                    <div
                      className="timeline-segment"
                      style={{
                        left: `${(startTime / trackDurationSeconds) * 100}%`,
                        width: `${(duration / trackDurationSeconds) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="timeline-labels">
                    <span>0:00</span>
                    <span>{formatTime(trackDurationSeconds)}</span>
                  </div>
                </div>
                <div className="segment-info">
                  <p>
                    <strong>Selected segment:</strong> {formatTime(startTime)} -{' '}
                    {formatTime(startTime + duration)}
                  </p>

                  {/* Play Selection Button moved inside segment-info */}
                  <div className="play-selection-section">
                    <button
                      className={`play-button selection ${isPlayingSelection ? 'playing' : ''}`}
                      onClick={handlePlaySelection}
                      disabled={!musicService}
                    >
                      {isPlayingSelection ? (
                        <>⏸ STOP SELECTION</>
                      ) : (
                        <>▶ PLAY SELECTION</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="segment-selector-actions">
          <Button onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="btn-success">
            Confirm
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
