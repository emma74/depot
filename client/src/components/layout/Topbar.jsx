import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Button from '../common/Button';
import './Topbar.css';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar__menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <span />
        <span />
        <span />
      </button>
      <div className="topbar__user">
        {user && (
          <span className="topbar__identity">
            {user.username} <span className="topbar__role">({user.role})</span>
          </span>
        )}
        <button
          type="button"
          className="topbar__theme-toggle"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <Button variant="secondary" onClick={logout}>Log out</Button>
      </div>
    </header>
  );
}
