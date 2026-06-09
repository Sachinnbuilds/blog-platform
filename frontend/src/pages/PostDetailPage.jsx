import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CommentThread from "../components/CommentThread";
import Loader from "../components/Loader";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { formatAbsoluteDate, formatTimeAgo } from "../lib/format";
import { extractApiError } from "../lib/http";

export default function PostDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentMeta, setCommentMeta] = useState({ totalElements: 0, totalPages: 0, number: 0 });
  const [commentPage, setCommentPage] = useState({ page: 0, size: 5 });
  const [commentForm, setCommentForm] = useState("");
  const [editState, setEditState] = useState({ commentId: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const primaryTag = post?.tags?.[0]?.name || "Story";

  useEffect(() => {
    loadPost();
  }, [slug]);

  useEffect(() => {
    if (post?.id) {
      loadComments(post.id);
    }
  }, [post?.id, commentPage.page, commentPage.size]);

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPostBySlug(slug);
      setPost(data);
    } catch (err) {
      setError(extractApiError(err, "Failed to load post."));
    } finally {
      setLoading(false);
    }
  }

  async function loadComments(postId, pageOverride = commentPage) {
    setCommentsLoading(true);
    try {
      const data = await api.getComments(postId, pageOverride);
      setComments(data.content || []);
      setCommentMeta({
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        number: data.number ?? 0
      });
    } catch (err) {
      setFeedback(extractApiError(err, "Failed to load comments."));
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleLike() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/posts/${slug}` } } });
      return;
    }

    setLikeLoading(true);
    try {
      const updated = await api.likePost(post.id);
      setPost(updated);
    } catch (err) {
      setFeedback(extractApiError(err, "Failed to update like."));
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/posts/${slug}` } } });
      return;
    }

    setActionLoading((current) => ({ ...current, addComment: true }));
    try {
      await api.addComment(post.id, commentForm);
      setCommentForm("");
      setCommentPage((current) => ({ ...current, page: 0 }));
      await loadComments(post.id, { ...commentPage, page: 0 });
      setFeedback("Comment added.");
    } catch (err) {
      setFeedback(extractApiError(err, "Failed to add comment."));
    } finally {
      setActionLoading((current) => ({ ...current, addComment: false }));
    }
  }

  async function handleEditComment(commentId, content) {
    setActionLoading((current) => ({ ...current, [`editComment-${commentId}`]: true }));
    try {
      await api.editComment(commentId, content);
      setEditState({ commentId: "", content: "" });
      await loadComments(post.id);
      setFeedback("Comment updated.");
    } catch (err) {
      setFeedback(extractApiError(err, "Failed to update comment."));
    } finally {
      setActionLoading((current) => ({ ...current, [`editComment-${commentId}`]: false }));
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm(`Delete comment #${commentId}?`)) {
      return;
    }

    setActionLoading((current) => ({ ...current, [`deleteComment-${commentId}`]: true }));
    try {
      await api.deleteComment(commentId);
      await loadComments(post.id);
      setFeedback("Comment deleted.");
    } catch (err) {
      setFeedback(extractApiError(err, "Failed to delete comment."));
    } finally {
      setActionLoading((current) => ({ ...current, [`deleteComment-${commentId}`]: false }));
    }
  }

  if (loading) return <div className="page-wrapper-narrow"><Loader label="Loading story…" /></div>;

  if (error) return (
    <div className="page-wrapper-narrow" style={{ paddingTop: "2rem" }}>
      <p style={{ color: "var(--red)" }}>{error}</p>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="post-detail-layout">
        {/* Article */}
        <article>
          <div className="post-detail-header">
            {post?.tags?.length > 0 && (
              <div className="tag-row" style={{ marginBottom: "1rem" }}>
                {post.tags.map((tag) => (
                  <Link key={tag.id || tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`} className="tag tag-link">{tag.name}</Link>
                ))}
              </div>
            )}
            <h1 className="post-detail-title">{post?.title}</h1>
            {post?.summary && <p className="post-detail-summary">{post.summary}</p>}
            <div className="post-detail-byline">
              <div className="avatar avatar-sm" aria-hidden="true">{(post?.authorDisplayName || post?.authorUsername || "?")[0]?.toUpperCase()}</div>
              {post?.authorUsername ? (
                <Link to={`/u/${post.authorUsername}`} className="post-detail-byline-author">
                  {post.authorDisplayName || post.authorUsername}
                </Link>
              ) : <span className="post-detail-byline-author">Unknown author</span>}
              <span className="post-detail-byline-meta">
                {post?.readTime && <>{post.readTime} · </>}
                <span title={post?.createdAt}>{formatTimeAgo(post?.createdAt)}</span>
              </span>
            </div>
          </div>

          {post?.thumbnail && (
            <div className="post-hero-image">
              <img src={post.thumbnail} alt={post.title} />
            </div>
          )}

          <div className="post-body">{post?.content}</div>

          <div className="post-actions-bar">
            <button className={`like-btn${post?.likedByCurrentUser ? " liked" : ""}`} onClick={handleLike} disabled={likeLoading}>
              ♥ {post?.likes || 0}
            </button>
            {user?.username === post?.authorUsername && (
              <Link to={`/edit/${post?.slug}`} className="btn btn-ghost btn-sm">Edit story</Link>
            )}
            <Link to="/feed" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>← Back to feed</Link>
          </div>

          {/* Comments */}
          <div className="comments-section">
            <h2 className="comments-heading">Comments ({commentMeta.totalElements})</h2>

            <form className="comment-form" onSubmit={handleAddComment}>
              <div className="form-field">
                <label className="form-label">Leave a comment</label>
                <textarea className="form-textarea" rows={3} maxLength={500}
                  value={commentForm}
                  onChange={(e) => setCommentForm(e.target.value)}
                  placeholder={isAuthenticated ? "Share your thoughts…" : "Sign in to comment"}
                />
                <p className="form-hint">{commentForm.length}/500</p>
              </div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={actionLoading.addComment}>
                {actionLoading.addComment ? "Posting…" : "Post comment"}
              </button>
            </form>

            {commentsLoading ? <Loader label="Loading comments…" /> : (
              <CommentThread comments={comments} currentUser={user} editState={editState}
                onEditStateChange={setEditState} onEdit={handleEditComment}
                onDelete={handleDeleteComment} loadingKeys={actionLoading} />
            )}

            {commentMeta.totalPages > 1 && (
              <div className="pagination" style={{ paddingTop: "1.5rem" }}>
                <button className="btn btn-ghost btn-sm" disabled={commentPage.page === 0}
                  onClick={() => setCommentPage((p) => ({ ...p, page: p.page - 1 }))}>← Previous</button>
                <span className="pagination-info">Page {commentMeta.number + 1} of {commentMeta.totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={commentPage.page >= commentMeta.totalPages - 1}
                  onClick={() => setCommentPage((p) => ({ ...p, page: p.page + 1 }))}>Next →</button>
              </div>
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside>
          <div className="post-detail-sidebar-sticky">
            {post?.authorUsername && (
              <div className="sidebar-section">
                <div className="sidebar-heading">About the author</div>
                <Link to={`/u/${post.authorUsername}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", marginBottom: "0.75rem" }}>
                  <div className="avatar avatar-md">{(post.authorDisplayName || post.authorUsername)[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{post.authorDisplayName || post.authorUsername}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)" }}>@{post.authorUsername}</div>
                  </div>
                </Link>
              </div>
            )}
            {post?.tags?.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-heading">Filed under</div>
                <div className="tag-row">
                  {post.tags.map((tag) => (
                    <Link key={tag.id || tag.slug} to={`/tag/${encodeURIComponent(tag.slug)}`} className="tag tag-link">{tag.name}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
