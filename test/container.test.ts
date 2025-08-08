import { ApplicationContainerProvider } from '@/modules/app';
import { AppConfigProvider } from '@/modules/app';

describe('service container', () => {
  beforeEach(() => {
    ApplicationContainerProvider.reset();
    AppConfigProvider.reset();
  });

  test('throws if accessed before bootstrap', () => {
    expect(() => ApplicationContainerProvider.get()).toThrow(
      'ApplicationContainer not initialized'
    );
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
    // Initialize config and then container
    AppConfigProvider.initialize(cfg);
    ApplicationContainerProvider.initialize();
    const c2 = ApplicationContainerProvider.get();
    expect(c2.config.spotifyClientId).toBe('id');
  });
});
