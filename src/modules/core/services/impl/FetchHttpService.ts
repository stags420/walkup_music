import type { HttpService } from '@/modules/core/services/HttpService';
import type { HttpRequestOptions } from '@/modules/core/services/HttpRequestOptions';
import type { HttpResponse } from '@/modules/core/services/models/HttpResponse';
import { HttpError } from '@/modules/core/services/models/HttpError';

export class FetchHttpService implements HttpService {
  constructor() {}

  async get<T>(
    url: string,
    init: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const res: Response = await this.fetchWithTimeout(
      url,
      {
        headers: this.headers(false, init.headers),
      },
      init.timeoutMs
    );
    let data = undefined as unknown as T;
    try {
      data = (await res.json()) as T;
    } catch {
      // no body
    }
    const status =
      typeof res.status === 'number' ? res.status : res.ok ? 200 : 500;
    return { data, status, headers: res.headers };
  }

  async post<T>(
    endpoint: string,
    form: Record<string, string>,
    init: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const body = new URLSearchParams(form).toString();
    const headers = {
      ...init.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const res: Response = await this.fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: this.headers(false, headers),
        body,
      },
      init.timeoutMs
    );
    let data = undefined as unknown as T;
    try {
      data = (await res.json()) as T;
    } catch {
      // no body
    }
    const status =
      typeof res.status === 'number' ? res.status : res.ok ? 200 : 500;
    return { data, status, headers: res.headers };
  }

  async put<T>(
    endpointOrUrl: string,
    jsonBody: unknown = undefined,
    init: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = endpointOrUrl;
    const body = jsonBody === undefined ? undefined : JSON.stringify(jsonBody);
    const res: Response = await this.fetchWithTimeout(
      url,
      {
        method: 'PUT',
        headers: this.headers(true, init.headers),
        body,
      },
      init.timeoutMs
    );
    let data = undefined as unknown as T;
    try {
      data = (await res.json()) as T;
    } catch {
      // no body
    }
    const status =
      typeof res.status === 'number' ? res.status : res.ok ? 200 : 500;
    return { data, status, headers: res.headers };
  }

  private headers(
    isJson: boolean,
    extra?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (extra)
      for (const [k, v] of Object.entries(extra)) headers[k] = v as string;
    return headers;
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit,
    timeoutMs?: number
  ): Promise<Response> {
    const controller = new AbortController();
    const id =
      timeoutMs && timeoutMs > 0
        ? setTimeout(() => controller.abort(), timeoutMs)
        : undefined;
    try {
      const options: RequestInit = init
        ? { ...init, signal: controller.signal }
        : { signal: controller.signal };
      const res = await fetch(input, options);
      return res;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        throw new HttpError({
          kind: 'timeout',
          message: 'Request timed out',
          cause: error,
        });
      }
      throw new HttpError({
        kind: 'network',
        message: 'Network error',
        cause: error,
      });
    } finally {
      if (id) clearTimeout(id);
    }
  }
}
