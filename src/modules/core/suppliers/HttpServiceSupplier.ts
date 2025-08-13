import type { HttpService } from '@/modules/core/services/HttpService';
import { FetchHttpService } from '@/modules/core/services/impl/FetchHttpService';

let singleton: HttpService | undefined;

export function supplyHttpService(): HttpService {
  if (!singleton) {
    singleton = new FetchHttpService();
  }
  return singleton;
}

export function resetHttpServiceForTests(): void {
  singleton = undefined;
}
