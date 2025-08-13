import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import type { AuthService } from '@/modules/auth/services/AuthService';
import { supplyHttpService } from '@/modules/core/suppliers/HttpServiceSupplier';
import type { HttpService } from '@/modules/core/services/HttpService';
import { retry } from '@/modules/core/utils/retry';

// Internal light response used when we do not want to pass through the raw fetch Response
interface LightweightResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<unknown>;
}

// Removed internal rate limiting; rely on caller or external wrappers if needed

/**
 * Spotify Web API search response structure
 */
interface SpotifySearchResponse {
  tracks: {
    items: SpotifyApiTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Spotify API track structure
 */
interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | undefined;
  duration_ms: number;
  uri: string;
}

/**
 * Real Spotify Web API client implementation
 */
export class SpotifyApiService {
  private static readonly SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
  // Default to container http service if not supplied
  private readonly httpService: HttpService;
  private readonly authService: AuthService;

  constructor(authService: AuthService, httpService?: HttpService) {
    this.authService = authService;
    this.httpService = httpService ?? supplyHttpService();
  }

  /**
   * Search for tracks using Spotify Web API
   */
  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    if (!query.trim()) {
      return [];
    }

    const accessToken = await this.authService.getAccessToken();
    if (!accessToken) {
      throw new Error('No valid access token available for Spotify API');
    }

    const searchUrl = this.buildSearchUrl(query, limit);
    const enableRetry =
      typeof process !== 'undefined' &&
      process.env?.VITE_ENABLE_RETRY === 'true';
    const fetchOnce = () =>
      this.httpService.get<unknown>(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeoutMs: 8000,
      });
    const { data, status, headers } = enableRetry
      ? await retry(fetchOnce, {
          maxRetries: 2,
          initialDelayMs: 300,
          shouldRetry: (err) => err instanceof Error,
        })
      : await fetchOnce();

    if (status < 200 || status >= 300) {
      await this.handleApiError({
        ok: status >= 200 && status < 300,
        status,
        headers,
        json: async () => data,
      } as unknown as Response);
    }

    const searchData = data;
    const searchResponse = this.validateSearchResponse(searchData);

    // Transform tracks and deduplicate by ID
    const transformedTracks = searchResponse.tracks.items.map((track) =>
      this.transformApiTrackToSpotifyTrack(track)
    );

    // Remove duplicates based on track ID
    const uniqueTracks = transformedTracks.filter(
      (track, index, self) => index === self.findIndex((t) => t.id === track.id)
    );

    return uniqueTracks;
  }

  /**
   * Build search URL with proper query parameters
   */
  private buildSearchUrl(query: string, limit: number): string {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: Math.min(limit, 50).toString(), // Spotify API max is 50
      market: 'US', // Ensure tracks are playable in US market
    });

    return `${SpotifyApiService.SPOTIFY_API_BASE_URL}/search?${params.toString()}`;
  }

  // Removed rate-limited queue and retries; allow errors to surface

  /**
   * Handle API errors with appropriate error messages
   */
  private async handleApiError(response: Response): Promise<never> {
    // Accept lightweight response as well
    type Resp = Response | LightweightResponse;
    const r = response as Resp;
    let errorMessage = `Spotify API error: ${r.status}`;

    try {
      const errorData = await r.json();
      if (errorData.error?.message) {
        errorMessage = `Spotify API error: ${errorData.error.message}`;
      }
    } catch {
      // If we can't parse the error response, use the status-based message
    }

    switch (r.status) {
      case 401: {
        throw new Error('Spotify authentication expired. Please log in again.');
      }
      case 403: {
        throw new Error(
          'Access forbidden. Please check your Spotify Premium subscription.'
        );
      }
      case 429: {
        throw new Error(
          'Too many requests to Spotify API. Please try again later.'
        );
      }
      case 500:
      case 502:
      case 503: {
        throw new Error(
          'Spotify service is temporarily unavailable. Please try again later.'
        );
      }
      default: {
        throw new Error(errorMessage);
      }
    }
  }

  /**
   * Validate the search response structure
   */
  private validateSearchResponse(data: unknown): SpotifySearchResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid search response: must be an object');
    }

    const obj = data as Record<string, unknown>;

    if (!obj.tracks || typeof obj.tracks !== 'object') {
      throw new Error('Invalid search response: missing tracks object');
    }

    const tracks = obj.tracks as Record<string, unknown>;

    if (!Array.isArray(tracks.items)) {
      throw new TypeError(
        'Invalid search response: tracks.items must be an array'
      );
    }

    return data as SpotifySearchResponse;
  }

  /**
   * Transform Spotify API track to our internal SpotifyTrack format
   */
  private transformApiTrackToSpotifyTrack(
    apiTrack: SpotifyApiTrack
  ): SpotifyTrack {
    // Get the best album art (prefer medium size, fallback to largest available)
    const albumArt = this.selectBestAlbumArt(apiTrack.album.images);

    return {
      id: apiTrack.id,
      name: apiTrack.name,
      artists: apiTrack.artists.map((artist) => artist.name),
      album: apiTrack.album.name,
      albumArt,
      previewUrl: apiTrack.preview_url || '', // Some tracks don't have preview URLs
      durationMs: apiTrack.duration_ms,
      uri: apiTrack.uri,
    };
  }

  /**
   * Select the best album art from available images
   */
  private selectBestAlbumArt(
    images: Array<{ url: string; height: number; width: number }>
  ): string {
    if (images.length === 0) {
      return ''; // No album art available
    }

    // Sort by size (prefer medium size around 300px, fallback to largest)
    const sortedImages = images.sort((a, b) => {
      const aDistance = Math.abs(a.height - 300);
      const bDistance = Math.abs(b.height - 300);

      if (aDistance === bDistance) {
        return b.height - a.height; // If same distance, prefer larger
      }

      return aDistance - bDistance;
    });

    return sortedImages[0].url;
  }
}
