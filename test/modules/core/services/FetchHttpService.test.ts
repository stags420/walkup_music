import { FetchHttpService } from '@/modules/core/services/impls/FetchHttpService';
import type { HttpService } from '@/modules/core/services/HttpService';

describe('HttpApiService', () => {
  const BASE = 'https://api.example.com';
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('GET calls correct URL and returns parsed JSON', async () => {
    const payload = { ok: true };
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ json: () => Promise.resolve(payload) });
    const api: HttpService = new FetchHttpService(BASE);
    const { data } = await api.get('/ping');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${BASE}/ping`,
      expect.any(Object)
    );
    expect(data).toEqual(payload);
  });

  test('POST form sends urlencoded body', async () => {
    const payload = { id: 1 };
    type FetchInit = {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    };
    interface FetchCall {
      url: string;
      init: FetchInit;
    }
    const calls: FetchCall[] = [];
    globalThis.fetch = jest
      .fn()
      .mockImplementation((url: string, init: unknown) => {
        calls.push({ url, init: init as FetchInit });
        return Promise.resolve({
          json: () => Promise.resolve(payload),
        } as Response);
      });
    const api: HttpService = new FetchHttpService(BASE);
    const { data } = await api.post('/items', { name: 'n' });
    const call = calls[0];
    expect(call.url).toBe(`${BASE}/items`);
    expect(call.init.method).toBe('POST');
    expect(call.init.headers!['Content-Type']).toBe(
      'application/x-www-form-urlencoded'
    );
    expect(call.init.body).toBe('name=n');
    expect(data).toEqual(payload);
  });
});
