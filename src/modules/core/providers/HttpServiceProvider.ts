import type { HttpService } from '@/modules/core/services/HttpService';
import { FetchHttpService } from '@/modules/core/services/impl/FetchHttpService';

/**
 * Provider for creating a singleton HttpService instance.
 */
export class HttpServiceProvider {
  private static instance: HttpService | null = null;

  static getOrCreate(): HttpService {
    if (!this.instance) {
      this.instance = new FetchHttpService();
    }
    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
