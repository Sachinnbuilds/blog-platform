import { formatTimeAgo } from "../lib/format";
import { initialsForProfile } from "../lib/profile";

export default function CommentThread({ comments, currentUser, editState, onEditStateChange, onEdit, onDelete, loadingKeys }) {
  if (!comments.length) return <p className="empty">No comments yet. Be the first.</p>;

  return (
    <div>
      {comments.map((comment) => {
        const canManage = currentUser && (currentUser.username === comment.user?.username || currentUser.isAdmin);
        const isEditing = String(editState.commentId) === String(comment.id);

        return (
          <div key={comment.id} className="comment">
            <div className="avatar avatar-sm" aria-hidden="true">
              {initialsForProfile(comment.user)}
            </div>
            <div className="comment-body">
              <div>
                <span className="comment-author">{comment.user?.username || "Unknown"}</span>
                <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
              </div>

              {isEditing ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    maxLength={500}
                    value={editState.content}
                    onChange={(e) => onEditStateChange({ commentId: comment.id, content: e.target.value })}
                    style={{ marginBottom: "0.5rem" }}
                  />
                  <p className="text-muted" style={{ marginBottom: "0.5rem" }}>{editState.content.length}/500</p>
                  <div className="btn-row">
                    <button className="btn btn-primary btn-sm"
                      onClick={() => onEdit(comment.id, editState.content)}
                      disabled={loadingKeys[`editComment-${comment.id}`]}>
                      {loadingKeys[`editComment-${comment.id}`] ? "Saving…" : "Save"}
                    </button>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => onEditStateChange({ commentId: "", content: "" })}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.content}</p>
              )}

              {canManage && !isEditing && (
                <div className="comment-actions">
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => onEditStateChange({ commentId: comment.id, content: comment.content })}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => onDelete(comment.id)}
                    disabled={loadingKeys[`deleteComment-${comment.id}`]}>
                    {loadingKeys[`deleteComment-${comment.id}`] ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
