import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import PostCard from "../components/PostCard";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { extractApiError } from "../lib/http";
import { initialsForProfile } from "../lib/profile";

const initialQuery = { keyword: "", tag: "", tab: "trending", page: 0, size: 8 };

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = useState(false);
  const [followingWriter, setFollowingWriter] = useState("");
  const [writerFollowState, setWriterFollowState] = useState({});
  const [writerError, setWriterError] = useState("");

  useEffect(() => { api.getTrendingTags().then((d) => setTags(d || [])).catch(() => {}); }, []);

  useEffect(() => {
    const tag = searchParams.get("tag") || "";
    if (tag) setQuery((q) => ({ ...q, tag, page: 0 }));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => loadPosts(), 400);
    return () => clearTimeout(t);
  }, [query.keyword, query.tag, query.tab, query.page, user]);

  async function loadPosts() {
    setLoading(true);
    try {
      let data;
      if (query.keyword) {
        data = await api.searchPosts(query.keyword, { tags: query.tag || undefined, sort: query.tab === "trending" ? "trending" : "latest", page: query.page, size: query.size });
      } else if (query.tag) {
        data = await api.getPostsByTag(query.tag, { page: query.page, size: query.size });
      } else if (query.tab === "following" || query.tab === "for_you") {
        data = user ? await api.getFeed({ type: query.tab, page: query.page, size: query.size }) : await api.getTrendingPosts({ page: query.page, size: query.size });
      } else if (query.tab === "trending") {
        data = await api.getTrendingPosts({ page: query.page, size: query.size });
      } else {
        data = await api.getPosts({ page: query.page, size: query.size });
      }
      setPosts(data.content || []);
      setMeta({ totalElements: data.totalElements ?? 0, totalPages: data.totalPages ?? 0, number: data.number ?? 0 });
    } catch (err) {
      setPosts([]); setMeta({ totalElements: 0, totalPages: 0, number: 0 });
    } finally { setLoading(false); }
  }

  const suggestedWriters = uniqueAuthors(posts, user?.username).slice(0, 5);

  useEffect(() => {
    if (!user || suggestedWriters.length === 0) {
      setWriterFollowState({});
      return;
    }

    let active = true;
    Promise.all(
      suggestedWriters.map(async (writer) => {
        try {
          const status = await api.isFollowing(writer.username);
          return [writer.username, Boolean(status.isFollowing)];
        } catch {
          return [writer.username, false];
        }
      })
    ).then((entries) => {
      if (active) setWriterFollowState(Object.fromEntries(entries));
    });

    return () => { active = false; };
  }, [user, suggestedWriters.map((writer) => writer.username).join("|")]);

  async function toggleWriterFollow(username) {
    setFollowingWriter(username);
    setWriterError("");
    const wasFollowing = Boolean(writerFollowState[username]);
    try {
      if (wasFollowing) {
        await api.unfollowUser(username);
      } else {
        await api.followUser(username);
      }
      setWriterFollowState((state) => ({ ...state, [username]: !wasFollowing }));
    } catch (err) {
      setWriterError(extractApiError(err, "Failed to update follow status."));
    } finally {
      setFollowingWriter("");
    }
  }

  return (
    <div className="page-wrapper">
      <div className="feed-layout">
        {/* Main feed */}
        <div className="feed-main">
          {/* Tabs */}
          <div className="feed-tabs">
            {["trending", "latest", "following", "for_you"].map((tab) => (
              <button key={tab}
                className={`feed-tab${query.tab === tab ? " active" : ""}`}
                disabled={!user && (tab === "following" || tab === "for_you")}
                onClick={() => setQuery((q) => ({ ...q, tab, tag: "", page: 0 }))}>
                {tab === "for_you" ? "For you" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tag filter row */}
          {tags.length > 0 && (
            <div className="tag-row" style={{ marginBottom: "1.5rem" }}>
              <button className={`tag${!query.tag ? " tag-link" : " tag-link"}`}
                style={!query.tag ? { background: "var(--ink)", color: "white", borderColor: "var(--ink)" } : {}}
                onClick={() => setQuery((q) => ({ ...q, tag: "", page: 0 }))}>All</button>
              {tags.slice(0, 8).map((tag) => (
                <button key={tag.slug} className="tag tag-link"
                  style={query.tag === tag.slug ? { background: "var(--ink)", color: "white", borderColor: "var(--ink)" } : {}}
                  onClick={() => setQuery((q) => ({ ...q, tag: tag.slug, page: 0 }))}>
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Posts */}
          {loading ? <Loader /> : posts.length === 0 ? (
            <p className="empty">No stories found for this selection.</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}

          {/* Pagination */}
          {!loading && (meta.totalPages > 1) && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={query.page === 0}
                onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>← Previous</button>
              <span className="pagination-info">Page {meta.number + 1} of {meta.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={query.page >= meta.totalPages - 1}
                onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>Next →</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="feed-sidebar">
          {tags.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-heading">Trending topics</div>
              <div className="tag-row">
                {tags.slice(0, 12).map((tag) => (
                  <Link key={tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`} className="tag tag-link">{tag.name}</Link>
                ))}
              </div>
            </div>
          )}

          {suggestedWriters.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-heading">Writers in this feed</div>
              {writerError && <p className="form-error">{writerError}</p>}
              {suggestedWriters.map((w) => (
                <div key={w.username} className="sidebar-writer">
                  <Link to={`/u/${w.username}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, textDecoration: "none", minWidth: 0 }}>
                    <div className="avatar avatar-sm">{initialsForProfile(w)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="sidebar-writer-name">{w.displayName || w.username}</div>
                      <div className="sidebar-writer-handle">@{w.username}</div>
                    </div>
                  </Link>
                  {user && (
                    <button className="btn btn-ghost btn-sm" disabled={followingWriter === w.username}
                      onClick={() => toggleWriterFollow(w.username)}>
                      {followingWriter === w.username ? "…" : writerFollowState[w.username] ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function uniqueAuthors(posts, currentUsername) {
  const seen = new Map();
  posts.forEach((p) => {
    const username = p.authorUsername || p.author?.username;
    if (username && username !== currentUsername && !seen.has(username))
      seen.set(username, { username, displayName: p.authorDisplayName || p.author?.displayName || username });
  });
  return Array.from(seen.values());
}
