import { useEffect, useState } from 'react';
import { useAuthActions } from '@/modules/auth/hooks/useAuthActions';
import { useSettingsTheme } from '@/modules/app/hooks/useSettingsTheme';
import { useSettingsActions } from '@/modules/app/hooks/useSettingsActions';
import { useAuthUser } from '@/modules/auth/hooks/useAuthUser';

export function NavBar() {
  const authUser = useAuthUser();
  const { logout } = useAuthActions();
  const theme = useSettingsTheme();
  const { setTheme } = useSettingsActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Theme application handled in App component

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-menu')) {
        setMenuOpen(false);
        setThemeOpen(false);
      }
    };
    globalThis.addEventListener('click', onDocClick);
    return () => globalThis.removeEventListener('click', onDocClick);
  }, []);

  return (
    <nav
      className="navbar navbar-dark bg-dark px-3"
      style={{ borderBottom: '1px solid #2a2a2a' }}
    >
      <span className="navbar-brand mb-0 h1">Walk Up Music</span>
      <div id="user-menu" className="ms-auto position-relative">
        <button
          type="button"
          className="btn btn-sm btn-outline-success"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          {authUser ? `Welcome, ${authUser.displayName}!` : 'Menu'} ▾
        </button>
        {menuOpen && (
          <div
            className="dropdown-menu dropdown-menu-end show"
            style={{ right: 0, left: 'auto', minWidth: 200 }}
          >
            <button
              className="dropdown-item d-flex justify-content-between align-items-center"
              onClick={(e) => {
                e.stopPropagation();
                setThemeOpen((v) => !v);
              }}
            >
              Theme
              <span className="text-muted small">{theme}</span>
            </button>
            {themeOpen && (
              <div className="px-2 pb-2">
                <button
                  className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    setTheme('dark');
                    setThemeOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  Dark
                </button>
                <button
                  className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => {
                    setTheme('light');
                    setThemeOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  Light
                </button>
                <button
                  className={`dropdown-item ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => {
                    setTheme('system');
                    setThemeOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  System
                </button>
              </div>
            )}
            {authUser && (
              <>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    setMenuOpen(false);
                    setThemeOpen(false);
                    void logout();
                  }}
                >
                  Log out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
