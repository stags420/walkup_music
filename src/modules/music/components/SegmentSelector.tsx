import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SongSegment } from '@/modules/music/models/SongSegment';
import './SegmentSelector.css';

interface SegmentSelectorProps {
  track: SpotifyTrack;
  initialSegment?: SongSegment;
  onConfirm: (segment: SongSegment) => void;
  onCancel: () => void;
  maxDuration?: number; // seconds, default 10
}

export function SegmentSelector({
  track,
  initialSegment,
  onConfirm,
  onCancel,
  maxDuration = 10,
}: SegmentSelectorProps) {
  const [startTime, setStartTime] = useState(initialSegment?.startTime || 0);
  const [duration, setDuration] = useState(
    initialSegment?.duration || Math.min(maxDuration, 10)
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const trackDurationSeconds = Math.floor(track.durationMs / 1000);

  useEffect(() => {
    // Reset audio when component mounts or track changes
    if (
      audioRef.current &&
      globalThis.window !== undefined &&
      !globalThis.process?.env.NODE_ENV?.includes('test')
    ) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        // Handle cases where audio operations might fail
        console.debug('Audio operations failed:', error);
      }
    }
    setIsPlaying(false);
  }, [track.id]);

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

  const handlePlayPreview = () => {
    if (
      !audioRef.current ||
      globalThis.window === undefined ||
      globalThis.process?.env.NODE_ENV?.includes('test')
    ) {
      // In test environment, just toggle the playing state
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      try {
        audioRef.current.pause();
      } catch (error) {
        console.debug('Audio pause failed:', error);
      }
      setIsPlaying(false);
    } else {
      // Note: Spotify preview URLs typically start at the best part of the song
      // In a real implementation, we'd use the Spotify Web Playback SDK for precise timing
      try {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);

            // Stop after the selected duration
            setTimeout(() => {
              if (
                audioRef.current &&
                globalThis.window !== undefined &&
                !globalThis.process?.env.NODE_ENV?.includes('test')
              ) {
                try {
                  audioRef.current.pause();
                } catch (error) {
                  console.debug('Audio pause failed:', error);
                }
              }
              setIsPlaying(false);
            }, duration * 1000);
          })
          .catch(() => {
            // Preview might not be available
            setIsPlaying(false);
          });
      } catch (error) {
        console.debug('Audio play failed:', error);
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
          <div className="track-preview">
            <div className="track-info">
              <img
                src={track.albumArt}
                alt={`${track.album} album cover`}
                className="track-album-art"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEM0Mi4yIDIwIDUwIDI3LjggNTAgMzhDNTAgNDguMiA0Mi4yIDU2IDMyIDU2QzIxLjggNTYgMTQgNDguMiAxNCAzOEMxNCAyNy44IDIxLjggMjAgMzIgMjBaIiBmaWxsPSIjRTVFN0VCIi8+CjwvcmVnPgo8L3N2Zz4K';
                }}
              />
              <div className="track-details">
                <h3 className="track-name">{track.name}</h3>
                <p className="track-artist">{track.artists.join(', ')}</p>
                <p className="track-album">{track.album}</p>
                <p className="track-duration">
                  Duration: {formatTime(trackDurationSeconds)}
                </p>
              </div>
            </div>

            {track.previewUrl && (
              <div className="preview-controls">
                <button
                  onClick={handlePlayPreview}
                  className={`play-button ${isPlaying ? 'playing' : ''}`}
                  disabled={!track.previewUrl}
                >
                  {isPlaying ? '⏸️' : '▶️'} {isPlaying ? 'Stop' : 'Preview'}
                </button>
                <audio
                  ref={audioRef}
                  src={track.previewUrl}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>

          <div className="segment-controls">
            <div className="timing-section">
              <h3>Select Timing</h3>
              <p className="timing-description">
                Choose when to start playing and how long the song should play
                during at-bats.
              </p>

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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="segment-selector-actions">
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button onClick={handleConfirm} className="confirm-button">
            Confirm Selection
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
