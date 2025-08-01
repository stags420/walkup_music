import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlayingRef = useRef(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

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
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsPlayingSelection(false);
      }
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
      isMountedRef.current = false;
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

  // Touch and mouse handling functions
  const handleSegmentStart = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return;

      setIsDragging(true);
      setDragStartX(clientX);
      setDragStartTime(startTime);
    },
    [startTime]
  );

  const handleSegmentMove = useCallback(
    (clientX: number) => {
      if (!timelineRef.current || !isDragging) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = clientX - dragStartX;
      const timelineWidth = rect.width;
      const deltaTime = (deltaX / timelineWidth) * trackDurationSeconds;

      let newStartTime = dragStartTime + deltaTime;

      // Constrain to valid bounds
      newStartTime = Math.max(0, newStartTime);
      newStartTime = Math.min(trackDurationSeconds - duration, newStartTime);

      setStartTime(Math.round(newStartTime * 10) / 10); // Round to 1 decimal place
    },
    [isDragging, dragStartX, dragStartTime, trackDurationSeconds, duration]
  );

  const handleSegmentEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse event handlers
  const handleSegmentMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleSegmentStart(e.clientX);

      const handleMouseMove = (e: MouseEvent) => {
        handleSegmentMove(e.clientX);
      };

      const handleMouseUp = () => {
        handleSegmentEnd();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [handleSegmentStart, handleSegmentMove, handleSegmentEnd]
  );

  // Touch event handlers for mobile
  const handleSegmentTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleSegmentStart(touch.clientX);
    },
    [handleSegmentStart]
  );

  const handleSegmentTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleSegmentMove(touch.clientX);
    },
    [handleSegmentMove]
  );

  const handleSegmentTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleSegmentEnd();
    },
    [handleSegmentEnd]
  );

  // Prevent dragging when modal is being dragged
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging if clicking directly on the segment
    e.stopPropagation();
  }, []);

  const handleStartTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStartTime = Math.max(
      0,
      Math.min(trackDurationSeconds - 1, parseFloat(e.target.value) || 0)
    );
    setStartTime(newStartTime);
  };

  const handleDurationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(
      1,
      Math.min(maxDuration, parseFloat(e.target.value) || 1)
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
                      step="0.1"
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
                    <button
                      type="button"
                      className="increment-btn"
                      onClick={() => {
                        const newDuration = Math.min(
                          maxDuration,
                          Math.min(
                            trackDurationSeconds - startTime,
                            duration + 0.5
                          )
                        );
                        setDuration(newDuration);
                      }}
                      disabled={
                        duration >=
                        Math.min(maxDuration, trackDurationSeconds - startTime)
                      }
                    >
                      +
                    </button>
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
                      step="0.1"
                    />
                    <button
                      type="button"
                      className="increment-btn"
                      onClick={() => {
                        const newDuration = Math.max(1, duration - 0.5);
                        setDuration(newDuration);
                      }}
                      disabled={duration <= 1}
                    >
                      −
                    </button>
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
                  <div
                    ref={timelineRef}
                    className="timeline-track"
                    onMouseDown={handleTimelineMouseDown}
                  >
                    <div
                      className={`timeline-segment ${isDragging ? 'dragging' : ''}`}
                      style={{
                        left: `${(startTime / trackDurationSeconds) * 100}%`,
                        width: `${(duration / trackDurationSeconds) * 100}%`,
                      }}
                      onMouseDown={handleSegmentMouseDown}
                      onTouchStart={handleSegmentTouchStart}
                      onTouchMove={handleSegmentTouchMove}
                      onTouchEnd={handleSegmentTouchEnd}
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
          <Button onClick={handleConfirm} variant="success">
            Confirm
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
