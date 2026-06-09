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
  const [publishingId, setPublishingId] = useState(null);

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

  async function handlePublish(post) {
    setPublishingId(post.id);
    setError("");
    try {
      const draft = await api.getEditablePostBySlug(post.slug);
      await api.updatePost(draft.id, {
        title: draft.title,
        summary: draft.summary || undefined,
        content: draft.content,
        tags: (draft.tags || []).map((tag) => tag.name),
        status: "PUBLISHED",
        thumbnail: draft.thumbnail || undefined
      });
      await loadPosts();
      await loadStats();
    } catch (err) {
      setError(extractApiError(err, "Failed to publish draft."));
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="text-muted">@{user?.username}</p>
          </div>
          <div className="btn-row">
            <Link to="/create" className="btn btn-primary">Write a story</Link>
            {user?.username && <Link to={`/u/${user.username}`} className="btn btn-ghost">View profile</Link>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-cell"><span className="stat-cell-num">{stats?.publishedCount ?? 0}</span><span className="stat-cell-label">Published</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.draftCount ?? 0}</span><span className="stat-cell-label">Drafts</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.totalLikes ?? 0}</span><span className="stat-cell-label">Total likes</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.totalViews ?? 0}</span><span className="stat-cell-label">Total views</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.followerCount ?? 0}</span><span className="stat-cell-label">Followers</span></div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {["published", "drafts"].map((t) => (
            <button key={t} className={`dashboard-tab${tab === t ? " active" : ""}`}
              onClick={() => { setTab(t); setQuery((q) => ({ ...q, page: 0 })); }}>
              {t === "drafts" ? "Drafts" : "Published"}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? <Loader /> : error ? (
          <p className="form-error">{error}</p>
        ) : posts.length === 0 ? (
          <p className="empty">{tab === "drafts" ? "No saved drafts." : "You haven't published anything yet."}</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="dashboard-post-row">
              <div className="dashboard-post-body">
                <div className="dashboard-post-title">{post.title}</div>
                <div className="dashboard-post-meta">
                  {post.tags?.[0] && <span>{post.tags[0].name}</span>}
                  <span>{post.likes || 0} likes</span>
                  <span>{post.viewCount || 0} views</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
              <div className="dashboard-post-actions">
                {post.status !== "DRAFT" && (
                  <Link to={`/posts/${post.slug}`} className="btn btn-ghost btn-sm">View</Link>
                )}
                <Link to={`/edit/${post.slug}`} className="btn btn-ghost btn-sm">Edit</Link>
                {post.status === "DRAFT" && (
                  <button className="btn btn-primary btn-sm" disabled={publishingId === post.id}
                    onClick={() => handlePublish(post)}>
                    {publishingId === post.id ? "…" : "Publish"}
                  </button>
                )}
                <button className="btn btn-danger btn-sm" disabled={deletingId === post.id}
                  onClick={() => handleDelete(post.id)}>
                  {deletingId === post.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))
        )}

        {meta.totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={query.page === 0}
              onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}>← Previous</button>
            <span className="pagination-info">Page {meta.number + 1} of {meta.totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={query.page >= meta.totalPages - 1}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
