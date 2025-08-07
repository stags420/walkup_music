import {
  bootstrapServices,
  getContainer,
  __resetContainerForTests,
} from '@/container';

describe('service container', () => {
  beforeEach(() => {
    __resetContainerForTests();
  });

  test('throws if accessed before bootstrap', () => {
    expect(() => getContainer()).toThrow('Services not bootstrapped');
  });

  test('returns same container after bootstrap', () => {
    const cfg = {
      maxSegmentDuration: 10,
      spotifyClientId: 'id',
      redirectUri: 'http://127.0.0.1/callback',
      tokenRefreshBufferMinutes: 15,
      basePath: '',
      mockAuth: true,
    };
    const c1 = bootstrapServices(cfg);
    const c2 = getContainer();
    expect(c2).toBe(c1);
    expect(c2.config.spotifyClientId).toBe('id');
  });
});
