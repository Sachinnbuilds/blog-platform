import { formatAbsoluteDate, formatTimeAgo } from "../lib/format";

export default function CommentThread({
  comments,
  currentUser,
  editState,
  onEditStateChange,
  onEdit,
  onDelete,
  loadingKeys
}) {
  if (!comments.length) {
    return <p className="empty-state">No comments yet. Start the conversation.</p>;
  }

  return (
    <div className="stack-list">
      {comments.map((comment) => {
        const canManage =
          currentUser &&
          (currentUser.username === comment.user?.username || currentUser.isAdmin);
        const isEditing = String(editState.commentId) === String(comment.id);

        return (
          <article key={comment.id} className="story-card comment-card public-comment-card">
            <div className="story-card-copy">
              <span className="mini-tag">Comment</span>
              {isEditing ? (
                <div className="comment-edit-stack">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editState.content}
                    onChange={(event) =>
                      onEditStateChange({
                        commentId: comment.id,
                        content: event.target.value
                      })
                    }
                  />
                  <p className="helper-text">{editState.content.length}/500 characters</p>
                  <div className="button-row">
                    <button
                      className="action-button primary"
                      onClick={() => onEdit(comment.id, editState.content)}
                      disabled={loadingKeys[`editComment-${comment.id}`]}
                    >
                      {loadingKeys[`editComment-${comment.id}`] ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="action-button ghost"
                      onClick={() => onEditStateChange({ commentId: "", content: "" })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p>{comment.content}</p>
              )}
              <div className="story-meta">
                <span>{comment.user?.username || "Unknown user"}</span>
                <span title={formatAbsoluteDate(comment.createdAt)}>{formatTimeAgo(comment.createdAt)}</span>
              </div>
            </div>

            {canManage && !isEditing ? (
              <div className="story-actions">
                <button
                  className="action-button ghost"
                  onClick={() =>
                    onEditStateChange({
                      commentId: comment.id,
                      content: comment.content
                    })
                  }
                >
                  Edit
                </button>
                <button
                  className="action-button ghost"
                  onClick={() => onDelete(comment.id)}
                  disabled={loadingKeys[`deleteComment-${comment.id}`]}
                >
                  {loadingKeys[`deleteComment-${comment.id}`] ? "Deleting..." : "Delete"}
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
