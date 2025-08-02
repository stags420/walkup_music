import { AuthContextType } from '@/modules/auth';
import './LoginPage.css';

interface LoginPageProps {
  auth: AuthContextType;
}

export function LoginPage({ auth }: LoginPageProps) {
  const { login } = auth;

  const handleLogin = async () => {
    await login();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Walk-Up Music Manager</h1>
          <p>
            Connect your Spotify Premium account to manage walk-up music for
            your team
          </p>
        </div>

        <div className="login-content">
          <div className="spotify-info">
            <h2>Why Spotify Premium?</h2>
            <ul>
              <li>Full track playback during games</li>
              <li>High-quality audio streaming</li>
              <li>Access to complete music library</li>
              <li>Precise playback control</li>
            </ul>
          </div>

          <div className="login-actions">
            <button
              type="button"
              className="spotify-login-button"
              onClick={handleLogin}
              aria-describedby="login-help"
              data-testid="spotify-login-button"
            >
              <span className="spotify-icon" aria-hidden="true">
                ♪
              </span>
              Connect with Spotify
            </button>

            <p id="login-help" className="login-help">
              You'll be redirected to Spotify to authorize this application. We
              only request permissions needed for music playback.
            </p>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Don't have Spotify Premium?{' '}
            <a
              href="https://www.spotify.com/premium/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Upgrade your account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
