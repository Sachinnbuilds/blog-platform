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

  async function loadComments(postId) {
    setCommentsLoading(true);
    try {
      const data = await api.getComments(postId, commentPage);
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
      await loadComments(post.id);
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

  if (loading) {
    return (
      <article className="panel route-detail-card">
        <Loader label="Loading post..." />
      </article>
    );
  }

  if (error) {
    return (
      <article className="panel route-detail-card">
        <p className="error-text">{error}</p>
      </article>
    );
  }

  return (
    <div className="content-grid route-grid route-grid-wide">
      <article className="panel route-detail-card">
        <div className="panel-header">
          <h3>{post?.title}</h3>
          <p>
            {post?.authorUsername ? (
              <Link to={`/u/${post.authorUsername}`}>
                {post.authorDisplayName || post.authorUsername}
              </Link>
            ) : (
              "Unknown author"
            )} | {primaryTag} |{" "}
            <span title={formatAbsoluteDate(post?.createdAt)}>{formatTimeAgo(post?.createdAt)}</span>
            {post?.readTime ? ` | ${post.readTime}` : ""}
          </p>
        </div>

        {post?.tags?.length ? (
          <div className="tag-row">
            {post.tags.map((tag) => (
              <Link className="mini-tag" key={tag.id || tag.slug} to={`/feed?tag=${encodeURIComponent(tag.slug)}`}>
                {tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {post?.thumbnail ? (
          <div className="detail-hero-image">
            <img src={post.thumbnail} alt={post.title} />
          </div>
        ) : null}

        <p className="detail-body">{post?.content}</p>

        <div className="button-row detail-actions">
          <button className="action-button primary" onClick={handleLike} disabled={likeLoading}>
            {likeLoading ? "Working..." : `Like (${post?.likes || 0})`}
          </button>
          <Link className="action-button ghost detail-back-link" to="/feed">
            Back to feed
          </Link>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Comments</h3>
          <p>
            {commentMeta.totalElements} comments | Page {commentMeta.number + 1} of{" "}
            {Math.max(commentMeta.totalPages, 1)}
          </p>
        </div>

        <form className="form-stack" onSubmit={handleAddComment}>
          <label className="field">
            <span className="field-label">Join the conversation</span>
            <textarea
              rows={4}
              maxLength={500}
              value={commentForm}
              onChange={(event) => setCommentForm(event.target.value)}
              placeholder={
                isAuthenticated
                  ? "Write your comment here..."
                  : "Log in to write a comment..."
              }
            />
          </label>
          <div className="button-row">
            <span className="helper-text">{commentForm.length}/500 characters</span>
            <button
              className="action-button primary"
              type="submit"
              disabled={actionLoading.addComment}
            >
              {actionLoading.addComment ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>

        {feedback ? <p className="helper-text">{feedback}</p> : null}

        {commentsLoading ? (
          <Loader label="Loading comments..." />
        ) : (
          <CommentThread
            comments={comments}
            currentUser={user}
            editState={editState}
            onEditStateChange={setEditState}
            onEdit={handleEditComment}
            onDelete={handleDeleteComment}
            loadingKeys={actionLoading}
          />
        )}

        <div className="button-row">
          <button
            className="action-button ghost"
            onClick={() =>
              setCommentPage((current) => ({ ...current, page: Math.max(current.page - 1, 0) }))
            }
            disabled={commentPage.page === 0 || commentsLoading}
          >
            Previous comments
          </button>
          <button
            className="action-button primary"
            onClick={() =>
              setCommentPage((current) => ({ ...current, page: current.page + 1 }))
            }
            disabled={
              commentsLoading || commentMeta.totalPages === 0 || commentPage.page >= commentMeta.totalPages - 1
            }
          >
            Next comments
          </button>
        </div>
      </article>
    </div>
  );
}

