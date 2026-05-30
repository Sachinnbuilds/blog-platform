import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatAbsoluteDate, formatTimeAgo } from "../lib/format";
import { extractApiError } from "../lib/http";

const adminTabs = ["stats", "users", "posts"];

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsMeta, setPostsMeta] = useState({ page: 0, size: 8, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState({ stats: true, users: false, posts: false });
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      loadUsers();
    }
    if (activeTab === "posts" && posts.length === 0) {
      loadPosts(postsMeta.page);
    }
  }, [activeTab]);

  async function loadStats() {
    setLoading((current) => ({ ...current, stats: true }));
    setError("");
    try {
      const [adminData, platformData] = await Promise.all([
        api.getAdminStats(),
        api.getPlatformStats()
      ]);
      setStats(adminData);
      setPlatformStats(platformData);
    } catch (err) {
      setError(extractApiError(err, "Failed to load admin stats."));
    } finally {
      setLoading((current) => ({ ...current, stats: false }));
    }
  }

  async function loadUsers() {
    setLoading((current) => ({ ...current, users: true }));
    setError("");
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(extractApiError(err, "Failed to load admin users."));
    } finally {
      setLoading((current) => ({ ...current, users: false }));
    }
  }

  async function loadPosts(page = 0) {
    setLoading((current) => ({ ...current, posts: true }));
    setError("");
    try {
      const data = await api.getPosts({ page, size: postsMeta.size });
      setPosts(data.content || []);
      setPostsMeta((current) => ({
        ...current,
        page: data.number ?? page,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0
      }));
    } catch (err) {
      setError(extractApiError(err, "Failed to load posts for moderation."));
    } finally {
      setLoading((current) => ({ ...current, posts: false }));
    }
  }

  async function handleMakeAdmin(userId) {
    setActionLoading((current) => ({ ...current, [`make-admin-${userId}`]: true }));
    setFeedback("");
    try {
      const result = await api.makeAdmin(userId);
      setFeedback(typeof result === "string" ? result : "User promoted.");
      await loadUsers();
    } catch (err) {
      setError(extractApiError(err, "Failed to promote user."));
    } finally {
      setActionLoading((current) => ({ ...current, [`make-admin-${userId}`]: false }));
    }
  }

  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Delete user ${username}? This cannot be undone.`)) {
      return;
    }

    setActionLoading((current) => ({ ...current, [`delete-user-${userId}`]: true }));
    setFeedback("");
    try {
      const result = await api.deleteAdminUser(userId);
      setFeedback(typeof result === "string" ? result : "User deleted.");
      await loadUsers();
      await loadStats();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete user."));
    } finally {
      setActionLoading((current) => ({ ...current, [`delete-user-${userId}`]: false }));
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm(`Delete post #${postId}? This cannot be undone.`)) {
      return;
    }

    setActionLoading((current) => ({ ...current, [`delete-post-${postId}`]: true }));
    setFeedback("");
    try {
      const result = await api.deleteAdminPost(postId);
      setFeedback(typeof result === "string" ? result : "Post deleted.");
      await loadPosts(postsMeta.page);
      await loadStats();
    } catch (err) {
      setError(extractApiError(err, "Failed to delete post."));
    } finally {
      setActionLoading((current) => ({ ...current, [`delete-post-${postId}`]: false }));
    }
  }

  async function handleCleanup() {
    if (!window.confirm("Run cleanup for test data now?")) {
      return;
    }

    setActionLoading((current) => ({ ...current, cleanup: true }));
    setFeedback("");
    try {
      const result = await api.cleanupAdminData();
      setFeedback(`${result.message} Deleted count: ${result.deletedCount}`);
      await loadStats();
      if (activeTab === "posts") {
        await loadPosts(postsMeta.page);
      }
    } catch (err) {
      setError(extractApiError(err, "Failed to clean test data."));
    } finally {
      setActionLoading((current) => ({ ...current, cleanup: false }));
    }
  }

  return (
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel">
        <div className="panel-header">
          <h3>Admin Panel</h3>
          <p>Protected workspace for platform health, people, and story moderation.</p>
        </div>

        <div className="stats-grid author-stats-grid">
          <div className="stat-card">
            <span>Current admin</span>
            <strong>{user?.username || "Unknown"}</strong>
          </div>
          <div className="stat-card">
            <span>Total users</span>
            <strong>{stats?.totalUsers ?? "-"}</strong>
          </div>
          <div className="stat-card">
            <span>Total posts</span>
            <strong>{stats?.totalPosts ?? "-"}</strong>
          </div>
          <div className="stat-card">
            <span>Total tags</span>
            <strong>{platformStats?.totalTags ?? "-"}</strong>
          </div>
          <div className="stat-card">
            <span>Moderation</span>
            <strong>Active</strong>
          </div>
        </div>

        <div className="button-row">
          {adminTabs.map((tab) => (
            <button
              key={tab}
              className={`tab-chip nav-chip ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
          <button
            className="action-button ghost"
            onClick={handleCleanup}
            disabled={actionLoading.cleanup}
            type="button"
          >
            {actionLoading.cleanup ? "Cleaning..." : "Cleanup test data"}
          </button>
        </div>

        {feedback ? <p className="success-text">{feedback}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </article>

      <article className="panel">
        {activeTab === "stats" ? (
          <>
            <div className="panel-header">
              <h3>Platform Stats</h3>
              <p>Publishing, identity, and discovery totals.</p>
            </div>

            {loading.stats ? (
              <Loader label="Loading admin stats..." />
            ) : (
              <div className="stack-list compact-stack">
                <div className="list-row">
                  <strong>Total users</strong>
                  <span>{stats?.totalUsers ?? 0}</span>
                </div>
                <div className="list-row">
                  <strong>Published posts</strong>
                  <span>{platformStats?.totalPosts ?? stats?.totalPosts ?? 0}</span>
                </div>
                <div className="list-row">
                  <strong>Total tags</strong>
                  <span>{platformStats?.totalTags ?? 0}</span>
                </div>
              </div>
            )}
          </>
        ) : null}

        {activeTab === "users" ? (
          <>
            <div className="panel-header">
              <h3>Users</h3>
              <p>Promote users and remove accounts when needed.</p>
            </div>

            {loading.users ? (
              <Loader label="Loading users..." />
            ) : users.length === 0 ? (
              <p className="empty-state">No users found.</p>
            ) : (
              <div className="stack-list compact-stack">
                {users.map((account) => {
                  const isCurrentUser = account.username === user?.username;
                  return (
                    <div key={account.id} className="list-row list-row-wide">
                      <div>
                        <strong>{account.username}</strong>
                        <p>{account.email}</p>
                      </div>
                      <div className="row-meta">
                        <span>{account.admin || account.isAdmin ? "Admin" : "User"}</span>
                        <span>ID {account.id}</span>
                      </div>
                      <div className="admin-action-stack">
                        {!account.admin && !account.isAdmin ? (
                          <button
                            className="action-button ghost"
                            onClick={() => handleMakeAdmin(account.id)}
                            disabled={actionLoading[`make-admin-${account.id}`]}
                            type="button"
                          >
                            {actionLoading[`make-admin-${account.id}`] ? "Promoting..." : "Make admin"}
                          </button>
                        ) : null}
                        <button
                          className="action-button ghost"
                          onClick={() => handleDeleteUser(account.id, account.username)}
                          disabled={isCurrentUser || actionLoading[`delete-user-${account.id}`]}
                          type="button"
                        >
                          {isCurrentUser
                            ? "Current admin"
                            : actionLoading[`delete-user-${account.id}`]
                              ? "Deleting..."
                              : "Delete"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}

        {activeTab === "posts" ? (
          <>
            <div className="panel-header">
              <h3>Post Moderation</h3>
              <p>
                Public posts list for admin review. {postsMeta.totalElements} posts total.
              </p>
            </div>

            {loading.posts ? (
              <Loader label="Loading posts..." />
            ) : posts.length === 0 ? (
              <p className="empty-state">No posts found.</p>
            ) : (
              <div className="stack-list">
                {posts.map((post) => (
                  <article key={post.id} className="story-card dashboard-story-card">
                    <div className="story-card-copy">
                      <span className="mini-tag">{post.tags?.[0]?.name || "Story"}</span>
                      <h4>{post.title}</h4>
                      <p>{post.summary || "No summary provided."}</p>
                      <div className="story-meta">
                        <span>{post.authorDisplayName || post.authorUsername || "Unknown author"}</span>
                        <span title={formatAbsoluteDate(post.createdAt)}>{formatTimeAgo(post.createdAt)}</span>
                        <span>{post.likes || 0} likes</span>
                        <span>{post.viewCount || 0} views</span>
                      </div>
                    </div>

                    <div className="story-actions">
                      <Link className="action-button ghost detail-back-link" to={`/posts/${post.slug}`}>
                        View
                      </Link>
                      <button
                        className="action-button ghost"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={actionLoading[`delete-post-${post.id}`]}
                        type="button"
                      >
                        {actionLoading[`delete-post-${post.id}`] ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="button-row">
              <button
                className="action-button ghost"
                onClick={() => loadPosts(Math.max(postsMeta.page - 1, 0))}
                disabled={loading.posts || postsMeta.page === 0}
                type="button"
              >
                Previous
              </button>
              <button
                className="action-button primary"
                onClick={() => loadPosts(postsMeta.page + 1)}
                disabled={loading.posts || postsMeta.totalPages === 0 || postsMeta.page >= postsMeta.totalPages - 1}
                type="button"
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
