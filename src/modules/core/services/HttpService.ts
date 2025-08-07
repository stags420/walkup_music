import type { HttpResponse } from '@/modules/core/services/models/HttpResponse';
import type { HttpRequestOptions } from '@/modules/core/services/HttpRequestOptions';

export interface HttpService {
  get<T>(
    endpointOrUrl: string,
    init?: HttpRequestOptions
  ): Promise<HttpResponse<T>>;
  post<T>(
    endpoint: string,
    form: Record<string, string>,
    init?: HttpRequestOptions
  ): Promise<HttpResponse<T>>;
  put<T>(
    endpointOrUrl: string,
    jsonBody?: unknown,
    init?: HttpRequestOptions
  ): Promise<HttpResponse<T>>;
}
