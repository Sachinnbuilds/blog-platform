import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

const tabs = ["posts", "people", "tags"];

function resultCount(results, tab) {
  if (tab === "people") return results.users.length;
  return results[tab]?.length || 0;
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState("posts");
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    if (q.trim()) {
      loadSearch(q);
    } else {
      setResults({ posts: [], users: [], tags: [] });
    }
  }, [searchParams]);

  async function loadSearch(value) {
    setLoading(true);
    setError("");
    try {
      const data = await api.unifiedSearch(value);
      setResults({
        posts: data.posts || [],
        users: data.users || [],
        tags: data.tags || []
      });
    } catch (err) {
      setError(extractApiError(err, "Search failed."));
    } finally {
      setLoading(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  }

  return (
    <div className="page-wrapper">
      <div className="search-page">
        <h1 className="page-title">Search</h1>

        <form onSubmit={submitSearch} className="search-page-bar">
          <input className="search-page-input" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories, writers, tags…" autoFocus />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="search-result-tabs feed-tabs">
          {tabs.map((tab) => (
            <button key={tab} className={`feed-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ marginLeft: "0.35rem", color: "var(--ink-muted)", fontSize: "0.8rem" }}>
                ({resultCount(results, tab)})
              </span>
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? <Loader label="Searching…" /> : (
          <>
            {activeTab === "posts" && (
              results.posts.length === 0 ? <p className="empty">No stories found.</p> :
              results.posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
            {activeTab === "people" && (
              results.users.length === 0 ? <p className="empty">No people found.</p> :
              results.users.map((person) => (
                <Link key={person.username} to={`/u/${person.username}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 0", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
                  <div className="avatar avatar-sm">{initialsForProfile(person)}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{person.displayName || person.username}</div>
                    <div className="text-muted">@{person.username} · {person.followerCount || 0} followers</div>
                  </div>
                </Link>
              ))
            )}
            {activeTab === "tags" && (
              results.tags.length === 0 ? <p className="empty">No tags found.</p> :
              <div className="tag-row" style={{ marginTop: "0.5rem" }}>
                {results.tags.map((tag) => (
                  <Link key={tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`} className="tag tag-link">#{tag.name}</Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
