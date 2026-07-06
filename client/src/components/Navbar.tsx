import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkBase =
  'rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `${navLinkBase} bg-navy text-white`
      : `${navLinkBase} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-navy">
          <span aria-hidden="true">🏈</span>
          <span>CFB Predictor</span>
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/predictor" className={linkClass}>
            Predictor
          </NavLink>
          <NavLink to="/teams" className={linkClass}>
            Teams
          </NavLink>
          <NavLink to="/olemiss" className={linkClass}>
            Ole Miss
          </NavLink>
          {user && (
            <NavLink to="/saved" className={linkClass}>
              Saved
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">Hi, {user.name}</span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white transition hover:bg-navy-light"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
