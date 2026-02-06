import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Heart,
  UtensilsCrossed,
  BarChart3,
  Shield,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../api/client';

function NavLinks({ user }: { user: User }) {
  const loc = useLocation();
  const active = (path: string) => loc.pathname === path;

  const link = (to: string, label: string, Icon: typeof Home) => (
    <Link
      to={to}
      className={active(to) ? 'nav-link active' : 'nav-link'}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="nav-links">
      {link('/', 'Home', Home)}
      {user.role === 'donor' && link('/donor', 'My posts', UtensilsCrossed)}
      {user.role === 'ngo' && link('/ngo', 'Dashboard', LayoutDashboard)}
      {user.role === 'admin' && link('/admin', 'Admin', Shield)}
      {link('/impact', 'Impact', BarChart3)}
    </nav>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <Heart size={28} strokeWidth={2.5} />
            <span>FeedChain</span>
          </Link>
          {user ? (
            <div className="header-right">
              <NavLinks user={user} />
              <span className="role-badge">{user.role}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={logout}
                aria-label="Log out"
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="container">
          <p>FeedChain – Reduce food waste. Feed people. For NGOs and donors.</p>
        </div>
      </footer>
    </div>
  );
}
