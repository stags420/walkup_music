import type { AuthContextType } from '@/modules/auth';
import { Button } from '@/modules/core/components/Button';
// Using Bootstrap classes instead of custom CSS

interface LoginPageProps {
  auth: AuthContextType;
}

export function LoginPage({ auth }: LoginPageProps) {
  const { login } = auth;

  const handleLogin = async () => {
    await login();
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <h1 className="card-title h2 mb-3">Walk-Up Music Manager</h1>
                <p className="card-text text-muted">
                  Connect your Spotify Premium account to manage walk-up music
                  for your team
                </p>
              </div>

              <div className="mb-4">
                <h2 className="h5 mb-3">Why Spotify Premium?</h2>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="text-success me-2">✓</i>
                    Full track playback during games
                  </li>
                  <li className="mb-2">
                    <i className="text-success me-2">✓</i>
                    High-quality audio streaming
                  </li>
                  <li className="mb-2">
                    <i className="text-success me-2">✓</i>
                    Access to complete music library
                  </li>
                  <li className="mb-2">
                    <i className="text-success me-2">✓</i>
                    Precise playback control
                  </li>
                </ul>
              </div>

              <div className="d-grid gap-2 mb-4">
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleLogin}
                  data-testid="spotify-login-button"
                  aria-describedby="login-help"
                >
                  <span className="me-2" aria-hidden="true">
                    ♪
                  </span>
                  Connect with Spotify
                </Button>

                <p
                  id="login-help"
                  className="text-muted small text-center mb-0"
                >
                  You'll be redirected to Spotify to authorize this application.
                  We only request permissions needed for music playback.
                </p>
              </div>

              <div className="text-center">
                <p className="small text-muted mb-0">
                  Don't have Spotify Premium?{' '}
                  <a
                    href="https://www.spotify.com/premium/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    Upgrade your account
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
