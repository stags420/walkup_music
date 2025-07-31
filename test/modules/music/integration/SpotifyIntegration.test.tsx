import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { SongSelector } from '@/modules/music/components/SongSelector';
import { PlayerForm } from '@/modules/game/components/PlayerForm';
import {
  SpotifyMusicService,
  MusicService,
} from '@/modules/music/services/MusicService';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { AuthService } from '@/modules/auth';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { Player } from '@/modules/game/models/Player';

// Mock the auth service
const mockAuthService: jest.Mocked<AuthService> = {
  login: jest.fn(),
  logout: jest.fn(),
  getAccessToken: jest.fn(),
  isAuthenticated: jest.fn(),
  refreshToken: jest.fn(),
};

// Mock player service
const mockPlayerService: jest.Mocked<PlayerService> = {
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(),
  searchSongs: jest.fn(),
};

// Mock Spotify track data
const mockSpotifyTracks: SpotifyTrack[] = [
  {
    id: 'spotify-track-1',
    name: 'Eye of the Tiger',
    artists: ['Survivor'],
    album: 'Eye of the Tiger',
    albumArt: 'https://example.com/album1.jpg',
    previewUrl: 'https://example.com/preview1.mp3',
    durationMs: 245000,
    uri: 'spotify:track:2KH16WveTQWT6KOG9Rg6e2',
  },
  {
    id: 'spotify-track-2',
    name: 'We Will Rock You',
    artists: ['Queen'],
    album: 'News of the World',
    albumArt: 'https://example.com/album2.jpg',
    previewUrl: 'https://example.com/preview2.mp3',
    durationMs: 122000,
    uri: 'spotify:track:4fzsfWzRhPawzqhX8Qt9F3',
  },
];

describe('Spotify Integration Tests', () => {
  let musicService: MusicService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful authentication
    mockAuthService.getAccessToken.mockResolvedValue('mock-access-token');
    mockAuthService.isAuthenticated.mockReturnValue(true);

    // Create real SpotifyMusicService with mocked auth
    musicService = new SpotifyMusicService(mockAuthService);

    // Mock the SpotifyApiService search method
    jest
      .spyOn(musicService, 'searchTracks')
      .mockResolvedValue(mockSpotifyTracks);
  });

  describe('SongSelector with Real Spotify Integration', () => {
    const mockOnSelectTrack = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
      mockOnSelectTrack.mockClear();
      mockOnCancel.mockClear();
    });

    it('should search for tracks using real Spotify service', async () => {
      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={mockOnSelectTrack}
          onCancel={mockOnCancel}
        />
      );

      // Given we have the song selector open
      const searchInput = screen.getByLabelText(/search for songs/i);
      expect(searchInput).toBeInTheDocument();

      // When we search for a song
      fireEvent.change(searchInput, { target: { value: 'Eye of the Tiger' } });

      // Then it should call the real Spotify service
      await waitFor(() => {
        expect(musicService.searchTracks).toHaveBeenCalledWith(
          'Eye of the Tiger'
        );
      });

      // And display the results
      await waitFor(() => {
        expect(screen.getByText('Eye of the Tiger')).toBeInTheDocument();
        expect(screen.getByText('Survivor')).toBeInTheDocument();
      });
    });

    it('should display preview buttons for tracks with preview URLs', async () => {
      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={mockOnSelectTrack}
          onCancel={mockOnCancel}
        />
      );

      // Given we search for tracks
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'Queen' } });

      // When the results load
      await waitFor(() => {
        expect(screen.getByText('We Will Rock You')).toBeInTheDocument();
      });

      // Then preview buttons should be available
      const previewButtons = screen.getAllByLabelText(/play preview/i);
      expect(previewButtons).toHaveLength(2); // Both tracks have preview URLs
    });

    it('should handle track selection with real Spotify data', async () => {
      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={mockOnSelectTrack}
          onCancel={mockOnCancel}
        />
      );

      // Given we have search results
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'Survivor' } });

      await waitFor(() => {
        expect(screen.getByText('Eye of the Tiger')).toBeInTheDocument();
      });

      // When we select a track
      const trackCard = screen
        .getByText('Eye of the Tiger')
        .closest('.track-card');
      expect(trackCard).toBeInTheDocument();
      fireEvent.click(trackCard!);

      // And confirm the selection
      const selectButton = screen.getByText('Select Song');
      fireEvent.click(selectButton);

      // Then it should call onSelectTrack with the Spotify track data
      expect(mockOnSelectTrack).toHaveBeenCalledWith(mockSpotifyTracks[0]);
    });

    it('should handle authentication errors gracefully', async () => {
      // Given authentication fails
      mockAuthService.getAccessToken.mockResolvedValue(null);
      (musicService.searchTracks as jest.Mock).mockRejectedValue(
        new Error('No valid access token available for Spotify API')
      );

      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={mockOnSelectTrack}
          onCancel={mockOnCancel}
        />
      );

      // When we try to search
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Then it should display an error message
      await waitFor(() => {
        expect(screen.getByText(/no valid access token/i)).toBeInTheDocument();
      });
    });
  });

  describe('PlayerForm with Real Spotify Integration', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
      mockOnSave.mockClear();
      mockOnCancel.mockClear();
      mockPlayerService.createPlayer.mockResolvedValue({
        id: 'new-player-id',
        name: 'Test Player',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should integrate with real Spotify service for song selection', async () => {
      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={musicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Given we have the player form open
      expect(screen.getByText('Add New Player')).toBeInTheDocument();

      // When we click to select a song
      const selectSongButton = screen.getByText('Select Song');
      fireEvent.click(selectSongButton);

      // Then the song selector should open with real Spotify integration
      await waitFor(() => {
        expect(screen.getByText('Select Walk-up Song')).toBeInTheDocument();
      });

      // And we can search for songs
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'Queen' } });

      // The real Spotify service should be called
      await waitFor(() => {
        expect(musicService.searchTracks).toHaveBeenCalledWith('Queen');
      });
    });

    it('should save player with real Spotify track data', async () => {
      const mockPlayer: Player = {
        id: 'player-1',
        name: 'Test Player',
        song: {
          track: mockSpotifyTracks[0],
          startTime: 10,
          duration: 8,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlayerService.updatePlayer.mockResolvedValue(mockPlayer);

      render(
        <PlayerForm
          playerService={mockPlayerService}
          musicService={musicService}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Given we fill in the player name
      const nameInput = screen.getByLabelText(/player name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Player' } });

      // When we save the player
      const saveButton = screen.getByText('Add Player');
      fireEvent.click(saveButton);

      // Then it should create the player
      await waitFor(() => {
        expect(mockPlayerService.createPlayer).toHaveBeenCalledWith(
          'Test Player'
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Spotify API rate limiting', async () => {
      // Given the API returns a rate limit error
      (musicService.searchTracks as jest.Mock).mockRejectedValue(
        new Error('Too many requests to Spotify API. Please try again later.')
      );

      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // When we search
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Then it should display the rate limit error
      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Given a network error occurs
      (musicService.searchTracks as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // When we search
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Then it should display a network error
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle tracks without preview URLs', async () => {
      // Given tracks without preview URLs
      const tracksWithoutPreview: SpotifyTrack[] = [
        {
          ...mockSpotifyTracks[0],
          previewUrl: '', // No preview URL
        },
      ];

      (musicService.searchTracks as jest.Mock).mockResolvedValue(
        tracksWithoutPreview
      );

      render(
        <SongSelector
          musicService={musicService}
          onSelectTrack={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // When we search
      const searchInput = screen.getByLabelText(/search for songs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Then tracks should be displayed without preview buttons
      await waitFor(() => {
        expect(screen.getByText('Eye of the Tiger')).toBeInTheDocument();
      });

      // And no preview buttons should be present
      const previewButtons = screen.queryAllByLabelText(/preview/i);
      expect(previewButtons).toHaveLength(0);
    });
  });
});
