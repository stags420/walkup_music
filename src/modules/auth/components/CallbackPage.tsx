import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContextType } from '@/modules/auth';

interface CallbackPageProps {
  auth: AuthContextType;
}

export function CallbackPage({ auth }: CallbackPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = auth;
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
        navigate('/?error=' + encodeURIComponent(error));
        return;
      }

      // Handle missing parameters
      if (!code || !state) {
        console.error('Missing code or state parameter');
        navigate(
          '/?error=' + encodeURIComponent('Invalid callback parameters')
        );
        return;
      }

      try {
        await handleCallback(code, state);
        // Redirect to main app after successful authentication
        navigate('/');
      } catch (error) {
        console.error('Callback handling failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Authentication failed';
        navigate('/?error=' + encodeURIComponent(errorMessage));
      }
    };

    processCallback();
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
