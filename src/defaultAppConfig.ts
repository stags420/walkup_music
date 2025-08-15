import type { AppConfig } from '@/modules/app/models/AppConfig';

type AppStage = 'prod' | 'dev' | 'devMock';

const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as
  | string
  | undefined;

export const detectBasePath = (): string => {
  const currentPath = globalThis.location.pathname;
  const hostname = globalThis.location.hostname;

  // For GitHub Pages deployment, always use /walkup_music (no trailing slash for React Router)
  if (hostname === 'stags420.github.io') {
    return '/walkup_music';
  }

  // For local development, check if we're in the walkup_music subdirectory
  // This handles both /walkup_music and /walkup_music/ paths
  if (currentPath.startsWith('/walkup_music')) {
    return '/walkup_music';
  }

  // Check if we're running in Vite dev server with base path
  // Vite injects import.meta.env.BASE_URL which includes the trailing slash
  if (import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/') {
    // Remove trailing slash for React Router compatibility
    return import.meta.env.BASE_URL.replace(/\/$/, '');
  }

  return '';
};

export const getRedirectUri = (basePath = ''): string => {
  const origin = globalThis.location.origin;
  const spotifyCompatibleOrigin = origin.replace('localhost', '127.0.0.1');
  return `${spotifyCompatibleOrigin}${basePath}/callback`;
};

function getBaseConfig(): AppConfig {
  const basePath = detectBasePath();
  return {
    maxSegmentSeconds: 10,
    spotifyClientId: VITE_SPOTIFY_CLIENT_ID || 'REPLACE_ME_IN_.env.local',
    redirectUri: getRedirectUri(basePath),
    tokenRefreshBufferMinutes: 15,
    basePath,
    mockAuth: false,
    maxTokenTtlSeconds: undefined,
    logLevel: undefined,
  };
}

function applyStageOverrides(
  baseConfig: AppConfig,
  stage: AppStage
): AppConfig {
  switch (stage) {
    case 'prod': {
      return {
        ...baseConfig,
      };
    }
    case 'dev': {
      return {
        ...baseConfig,
      };
    }
    case 'devMock': {
      return {
        ...baseConfig,
        mockAuth: true,
      };
    }
    default: {
      throw new Error(
        `Unknown app stage: ${stage}. Supported stages: prod, dev, devMock`
      );
    }
  }
}

export function buildAppConfig(): AppConfig {
  const configKey = import.meta.env.VITE_APP_CONFIG_KEY as string | undefined;

  if (!configKey) {
    throw new Error('VITE_APP_CONFIG_KEY environment variable is required.');
  }

  const baseConfig = getBaseConfig();
  return applyStageOverrides(baseConfig, configKey as AppStage);
}

export function buildDefaultAppConfig(): AppConfig {
  return buildAppConfig();
}
