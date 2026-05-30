import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";

const publicLinks = [
  { to: "/", label: "Home" },
  { to: "/feed", label: "Feed" },
  { to: "/search", label: "Search" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" }
];

const memberLinks = [
  { to: "/welcome", label: "Welcome" },
  { to: "/create", label: "Create" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/settings/profile", label: "Profile" }
];

export default function AppLayout() {
  const { isAuthenticated, isAdmin, user, logout, logoutEverywhere, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ posts: [], users: [], tags: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions({ posts: [], users: [], tags: [] });
      setSearchError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await api.unifiedSearch(query);
        setSuggestions({
          posts: data.posts || [],
          users: data.users || [],
          tags: data.tags || []
        });
        setSearchError("");
        setSearchOpen(true);
      } catch (err) {
        setSearchError(extractApiError(err, "Search suggestions failed."));
        setSuggestions({ posts: [], users: [], tags: [] });
        setSearchOpen(true);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  function submitSearch(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  function closeSearch() {
    setSearchOpen(false);
  }

  const suggestionCount = suggestions.posts.length + suggestions.users.length + suggestions.tags.length;

  return (
    <div className="app-shell app-shell-routed">
      <div className="page-backdrop" />

      <aside className="hero-panel">
        <div className="hero-illustration">
          <div className="hero-arc" />
          <div className="hero-lines" />
          <div className="hero-caption">
            <span className="hero-badge">Publishing Platform</span>
            <h1>Read, write, and follow ideas.</h1>
            <p>
              V3 is shifting into tag-based discovery, profiles,
              drafts, and personalized feeds.
            </p>
          </div>
        </div>
        <div className="hero-footnote">
          <p>{isAuthenticated ? `Signed in as ${user?.username}` : "Guest mode active"}</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header routed-header">
          <div>
            <p className="eyebrow">Blog platform</p>
            <h2>Medium-like V3</h2>
          </div>
          <form className="global-search" onSubmit={submitSearch} ref={searchRef}>
            <label className="global-search-field">
              <span className="sr-only">Search stories, people, and tags</span>
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
                placeholder="Search stories, people, tags"
              />
            </label>
            <button className="action-button primary global-search-button" type="submit">
              Search
            </button>

            {searchOpen && searchQuery.trim().length >= 2 ? (
              <div className="search-suggestions">
                {searchError ? <p className="error-text">{searchError}</p> : null}
                {!searchError && suggestionCount === 0 ? (
                  <p className="empty-state compact-empty">No suggestions found.</p>
                ) : null}
                <SuggestionGroup title="Stories" items={suggestions.posts} getTo={(post) => `/posts/${post.slug}`} getPrimary={(post) => post.title} getSecondary={(post) => post.authorDisplayName || post.authorUsername} onSelect={closeSearch} />
                <SuggestionGroup title="People" items={suggestions.users} getTo={(person) => `/u/${person.username}`} getPrimary={(person) => person.displayName || person.username} getSecondary={(person) => `@${person.username}`} onSelect={closeSearch} />
                <SuggestionGroup title="Tags" items={suggestions.tags} getTo={(tag) => `/tag/${tag.slug}`} getPrimary={(tag) => `#${tag.name}`} getSecondary={(tag) => `${tag.postCount || 0} stories`} onSelect={closeSearch} />
              </div>
            ) : null}
          </form>
          <div className="workspace-user">
            <div>
              <p className="user-label">Session</p>
              <strong>{user?.username || "Guest"}</strong>
            </div>
            <span className={`status-pill ${isAuthenticated ? "live" : "idle"}`}>
              {isAuthenticated ? (isAdmin ? "Admin live" : "User live") : "Logged out"}
            </span>
          </div>
        </header>

        <nav className="navbar-card">
          <div className="nav-links">
            {publicLinks.map((link) => (
              <NavItem key={link.to} to={link.to} label={link.label} />
            ))}
            {isAuthenticated &&
              memberLinks.map((link) => <NavItem key={link.to} to={link.to} label={link.label} />)}
            {isAdmin && <NavItem to="/admin" label="Admin" />}
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <button className="action-button ghost" onClick={logoutEverywhere} disabled={authLoading}>
                  {authLoading ? "Working..." : "Logout all"}
                </button>
                <button className="action-button primary" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <span className="helper-text">Login to unlock author and admin routes.</span>
            )}
          </div>
        </nav>

        <section className="route-frame">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

function SuggestionGroup({ title, items, getTo, getPrimary, getSecondary, onSelect }) {
  if (!items?.length) return null;

  return (
    <div className="suggestion-group">
      <span className="suggestion-heading">{title}</span>
      {items.map((item) => (
        <Link
          className="suggestion-row"
          key={getTo(item)}
          to={getTo(item)}
          onClick={onSelect}
        >
          <strong>{getPrimary(item)}</strong>
          <span>{getSecondary(item)}</span>
        </Link>
      ))}
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `tab-chip nav-chip ${isActive ? "active" : ""}`}
    >
      {label}
    </NavLink>
  );
}
