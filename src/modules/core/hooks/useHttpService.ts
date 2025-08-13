import type { HttpService } from '@/modules/core/services/HttpService';
import { supplyHttpService } from '@/modules/core/suppliers/HttpServiceSupplier';

// Deprecated: prefer calling supplyHttpService() directly or pass via props
export function useHttpService(): HttpService {
  return supplyHttpService();
}
