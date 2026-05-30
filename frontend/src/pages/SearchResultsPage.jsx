import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

const tabs = ["posts", "people", "tags"];

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
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel route-hero-panel">
        <div className="panel-header">
          <h3>Search</h3>
          <p>Find stories, people, and tags across the platform.</p>
        </div>

        <form className="form-stack" onSubmit={submitSearch}>
          <label className="field">
            <span className="field-label">Search query</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stories, writers, tags"
            />
          </label>
          <div className="button-row">
            <button className="action-button primary" type="submit">
              Search
            </button>
            <Link className="action-button ghost" to="/feed">
              Browse feed
            </Link>
          </div>
        </form>

        <div className="button-row">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`action-button ${activeTab === tab ? "primary" : "ghost"}`}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {error ? <p className="error-text">{error}</p> : null}
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
          <p>{resultCount(results, activeTab)} results.</p>
        </div>

        {loading ? <Loader label="Searching..." /> : null}

        {!loading && activeTab === "posts" ? (
          results.posts.length === 0 ? (
            <p className="empty-state">No stories found.</p>
          ) : (
            <div className="post-grid">
              {results.posts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )
        ) : null}

        {!loading && activeTab === "people" ? (
          results.users.length === 0 ? (
            <p className="empty-state">No people found.</p>
          ) : (
            <div className="stack-list">
              {results.users.map((person) => (
                <Link className="list-row list-row-wide post-card-link" key={person.username} to={`/u/${person.username}`}>
                  <div className="profile-header compact-profile-header">
                    <div className="avatar-circle small">{initialsForProfile(person)}</div>
                    <div>
                      <strong>{person.displayName || person.username}</strong>
                      <p>@{person.username}</p>
                    </div>
                  </div>
                  <span>{person.followerCount || 0} followers</span>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {!loading && activeTab === "tags" ? (
          results.tags.length === 0 ? (
            <p className="empty-state">No tags found.</p>
          ) : (
            <div className="tag-row">
              {results.tags.map((tag) => (
                <Link className="mini-tag" key={tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`}>
                  {tag.name}
                </Link>
              ))}
            </div>
          )
        ) : null}
      </article>
    </div>
  );
}

function resultCount(results, tab) {
  if (tab === "people") return results.users.length;
  return results[tab]?.length || 0;
}
