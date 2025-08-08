import type { HttpService } from '@/modules/core/services/HttpService';
import { ApplicationContainerProvider } from '@/modules/app';

/**
 * Returns the singleton HttpService from the application container.
 * This is a tiny helper to avoid importing the container everywhere.
 */
export function useHttpService(): HttpService {
  return ApplicationContainerProvider.get().httpService;
}
