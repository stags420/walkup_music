import { useState, useEffect, useRef } from 'react';
import { createPortal as defaultCreatePortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SongSegment } from '@/modules/music/models/SongSegment';
import { Button, TrackPreview } from '@/modules/core';
import { MusicService } from '@/modules/music/services/MusicService';
import './SegmentSelector.css';

interface SegmentSelectorProps {
  track: SpotifyTrack;
  musicService: MusicService;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackReady, setIsPlaybackReady] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackDurationSeconds = Math.floor(track.durationMs / 1000);

  useEffect(() => {
    // Check if playback is ready when component mounts
    const checkPlaybackReady = async () => {
      try {
        // Check if playback service is ready without trying to play
        if (
          musicService.isPlaybackConnected() &&
          musicService.isPlaybackReady()
        ) {
          setIsPlaybackReady(true);
          setPlaybackError(null);
        } else {
          // If not ready, set error message but don't try to play
          setPlaybackError(
            'Spotify playback not available, using preview audio'
          );
          setIsPlaybackReady(false);
        }
      } catch (error) {
        console.warn('Playback not ready, will use fallback preview:', error);
        setPlaybackError('Spotify playback not available, using preview audio');
        setIsPlaybackReady(false);
      }
    };

    checkPlaybackReady();

    return () => {
      // Cleanup playback timeout
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, [track.uri, musicService]);

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

  const handlePlayPreview = async () => {
    if (isPlaying) {
      // Stop playback
      try {
        await musicService.pause();
      } catch (error) {
        console.debug('Playback pause failed:', error);
      }
      setIsPlaying(false);

      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
    } else {
      // Start playback
      try {
        const startPositionMs = startTime * 1000;
        await musicService.playTrack(track.uri, startPositionMs);
        setIsPlaying(true);
        setPlaybackError(null);

        // Stop after the selected duration
        playbackTimeoutRef.current = setTimeout(async () => {
          try {
            await musicService.pause();
          } catch (error) {
            console.debug('Playback pause failed:', error);
          }
          setIsPlaying(false);
          playbackTimeoutRef.current = null;
        }, duration * 1000);
      } catch (error) {
        console.error('Playback failed:', error);
        setPlaybackError(
          'Failed to play track. Please check your Spotify Premium subscription.'
        );
        setIsPlaying(false);
      }
    }
  };

  const handleConfirm = () => {
    const segment: SongSegment = {
      track,
      startTime,
      duration,
    };
    onConfirm(segment);
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
          <h2>Select Song Segment</h2>
          <button
            onClick={onCancel}
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
            onPlay={handlePlayPreview}
            isPlaying={isPlaying}
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
              <h3>Select Timing</h3>

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
                  {isPlaybackReady && (
                    <p className="playback-status">
                      <span className="status-indicator ready">●</span>
                      Spotify playback ready
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="segment-selector-actions">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="btn-success">
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
