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
  const [activity, setActivity] = useState([]);
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
      setActivity(await api.getAdminActivity());
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

  return (
    <div className="page-wrapper">
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Admin</h1>
            <p className="text-muted">Platform health, people, and story moderation.</p>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-cell"><span className="stat-cell-num">{user?.username || "-"}</span><span className="stat-cell-label">Current admin</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.totalUsers ?? "-"}</span><span className="stat-cell-label">Users</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{stats?.totalPosts ?? "-"}</span><span className="stat-cell-label">Posts</span></div>
          <div className="stat-cell"><span className="stat-cell-num">{platformStats?.totalTags ?? "-"}</span><span className="stat-cell-label">Tags</span></div>
        </div>

        <div className="dashboard-tabs">
          {adminTabs.map((tab) => (
            <button
              key={tab}
              className={`dashboard-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {feedback ? <p className="form-success">{feedback}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        {activeTab === "stats" ? (
          <>
            <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Platform stats</h2>

            {loading.stats ? (
              <Loader label="Loading admin stats..." />
            ) : (
              <>
                <div className="stats-row">
                  <div className="stat-cell"><span className="stat-cell-num">{stats?.totalUsers ?? 0}</span><span className="stat-cell-label">Total users</span></div>
                  <div className="stat-cell"><span className="stat-cell-num">{platformStats?.totalPosts ?? stats?.totalPosts ?? 0}</span><span className="stat-cell-label">Published posts</span></div>
                  <div className="stat-cell"><span className="stat-cell-num">{platformStats?.totalTags ?? 0}</span><span className="stat-cell-label">Total tags</span></div>
                </div>
                <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Recent admin activity</h2>
                {activity.length === 0 ? (
                  <p className="empty">No admin actions recorded yet.</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="dashboard-post-row">
                      <div className="dashboard-post-body">
                        <div className="dashboard-post-title">{item.details || item.action}</div>
                        <div className="dashboard-post-meta">
                          <span>{item.actorUsername}</span>
                          <span>{item.action}</span>
                          <span>{item.targetType} {item.targetId || ""}</span>
                          <span title={formatAbsoluteDate(item.createdAt)}>{formatTimeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        ) : null}

        {activeTab === "users" ? (
          <>
            <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Users</h2>

            {loading.users ? (
              <Loader label="Loading users..." />
            ) : users.length === 0 ? (
              <p className="empty">No users found.</p>
            ) : (
              <div>
                {users.map((account) => {
                  const isCurrentUser = account.username === user?.username;
                  const isAccountAdmin = account.admin || account.isAdmin;
                  return (
                    <div key={account.id} className="dashboard-post-row">
                      <div className="dashboard-post-body">
                        <div className="dashboard-post-title">{account.username}</div>
                        <div className="dashboard-post-meta">
                          <span>{account.email}</span>
                          <span>{isAccountAdmin ? "Admin" : "User"}</span>
                          <span>ID {account.id}</span>
                        </div>
                      </div>
                      <div className="dashboard-post-actions">
                        {!isAccountAdmin ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleMakeAdmin(account.id)}
                            disabled={actionLoading[`make-admin-${account.id}`]}
                            type="button"
                          >
                            {actionLoading[`make-admin-${account.id}`] ? "Promoting..." : "Make admin"}
                          </button>
                        ) : null}
                        <button
                          className="btn btn-danger btn-sm"
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
            <h2 className="section-heading" style={{ fontSize: "1.1rem" }}>Post moderation</h2>
            <p className="text-muted" style={{ marginBottom: "1rem" }}>{postsMeta.totalElements} posts total.</p>

            {loading.posts ? (
              <Loader label="Loading posts..." />
            ) : posts.length === 0 ? (
              <p className="empty">No posts found.</p>
            ) : (
              <div>
                {posts.map((post) => (
                  <div key={post.id} className="dashboard-post-row">
                    <div className="dashboard-post-body">
                      <div className="dashboard-post-title">{post.title}</div>
                      <div className="dashboard-post-meta">
                        <span>{post.tags?.[0]?.name || "Story"}</span>
                        <span>{post.authorDisplayName || post.authorUsername || "Unknown author"}</span>
                        <span title={formatAbsoluteDate(post.createdAt)}>{formatTimeAgo(post.createdAt)}</span>
                        <span>{post.likes || 0} likes</span>
                        <span>{post.viewCount || 0} views</span>
                      </div>
                    </div>

                    <div className="dashboard-post-actions">
                      <Link className="btn btn-ghost btn-sm" to={`/posts/${post.slug}`}>View</Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={actionLoading[`delete-post-${post.id}`]}
                        type="button"
                      >
                        {actionLoading[`delete-post-${post.id}`] ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pagination">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => loadPosts(Math.max(postsMeta.page - 1, 0))}
                disabled={loading.posts || postsMeta.page === 0}
                type="button"
              >
                Previous
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => loadPosts(postsMeta.page + 1)}
                disabled={loading.posts || postsMeta.totalPages === 0 || postsMeta.page >= postsMeta.totalPages - 1}
                type="button"
              >
                Next
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
