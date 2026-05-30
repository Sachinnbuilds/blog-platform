import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatAbsoluteDate, formatTimeAgo } from "../lib/format";
import { extractApiError } from "../lib/http";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ totalElements: 0, totalPages: 0, number: 0 });
  const [stats, setStats] = useState(null);
  const [query, setQuery] = useState({ page: 0, size: 6 });
  const [tab, setTab] = useState("published");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPosts();
  }, [query.page, query.size, tab]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setStats(await api.getAuthorStats());
    } catch (err) {
      setError(extractApiError(err, "Failed to load dashboard stats."));
    }
  }

  async function loadPosts() {
    setLoading(true);
    setError("");
    try {
      const data = tab === "drafts"
        ? await api.getDrafts(query)
        : await api.getMyPosts(query);
      setPosts(data.content || []);
      setMeta({
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        number: data.number ?? 0
      });
    } catch (err) {
      setError(extractApiError(err, "Failed to load dashboard posts."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    setDeletingId(postId);
    setError("");
    try {
      await api.deletePost(postId);
      await loadPosts();
      await loadStats();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete post."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel">
        <div className="panel-header">
          <h3>Author Dashboard</h3>
          <p>Manage your posts and move directly into edit flows.</p>
        </div>

        <div className="stats-grid author-stats-grid">
          <div className="stat-card">
            <span>Author</span>
            <strong>{user?.username || "Unknown"}</strong>
          </div>
          <div className="stat-card">
            <span>Published</span>
            <strong>{stats?.publishedCount ?? (tab === "published" ? meta.totalElements : 0)}</strong>
          </div>
          <div className="stat-card">
            <span>Drafts</span>
            <strong>{stats?.draftCount ?? (tab === "drafts" ? meta.totalElements : 0)}</strong>
          </div>
          <div className="stat-card">
            <span>Total likes</span>
            <strong>{stats?.totalLikes ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Total views</span>
            <strong>{stats?.totalViews ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Followers</span>
            <strong>{stats?.followerCount ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span>Role</span>
            <strong>{isAdmin ? "Admin" : "Author"}</strong>
          </div>
        </div>

        <div className="button-row">
          <Link className="action-button primary detail-back-link" to="/create">
            Create new post
          </Link>
          <Link className="action-button ghost detail-back-link" to="/settings/profile">
            Edit profile
          </Link>
          {user?.username ? (
            <Link className="action-button ghost detail-back-link" to={`/u/${user.username}`}>
              View profile
            </Link>
          ) : null}
          <span className="helper-text">
            Page {meta.number + 1} of {Math.max(meta.totalPages, 1)}
          </span>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>{tab === "drafts" ? "Drafts" : "Published Posts"}</h3>
          <p>{tab === "drafts" ? "Private drafts only you can edit." : "Public stories visible on feeds and profile."}</p>
        </div>

        <div className="button-row">
          {["published", "drafts"].map((value) => (
            <button
              key={value}
              className={`action-button ${tab === value ? "primary" : "ghost"}`}
              type="button"
              onClick={() => {
                setTab(value);
                setQuery((current) => ({ ...current, page: 0 }));
              }}
            >
              {value === "drafts" ? "Drafts" : "Published"}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader label="Loading your posts..." />
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : posts.length === 0 ? (
          <p className="empty-state">
            {tab === "drafts" ? "You have no saved drafts." : "You have not published any posts yet."}
          </p>
        ) : (
          <div className="stack-list">
            {posts.map((post) => (
              <article key={post.id} className="story-card dashboard-story-card">
                <div className="story-card-copy">
                  <span className="mini-tag">{post.tags?.[0]?.name || post.status || "Story"}</span>
                  <h4>{post.title}</h4>
                  <p>{post.content}</p>
                  <div className="story-meta">
                    <span title={formatAbsoluteDate(post.createdAt)}>{formatTimeAgo(post.createdAt)}</span>
                    <span>{post.likes || 0} likes</span>
                    <span>{post.slug}</span>
                  </div>
                </div>

                <div className="story-actions">
                  {post.status !== "DRAFT" ? (
                    <Link className="action-button ghost detail-back-link" to={`/posts/${post.slug}`}>
                      View
                    </Link>
                  ) : null}
                  <Link className="action-button ghost detail-back-link" to={`/edit/${post.slug}`}>
                    Edit
                  </Link>
                  <button
                    className="action-button ghost"
                    onClick={() => handleDelete(post.id)}
                    disabled={deletingId === post.id}
                  >
                    {deletingId === post.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="button-row">
          <button
            className="action-button ghost"
            onClick={() => setQuery((current) => ({ ...current, page: Math.max(current.page - 1, 0) }))}
            disabled={query.page === 0 || loading}
          >
            Previous
          </button>
          <button
            className="action-button primary"
            onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
            disabled={loading || meta.totalPages === 0 || query.page >= meta.totalPages - 1}
          >
            Next
          </button>
        </div>
      </article>
    </div>
  );
}
