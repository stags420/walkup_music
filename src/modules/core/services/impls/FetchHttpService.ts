import type { HttpService } from '@/modules/core/services/HttpService';
import type { HttpRequestOptions } from '@/modules/core/services/HttpRequestOptions';
import type { HttpResponse } from '@/modules/core/services/models/HttpResponse';

export class FetchHttpService implements HttpService {
  constructor(
    private readonly baseUrl: string,
    private readonly defaultHeaders: Record<string, string> = {}
  ) {}

  async get<T>(
    endpointOrUrl: string,
    init: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = this.resolveUrl(endpointOrUrl);
    const res: Response = await fetch(url, {
      headers: this.headers(false, init.headers),
    });
    const data = (await res.json()) as T;
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
    const res: Response = await fetch(this.url(endpoint), {
      method: 'POST',
      headers: this.headers(false, headers),
      body,
    });
    const data = (await res.json()) as T;
    const status =
      typeof res.status === 'number' ? res.status : res.ok ? 200 : 500;
    return { data, status, headers: res.headers };
  }

  private url(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  private headers(
    isJson: boolean,
    extra?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (isJson) headers['Content-Type'] = 'application/json';
    if (extra)
      for (const [k, v] of Object.entries(extra)) headers[k] = v as string;
    return headers;
  }

  private resolveUrl(endpointOrUrl: string): string {
    return endpointOrUrl.startsWith('http')
      ? endpointOrUrl
      : this.url(endpointOrUrl);
  }
}
