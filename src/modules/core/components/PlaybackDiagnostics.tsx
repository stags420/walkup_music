import { useState, useEffect } from 'react';
import { MusicService } from '@/modules/music';
import { Button } from '@/modules/core/components/Button';

interface PlaybackDiagnosticsProps {
  musicService?: MusicService;
}

interface DiagnosticInfo {
  userAgent: string;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isChrome: boolean;
  isSafari: boolean;
  hasSpotifySDK: boolean;
  isPlaybackReady: boolean;
  isPlaybackConnected: boolean;
  supportsEME: boolean;
  autoplayPolicy:
    | 'allowed'
    | 'user-gesture-required'
    | 'document-user-activation-required'
    | 'unknown';
}

const getStatusIcon = (condition: boolean) => (condition ? '✅' : '❌');
const getWarningIcon = (condition: boolean) => (condition ? '⚠️' : '✅');

export function PlaybackDiagnostics({
  musicService,
}: PlaybackDiagnosticsProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkDiagnostics = () => {
      const userAgent = navigator.userAgent;
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

      // Check if Spotify SDK is loaded
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasSpotifySDK = !!(globalThis as any).Spotify;

      // Check playback service status
      const isPlaybackReady = musicService
        ? musicService.isPlaybackReady()
        : false;
      const isPlaybackConnected = musicService
        ? musicService.isPlaybackConnected()
        : false;

      // Check EME support
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supportsEME = !!(navigator as any).requestMediaKeySystemAccess;

      // Check autoplay policy (modern browsers)
      let autoplayPolicy: DiagnosticInfo['autoplayPolicy'] = 'unknown';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((navigator as any).permissions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (navigator as any).permissions
          .query({ name: 'autoplay' })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then((result: any) => {
            if (result.state === 'granted') {
              autoplayPolicy = 'allowed';
            } else if (result.state === 'prompt') {
              autoplayPolicy = 'user-gesture-required';
            } else {
              autoplayPolicy = 'document-user-activation-required';
            }
          })
          .catch(() => {
            autoplayPolicy = 'unknown';
          });
      }

      setDiagnostics({
        userAgent,
        isMobile,
        isIOS,
        isAndroid,
        isChrome,
        isSafari,
        hasSpotifySDK,
        isPlaybackReady,
        isPlaybackConnected,
        supportsEME,
        autoplayPolicy,
      });
    };

    checkDiagnostics();

    // Update diagnostics every 5 seconds
    const interval = setInterval(checkDiagnostics, 5000);

    return () => clearInterval(interval);
  }, [musicService]);

  if (!diagnostics) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        fontSize: '12px',
      }}
    >
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant={diagnostics.isMobile ? 'warning' : 'success'}
        size="sm"
        style={{
          fontSize: '12px',
        }}
      >
        🔧 Debug
      </Button>

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '16px',
            borderRadius: '8px',
            minWidth: '300px',
            maxWidth: '400px',
            fontSize: '11px',
            lineHeight: '1.4',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
            Playback Diagnostics
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <strong>Device & Browser:</strong>
            <br />
            {getStatusIcon(!diagnostics.isMobile)} Desktop Browser
            <br />
            {getWarningIcon(diagnostics.isMobile)} Mobile Device:{' '}
            {diagnostics.isMobile ? 'Yes' : 'No'}
            <br />
            {diagnostics.isIOS && '📱 iOS Safari'}
            <br />
            {diagnostics.isAndroid && '🤖 Android Chrome'}
            <br />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong>Spotify Integration:</strong>
            <br />
            {getStatusIcon(diagnostics.hasSpotifySDK)} SDK Loaded
            <br />
            {getStatusIcon(diagnostics.isPlaybackReady)} Playback Ready
            <br />
            {getStatusIcon(diagnostics.isPlaybackConnected)} Playback Connected
            <br />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong>Browser Support:</strong>
            <br />
            {getStatusIcon(diagnostics.supportsEME)} DRM/EME Support
            <br />
            📋 Autoplay Policy: {diagnostics.autoplayPolicy}
            <br />
          </div>

          {diagnostics.isMobile && (
            <div
              style={{
                backgroundColor: 'rgba(255, 107, 53, 0.2)',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ff6b35',
              }}
            >
              <strong>Mobile Detected!</strong>
              <br />
              • Music requires user interaction
              <br />
              • Try clicking play twice
              <br />
              • Check browser audio settings
              <br />
              {diagnostics.isAndroid && '• Reset DRM settings if needed'}
            </div>
          )}

          {!diagnostics.hasSpotifySDK && (
            <div
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ff0000',
                marginTop: '8px',
              }}
            >
              <strong>⚠️ Spotify SDK not loaded!</strong>
              <br />
              Check network connection and script loading.
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #333',
              fontSize: '10px',
              opacity: 0.7,
            }}
          >
            User Agent: {diagnostics.userAgent.slice(0, 50)}...
          </div>
        </div>
      )}
    </div>
  );
}
