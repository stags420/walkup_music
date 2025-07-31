import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { AuthService } from '@/modules/auth';

/**
 * Rate limiting configuration for Spotify API
 */
interface RateLimitConfig {
  maxRequestsPerSecond: number;
  retryDelayMs: number;
  maxRetries: number;
}

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
  preview_url: string | null;
  duration_ms: number;
  uri: string;
}

/**
 * Real Spotify Web API client implementation
 */
export class SpotifyApiService {
  private static readonly SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
  private static readonly DEFAULT_RATE_LIMIT: RateLimitConfig = {
    maxRequestsPerSecond: 10,
    retryDelayMs: 1000,
    maxRetries: 3,
  };

  private lastRequestTime = 0;
  private requestQueue: Array<() => void> = [];
  private isProcessingQueue = false;

  constructor(
    private authService: AuthService,
    private rateLimitConfig: RateLimitConfig = SpotifyApiService.DEFAULT_RATE_LIMIT
  ) {}

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
    const response = await this.makeRateLimitedRequest(searchUrl, accessToken);

    if (!response.ok) {
      await this.handleApiError(response);
    }

    const searchData = await response.json();
    const searchResponse = this.validateSearchResponse(searchData);

    return searchResponse.tracks.items.map((track) =>
      this.transformApiTrackToSpotifyTrack(track)
    );
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

  /**
   * Make a rate-limited request to Spotify API
   */
  private async makeRateLimitedRequest(
    url: string,
    accessToken: string
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.executeRequest(url, accessToken);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) continue;

      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const minInterval = 1000 / this.rateLimitConfig.maxRequestsPerSecond;

      if (timeSinceLastRequest < minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, minInterval - timeSinceLastRequest)
        );
      }

      this.lastRequestTime = Date.now();
      await request();
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute the actual HTTP request with retry logic
   */
  private async executeRequest(
    url: string,
    accessToken: string,
    retryCount = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle rate limiting (429) with exponential backoff
      if (
        response.status === 429 &&
        retryCount < this.rateLimitConfig.maxRetries
      ) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : this.rateLimitConfig.retryDelayMs * Math.pow(2, retryCount);

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.executeRequest(url, accessToken, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.rateLimitConfig.maxRetries) {
        const delayMs =
          this.rateLimitConfig.retryDelayMs * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.executeRequest(url, accessToken, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Handle API errors with appropriate error messages
   */
  private async handleApiError(response: Response): Promise<never> {
    let errorMessage = `Spotify API error: ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = `Spotify API error: ${errorData.error.message}`;
      }
    } catch {
      // If we can't parse the error response, use the status-based message
    }

    switch (response.status) {
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
      throw new Error('Invalid search response: tracks.items must be an array');
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
