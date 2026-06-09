import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

export default function AppLayout() {
  const { isAuthenticated, isAdmin, user, logout, logoutEverywhere, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ posts: [], users: [], tags: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSuggestions({ posts: [], users: [], tags: [] }); return; }
    const t = setTimeout(async () => {
      try {
        const data = await api.unifiedSearch(q);
        setSuggestions({ posts: data.posts || [], users: data.users || [], tags: data.tags || [] });
        setSearchOpen(true);
      } catch { setSuggestions({ posts: [], users: [], tags: [] }); }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function submitSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  const hasSuggestions = suggestions.posts.length + suggestions.users.length + suggestions.tags.length > 0;

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-logo">The <span>Platform</span></Link>

          <form className="header-search-form" onSubmit={submitSearch} ref={searchRef}>
            <span className="header-search-icon">⌕</span>
            <input
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(searchQuery.trim().length >= 2)}
              placeholder="Search stories, people, tags…"
            />
            {searchOpen && searchQuery.trim().length >= 2 && hasSuggestions && (
              <div className="search-dropdown">
                <SuggestionGroup label="Stories" items={suggestions.posts}
                  getTo={(p) => `/posts/${p.slug}`}
                  getPrimary={(p) => p.title}
                  getSecondary={(p) => p.authorDisplayName || p.authorUsername}
                  onSelect={() => { setSearchOpen(false); setSearchQuery(""); }} />
                <SuggestionGroup label="People" items={suggestions.users}
                  getTo={(u) => `/u/${u.username}`}
                  getPrimary={(u) => u.displayName || u.username}
                  getSecondary={(u) => `@${u.username}`}
                  onSelect={() => { setSearchOpen(false); setSearchQuery(""); }} />
                <SuggestionGroup label="Tags" items={suggestions.tags}
                  getTo={(t) => `/tag/${t.slug}`}
                  getPrimary={(t) => `#${t.name}`}
                  getSecondary={(t) => `${t.postCount || 0} stories`}
                  onSelect={() => { setSearchOpen(false); setSearchQuery(""); }} />
              </div>
            )}
          </form>

          <nav className="header-nav">
            <NavLink to="/search" className={({ isActive }) => `header-nav-link mobile-search-link${isActive ? " active" : ""}`}>Search</NavLink>
            <NavLink to="/feed" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>Feed</NavLink>
            {isAuthenticated && (
              <NavLink to="/create" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>Write</NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/dashboard" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>Admin</NavLink>
            )}

            {isAuthenticated ? (
              <div style={{ position: "relative" }} ref={menuRef}>
                <button className="header-avatar" onClick={() => setMenuOpen((o) => !o)} title={user?.username}>
                  {initialsForProfile(user)}
                </button>
                <div className={`user-menu${menuOpen ? " open" : ""}`}>
                  {user?.username && (
                    <Link className="user-menu-item" to={`/u/${user.username}`} onClick={() => setMenuOpen(false)}>
                      Profile
                    </Link>
                  )}
                  <Link className="user-menu-item" to="/settings/profile" onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item user-menu-danger" onClick={() => { logout(); setMenuOpen(false); }}>
                    Sign out
                  </button>
                  <button className="user-menu-item user-menu-danger" disabled={authLoading}
                    onClick={() => { logoutEverywhere(); setMenuOpen(false); }}>
                    Sign out all devices
                  </button>
                </div>
              </div>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `header-nav-link${isActive ? " active" : ""}`}>Sign in</NavLink>
                <Link to="/register" className="btn-write">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <Outlet />
    </>
  );
}

function SuggestionGroup({ label, items, getTo, getPrimary, getSecondary, onSelect }) {
  if (!items?.length) return null;
  return (
    <div className="search-dropdown-group">
      <div className="search-dropdown-label">{label}</div>
      {items.map((item) => (
        <Link key={getTo(item)} to={getTo(item)} className="search-dropdown-row" onClick={onSelect}>
          <span className="search-dropdown-primary">{getPrimary(item)}</span>
          <span className="search-dropdown-secondary">{getSecondary(item)}</span>
        </Link>
      ))}
    </div>
  );
}
