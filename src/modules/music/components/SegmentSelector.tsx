import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Form, Alert, Card, Button } from 'react-bootstrap';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SongSegment } from '@/modules/music/models/SongSegment';
import { TrackPreview } from '@/modules/core';
import { MusicService } from '@/modules/music/services/MusicService';

interface SegmentSelectorProps {
  track: SpotifyTrack;
  musicService?: MusicService;
  initialSegment?: SongSegment;
  onConfirm: (segment: SongSegment) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds, default 10
}

export function SegmentSelector({
  track,
  musicService,
  initialSegment,
  onConfirm,
  onCancel,
  maxDuration = 10,
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

  return (
    <Modal
      show={true}
      onHide={handleCancel}
      centered
      backdrop="static"
      size="lg"
      data-testid="segment-selector"
    >
      <Modal.Header closeButton>
        <Modal.Title>Select Timing</Modal.Title>
      </Modal.Header>

      <Modal.Body>
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
          <Alert variant="danger" className="mt-3">
            <div>{playbackError}</div>
            <small className="text-muted">
              Note: Spotify Premium is required for full playback control.
            </small>
          </Alert>
        )}

        <div className="mt-4">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label htmlFor="start-time">Start Time</Form.Label>
              <div className="input-group">
                <Form.Control
                  id="start-time"
                  type="number"
                  min="0"
                  max={maxStartTime}
                  value={startTime}
                  onChange={handleStartTimeChange}
                  step="0.1"
                />
                <span className="input-group-text">seconds</span>
              </div>
              <Form.Text className="text-muted">
                Range: 0 - {formatTime(maxStartTime)}
              </Form.Text>
            </div>

            <div className="col-md-6">
              <Form.Label htmlFor="duration">Duration</Form.Label>
              <div className="input-group">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    const newDuration = Math.min(
                      maxDuration,
                      Math.min(trackDurationSeconds - startTime, duration + 0.5)
                    );
                    setDuration(newDuration);
                  }}
                  disabled={
                    duration >=
                    Math.min(maxDuration, trackDurationSeconds - startTime)
                  }
                >
                  +
                </Button>
                <Form.Control
                  id="duration"
                  type="number"
                  min="1"
                  max={Math.min(maxDuration, trackDurationSeconds - startTime)}
                  value={duration}
                  onChange={handleDurationChange}
                  className="text-center"
                  step="0.1"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    const newDuration = Math.max(1, duration - 0.5);
                    setDuration(newDuration);
                  }}
                  disabled={duration <= 1}
                >
                  −
                </Button>
                <span className="input-group-text">seconds</span>
              </div>
              <Form.Text className="text-muted">
                Max: {Math.min(maxDuration, trackDurationSeconds - startTime)}{' '}
                seconds
              </Form.Text>
            </div>
          </div>

          <Card className="mt-3">
            <Card.Body>
              <div className="segment-timeline mb-3">
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
                <div className="d-flex justify-content-between">
                  <small className="text-muted">0:00</small>
                  <small className="text-muted">
                    {formatTime(trackDurationSeconds)}
                  </small>
                </div>
              </div>

              <div className="text-center">
                <p className="mb-3">
                  <strong>Selected segment:</strong> {formatTime(startTime)} -{' '}
                  {formatTime(startTime + duration)}
                </p>

                <Button
                  variant={isPlayingSelection ? 'danger' : 'success'}
                  size="lg"
                  onClick={handlePlaySelection}
                  disabled={!musicService}
                  data-testid={
                    isPlayingSelection ? 'pause-button' : 'play-button'
                  }
                >
                  {isPlayingSelection ? (
                    <>⏸ Stop Selection</>
                  ) : (
                    <>▶ Play Selection</>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="success"
          onClick={handleConfirm}
          data-testid="confirm-song-button"
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
