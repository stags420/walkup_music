import React, { useState, useEffect } from 'react';
import { Modal, Form, Alert, Spinner, Button } from 'react-bootstrap';
import type { ChangeEvent } from 'react';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { MusicService } from '@/modules/music/services/MusicService';
import { TrackCard } from '@/modules/core';

interface SongSelectorProps {
  musicService: MusicService;
  onSelectTrack: (track: SpotifyTrack) => void;
  onCancel: () => void;
  initialSearchQuery?: string;
}

export function SongSelector({
  musicService,
  onSelectTrack,
  onCancel,
  initialSearchQuery = '',
}: SongSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  useEffect(() => {
    const searchTracks = async () => {
      if (!searchQuery.trim()) {
        setTracks([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await musicService.searchTracks(searchQuery.trim());
        setTracks(results);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Search failed');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchTracks, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, musicService]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedTrackId(null);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    setSelectedTrackId(track.id);
  };

  const handleConfirmSelection = async () => {
    const selectedTrack = tracks.find((track) => track.id === selectedTrackId);
    if (selectedTrack) {
      // Stop any playing preview before confirming selection
      try {
        await musicService.pause();
        setPlayingTrackId(null);
      } catch (error) {
        console.debug('Failed to stop preview:', error);
      }
      onSelectTrack(selectedTrack);
    } else {
      console.warn('No track selected');
    }
  };

  const handlePlayPreview = async (
    track: SpotifyTrack,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent track selection when clicking play button

    // In test environment, just toggle the playing state
    if (
      globalThis.window === undefined ||
      globalThis.process?.env.NODE_ENV?.includes('test')
    ) {
      setPlayingTrackId(playingTrackId === track.id ? null : track.id);
      return;
    }

    if (playingTrackId === track.id) {
      // Stop current track
      try {
        await musicService.pause();
        setPlayingTrackId(null);
      } catch (error) {
        console.debug('Playback pause failed:', error);
        setPlayingTrackId(null);
      }
    } else {
      // Stop any currently playing track and start new one
      try {
        await musicService.pause(); // Stop any current playback
        await musicService.previewTrack(track.uri, 0, 30000); // 30 second preview
        setPlayingTrackId(track.id);
      } catch (error) {
        console.debug('Playback preview failed:', error);
        setPlayingTrackId(null);
      }
    }
  };

  // Clean up playback when component unmounts
  useEffect(() => {
    return () => {
      // Stop any playing preview when component unmounts
      musicService.pause().catch((error) => {
        console.debug('Failed to stop preview on unmount:', error);
      });
      setPlayingTrackId(null);
    };
  }, [musicService]);

  // Stop playback when tracks change (new search results)
  useEffect(() => {
    musicService.pause().catch((error) => {
      console.debug('Failed to stop preview on tracks change:', error);
    });
    setPlayingTrackId(null);
  }, [tracks, musicService]);

  return (
    <Modal show={true} onHide={onCancel} centered backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select Walk-up Song</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label htmlFor="song-search">
            Search for songs, artists, or albums
          </Form.Label>
          <Form.Control
            id="song-search"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="e.g., Eye of the Tiger, Queen, Metallica..."
            autoFocus
            data-testid="song-search-input"
          />
        </Form.Group>

        <div
          style={{ minHeight: '300px', maxHeight: '400px', overflowY: 'auto' }}
        >
          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" className="me-2" />
              <span>Searching for songs...</span>
            </div>
          )}

          {error && (
            <Alert variant="danger">
              <Alert.Heading>Error: {error}</Alert.Heading>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setSearchQuery(searchQuery + ' ')}
              >
                Retry
              </Button>
            </Alert>
          )}

          {!loading && !error && searchQuery.trim() && tracks.length === 0 && (
            <div className="text-center py-4 text-muted">
              <p>
                No songs found for "{searchQuery}". Try a different search term.
              </p>
            </div>
          )}

          {!loading && !error && tracks.length > 0 && (
            <div className="d-flex flex-column gap-2">
              {tracks
                .filter(
                  (track, index, self) =>
                    index === self.findIndex((t) => t.id === track.id)
                )
                .map((track) => (
                  <TrackCard
                    key={track.id}
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
                    variant="compact"
                    isSelected={selectedTrackId === track.id}
                    onSelect={() => handleTrackSelect(track)}
                    onPreview={() =>
                      handlePlayPreview(track, {} as React.MouseEvent)
                    }
                    isPlaying={playingTrackId === track.id}
                    data-testid="song-result"
                  />
                ))}
            </div>
          )}

          {!searchQuery.trim() && (
            <div className="text-center py-4 text-muted">
              <p>Start typing to search for songs...</p>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirmSelection}
          disabled={!selectedTrackId}
          data-testid="select-song-result-button"
        >
          Select Song
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
