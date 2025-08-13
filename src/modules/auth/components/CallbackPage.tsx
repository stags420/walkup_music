import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { AuthContextType } from '@/modules/auth/models/AuthContextType';
import { useAuth } from '@/modules/auth';

interface CallbackPageProps {
  auth?: AuthContextType;
}

export function CallbackPage(props: CallbackPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Always call hook unconditionally, then choose handler
  const hookAuth = useAuth();
  const { handleCallback } = props.auth ?? hookAuth;
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent processing the callback multiple times
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Handle OAuth error
      if (error) {
        console.error('OAuth error:', error);
        void navigate('/?error=' + encodeURIComponent(error));
        return;
      }

      // Handle missing parameters
      if (!code || !state) {
        console.error('Missing code or state parameter');
        void navigate(
          '/?error=' + encodeURIComponent('Invalid callback parameters')
        );
        return;
      }

      try {
        await handleCallback(code, state);
        // Redirect to main app after successful authentication
        void navigate('/');
      } catch (error) {
        console.error('Callback handling failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        void navigate('/?error=' + encodeURIComponent(errorMessage));
      }
    };

    void processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="callback-page">
      <div className="callback-container">
        <div className="loading-spinner" aria-hidden="true"></div>
        <h2>Connecting to Spotify...</h2>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
